"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [clientDetails, setClientDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showDetails, setShowDetails] = useState(false)
    const [showMobileChat, setShowMobileChat] = useState(false)

    useEffect(() => {
        fetchSessions()

        // Subscribe to chat updates
        const channel = supabase
            .channel('chat-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
                fetchSessions()
                if (selectedSession) {
                    fetchMessages(selectedSession)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession)
            fetchClientDetails(selectedSession)
        }
    }, [selectedSession])

    async function fetchSessions() {
        // Fetch recent chats from 'chats' table
        const { data: chatsData, error } = await supabase
            .from('chats')
            .select('*')
            .order('updated_at', { ascending: false })

        if (error) {
            console.error("Error fetching chats:", error)
            setLoading(false)
            return
        }

        // Map chats to session interface
        // Note: 'chats' table lacks 'name' and 'last_message', so we mock or fetch separately
        const mappedSessions: ChatSession[] = chatsData.map((c: any) => ({
            session_id: c.phone,
            client_name: c.phone, // We'll try to improve this with client details later
            client_phone: c.phone,
            last_message: "Conversa ativa", // 'chats' doesn't have content content
            last_message_time: new Date(c.updated_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))

        setSessions(mappedSessions)

        // Auto-select first
        if (!selectedSession && mappedSessions.length > 0 && window.innerWidth >= 768) {
            setSelectedSession(mappedSessions[0].session_id)
        }

        setLoading(false)
    }

    async function fetchMessages(sessionId: string) {
        // Fetch messages for this phone number
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('phone', sessionId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)
        }
    }

    async function fetchClientDetails(sessionId: string) {
        const { data } = await supabase
            .from('dados_cliente')
            .select('*')
            .eq('telefone', sessionId)
            .single()

        if (data) {
            setClientDetails(data)

            // Update name in sessions list if found
            setSessions(prev => prev.map(s =>
                s.session_id === sessionId ? { ...s, client_name: data.nomewpp || data.telefone } : s
            ))
        } else {
            setClientDetails(null)
        }
    }

    const handleSendMessage = async (text: string) => {
        if (!selectedSession) return

        const tempId = Date.now().toString()
        // Optimistic UI update
        const newMessage = {
            id: tempId,
            bot_message: text,
            user_message: null,
            created_at: new Date().toISOString(),
            phone: selectedSession,
            // Add other fields to match local display logic
        }

        setMessages(prev => [...prev, newMessage])

        // Send to Supabase
        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                phone: selectedSession,
                bot_message: text,
                user_message: null,
                active: true,
                message_type: 'text'
                // clinic_id? if avail
            }])

        if (error) console.error("Error sending message:", error)
    }

    const handleSelectSession = (sessionId: string) => {
        setSelectedSession(sessionId)
        setShowMobileChat(true)
    }

    const handleBackToList = () => {
        setShowMobileChat(false)
    }

    // Convert keys from 'chat_messages' (user_message/bot_message) to UI format
    const formattedMessages: ChatMessage[] = [];

    messages.forEach(msg => {
        // If user_message exists, it's a message FROM the user
        if (msg.user_message) {
            formattedMessages.push({
                id: `u-${msg.id}`,
                text: msg.user_message,
                sender: {
                    id: 'client',
                    name: sessions.find(s => s.session_id === selectedSession)?.client_name || 'Cliente',
                    avatar: undefined
                },
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false
            })
        }

        // If bot_message exists, it's a message FROM the bot/agent (Me)
        if (msg.bot_message) {
            formattedMessages.push({
                id: `b-${msg.id}`,
                text: msg.bot_message,
                sender: {
                    id: 'me',
                    name: 'Eu',
                    avatar: '/placeholder-user.jpg'
                },
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: true
            })
        }
    })

    // Sort combined messages by time if they came from same row but need order? 
    // Usually they are separate rows or Q&A. If Q&A pair, user asked, bot answered.
    // So user_message comes before bot_message in the same row?
    // Let's assume user_message is first if both exist.
    // However, usually they are separate events in this kind of schema or capture.

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
