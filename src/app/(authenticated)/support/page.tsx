"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare, Clock, CheckCircle, ArrowLeft } from "lucide-react"

interface Ticket {
    id: string
    subject: string
    status: 'open' | 'replied' | 'closed'
    created_at: string
    client_id: string
    client_email?: string // For admin view
}

interface Message {
    id: string
    message: string
    sender_id: string
    created_at: string
    is_admin_reply: boolean
}

export default function SupportPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role

    const [tickets, setTickets] = useState<Ticket[]>([])
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")

    // New Ticket Form
    const [subject, setSubject] = useState("")
    const [initialMessage, setInitialMessage] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        if (user) fetchTickets()
    }, [user, isAdmin])

    useEffect(() => {
        if (selectedTicket) fetchMessages(selectedTicket.id)
    }, [selectedTicket])

    const fetchTickets = async () => {
        let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false })

        if (!isAdmin) {
            query = query.eq('client_id', user?.id)
        } else {
            // If admin, we might want client details too. 
            // Since we can't do easy joins without setting up relations properly in types, 
            // we'll fetch basic tickets first.
        }

        const { data, error } = await query
        if (data) setTickets(data)
    }

    const fetchMessages = async (ticketId: string) => {
        const { data } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true })

        if (data) setMessages(data)
    }

    const createTicket = async () => {
        if (!subject || !initialMessage) return

        try {
            // 1. Create Ticket
            const { data: ticket, error: tError } = await supabase
                .from('support_tickets')
                .insert([{
                    client_id: user?.id,
                    subject: subject,
                    status: 'open'
                }])
                .select()
                .single()

            if (tError) throw tError

            // 2. Create Initial Message
            const { error: mError } = await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: ticket.id,
                    sender_id: user?.id,
                    message: initialMessage,
                    is_admin_reply: false
                }])

            if (mError) throw mError

            // 3. Create Notification for Admin (Mock logic as we don't know admin ID)
            // supabase.from('notifications').insert(...)

            setSubject("")
            setInitialMessage("")
            setIsCreating(false)
            fetchTickets()
        } catch (error) {
            console.error("Error creating ticket:", error)
        }
    }

    const sendMessage = async () => {
        if (!newMessage || !selectedTicket) return

        try {
            await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: selectedTicket.id,
                    sender_id: user?.id,
                    message: newMessage,
                    is_admin_reply: isAdmin
                }])

            // Update ticket status
            const newStatus = isAdmin ? 'replied' : 'open'
            await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', selectedTicket.id)

            // Notify logic would go here
            if (isAdmin) {
                await supabase.from('notifications').insert([{
                    user_id: selectedTicket.client_id,
                    title: "Nova resposta do Suporte",
                    message: `Admin respondeu ao ticket: ${selectedTicket.subject}`,
                    link: "/support"
                }])
            }

            setNewMessage("")
            fetchMessages(selectedTicket.id)
            fetchTickets() // Refresh statuses
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] p-2 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4">
            {/* Left Sidebar: Ticket List */}
            {/* On mobile: Hidden if creating or a ticket is selected (Detail View Active) */}
            <Card className={`w-full md:w-1/3 flex flex-col ${(isCreating || selectedTicket) ? 'hidden md:flex' : 'flex'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Chamados</CardTitle>
                    {!isAdmin && (
                        <Button size="sm" onClick={() => { setSelectedTicket(null); setIsCreating(true); }}>
                            + Novo
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-1 p-2">
                            {tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => { setSelectedTicket(ticket); setIsCreating(false); }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm line-clamp-1">{ticket.subject}</span>
                                        <div className="flex items-center gap-2">
                                            {/* Status Badge */}
                                            {ticket.status === 'open' && <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-[10px]">Aberto</Badge>}
                                            {ticket.status === 'replied' && <Badge variant="default" className="bg-blue-500 text-[10px]">Respondido</Badge>}
                                            {ticket.status === 'closed' && <Badge variant="secondary" className="text-[10px]">Fechado</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>#{ticket.id.slice(0, 4)}</span>
                                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {tickets.length === 0 && (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    Nenhum chamado encontrado.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Right Area: Content */}
            {/* On mobile: Hidden if NOT creating and NO ticket selected (List View Active) */}
            <Card className={`flex-1 w-full flex flex-col ${(!isCreating && !selectedTicket) ? 'hidden md:flex' : 'flex'}`}>
                {isCreating ? (
                    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
                        <div className="flex items-center gap-2 md:block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden p-0 h-auto"
                                onClick={() => setIsCreating(false)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold">Novo Chamado</h2>
                                <p className="text-sm text-muted-foreground">Descreva sua solicitação para a equipe administrativa.</p>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assunto</label>
                                <Input
                                    placeholder="Ex: Dúvida sobre faturamento"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mensagem</label>
                                <Textarea
                                    placeholder="Descreva detalhadamente..."
                                    className="min-h-[200px]"
                                    value={initialMessage}
                                    onChange={e => setInitialMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                <Button onClick={createTicket} disabled={!subject || !initialMessage}>Enviar Solicitação</Button>
                            </div>
                        </div>
                    </div>
                ) : selectedTicket ? (
                    <>
                        <CardHeader className="border-b bg-muted/20 pb-4 p-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden p-0 h-auto mr-2"
                                    onClick={() => setSelectedTicket(null)}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex-1 overflow-hidden">
                                    <CardTitle className="truncate text-lg">{selectedTicket.subject}</CardTitle>
                                    <CardDescription>Ticket #{selectedTicket.id}</CardDescription>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {isAdmin && (
                                        <Button variant="outline" size="sm" className="hidden sm:flex">Marcar como Resolvido</Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {messages.map(msg => {
                                        const isMe = user?.id === msg.sender_id
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[85%] md:max-w-[80%] rounded-lg p-3 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                            <div className="p-3 md:p-4 border-t bg-background">
                                <div className="flex gap-2">
                                    <Textarea
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="min-h-[50px] md:min-h-[60px]"
                                    />
                                    <Button className="h-auto px-3 md:px-4" onClick={sendMessage}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground gap-2">
                        <MessageSquare className="h-12 w-12 opacity-20" />
                        <p className="text-center px-4">Selecione um chamado para visualizar ou inicie um novo.</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
