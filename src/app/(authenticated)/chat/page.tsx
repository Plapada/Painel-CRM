"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import MessageConversation, { ChatMessage, ChatUser } from "@/components/ui/messaging-conversation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, User, Tag, MessageSquare, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ChatSession {
    session_id: string
    client_name: string
    client_phone: string
    last_message: string
    last_message_time: string
    unread_count?: number
}

export default function ChatPage() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [clientDetails, setClientDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showDetails, setShowDetails] = useState(false)
    const [showMobileChat, setShowMobileChat] = useState(false)

    useEffect(() => {
        if (user?.clinic_id) {
            fetchSessions()

            // Subscribe to chat updates
            const channel = supabase
                .channel('chat-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'n8n_chat_histories' }, () => {
                    fetchSessions()
                    if (selectedSession) {
                        fetchMessages(selectedSession)
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user?.clinic_id])

    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession)
            fetchClientDetails(selectedSession)
        }
    }, [selectedSession])

    async function fetchSessions() {
        if (!user?.clinic_id) {
            setLoading(false)
            return
        }

        // Only fetch conversations for this clinic
        const { data, error } = await supabase
            .from('n8n_chat_histories')
            .select('session_id, content, created_at, patient_name')
            .eq('clinic_id', user.clinic_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching sessions:", error)
            setLoading(false)
            return
        }

        // Group by session_id and get latest message
        const sessionMap = new Map<string, ChatSession>()
        data.forEach((msg: any) => {
            if (!sessionMap.has(msg.session_id)) {
                sessionMap.set(msg.session_id, {
                    session_id: msg.session_id,
                    client_name: msg.patient_name || msg.session_id.replace(/[^0-9]/g, '') || "Cliente",
                    client_phone: msg.session_id,
                    last_message: msg.content || '',
                    last_message_time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })
            }
        })

        const uniqueSessions = Array.from(sessionMap.values())
        setSessions(uniqueSessions)

        // Auto-select first session on desktop only
        if (!selectedSession && uniqueSessions.length > 0 && window.innerWidth >= 768) {
            setSelectedSession(uniqueSessions[0].session_id)
        }

        setLoading(false)
    }

    async function fetchMessages(sessionId: string) {
        const { data, error } = await supabase
            .from('n8n_chat_histories')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)
        }
    }

    async function fetchClientDetails(sessionId: string) {
        // Try to find client by phone number (session_id)
        const { data, error } = await supabase
            .from('dados_cliente')
            .select('*')
            .eq('telefone', sessionId)
            .single()

        if (data) {
            setClientDetails(data)
        } else {
            setClientDetails(null)
        }
    }

    const handleSendMessage = async (text: string) => {
        if (!selectedSession) return

        const tempId = Date.now().toString()
        const newMessage = {
            id: tempId,
            content: text,
            role: 'assistant',
            created_at: new Date().toISOString(),
            session_id: selectedSession
        }

        setMessages(prev => [...prev, newMessage])

        // Uncomment to enable sending to Supabase
        const { error } = await supabase
            .from('n8n_chat_histories')
            .insert([{
                content: text,
                role: 'assistant',
                session_id: selectedSession,
            }])
        if (error) console.error("Error sending message:", error)
    }

    const handleSelectSession = (sessionId: string) => {
        setSelectedSession(sessionId)
        setShowMobileChat(true) // Show chat on mobile when session selected
    }

    const handleBackToList = () => {
        setShowMobileChat(false)
    }

    const formattedMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        text: msg.content || '',
        sender: {
            id: msg.role === 'user' ? 'client' : 'me',
            name: msg.role === 'user' ? (msg.patient_name || 'Cliente') : 'Eu',
            avatar: msg.role === 'user' ? undefined : '/placeholder-user.jpg'
        },
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: msg.role !== 'user'
    }))

    const currentChatUser: ChatUser = {
        id: selectedSession || 'unknown',
        name: sessions.find(s => s.session_id === selectedSession)?.client_name || 'Cliente',
        avatar: '/placeholder-user.jpg',
        status: 'online'
    }

    return (
        <div className="h-[calc(100vh-6rem)] grid grid-cols-12 gap-4 p-4">
            {/* Column 1: Conversations List */}
            <Card className={cn(
                "flex flex-col overflow-hidden transition-all duration-300",
                "md:col-span-4 lg:col-span-3",
                showMobileChat ? "hidden md:flex" : "col-span-12 md:flex",
                showDetails && "md:col-span-3"
            )}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Conversas
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-1 p-2">
                            {sessions.length > 0 ? sessions.map((session) => (
                                <div
                                    key={session.session_id}
                                    onClick={() => handleSelectSession(session.session_id)}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                                        selectedSession === session.session_id && "bg-accent"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{session.client_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm truncate">{session.client_name}</p>
                                                <span className="text-xs text-muted-foreground">{session.last_message_time}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{session.last_message}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground p-4">Nenhuma conversa encontrada.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Column 2: Messages - Middle */}
            <Card className={cn(
                "flex flex-col overflow-hidden transition-all duration-300",
                "md:col-span-8 lg:col-span-9",
                showMobileChat ? "col-span-12 md:flex" : "hidden md:flex",
                showDetails && "md:col-span-5"
            )}>
                {selectedSession ? (
                    <>
                        <div className="md:hidden flex items-center gap-2 p-3 border-b">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToList}
                                className="h-8 w-8"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-medium text-sm">{currentChatUser.name}</span>
                        </div>
                        <MessageConversation
                            messages={formattedMessages}
                            otherUser={currentChatUser}
                            className="h-full border-0 shadow-none"
                            onSendMessage={handleSendMessage}
                            onShowDetails={() => setShowDetails(!showDetails)}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Selecione uma conversa para começar</p>
                    </div>
                )}
            </Card>

            {/* Column 3: Client Details - Right */}
            {showDetails && (
                <Card className="col-span-4 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300 hidden md:flex">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Detalhes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            {clientDetails ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center text-center pb-4 border-b">
                                        <Avatar className="h-16 w-16 mb-3">
                                            <AvatarFallback className="text-lg">
                                                {clientDetails.nomewpp?.substring(0, 2).toUpperCase() || 'CL'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold">{clientDetails.nomewpp || 'Sem Nome'}</h3>
                                        <p className="text-sm text-muted-foreground">{clientDetails.telefone}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                                <Phone className="h-3 w-3" />
                                                Telefone
                                            </label>
                                            <p className="text-sm">{clientDetails.telefone || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                                <Tag className="h-3 w-3" />
                                                Etapa do Funil
                                            </label>
                                            <Badge variant="outline" className="text-xs">
                                                {clientDetails.etapa_funil || 'Não definida'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1">
                                                Status IA
                                            </label>
                                            <p className="text-sm">{clientDetails.atendimento_ia || '-'}</p>
                                        </div>
                                        {clientDetails.resumo_conversa && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1">
                                                    Resumo
                                                </label>
                                                <p className="text-xs text-muted-foreground">{clientDetails.resumo_conversa}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4">
                                    <p className="text-sm text-muted-foreground">Sem detalhes adicionais.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
