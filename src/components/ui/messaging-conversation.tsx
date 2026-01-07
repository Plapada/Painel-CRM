"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Phone, Video, MoreVertical, Check, CheckCheck, Smile, Paperclip, Mic } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ChatUser {
    id: string
    name: string
    avatar?: string
    status?: 'online' | 'offline' | 'busy'
}

export interface ChatMessage {
    id: string
    text: string
    sender: {
        id: string
        name: string
        avatar?: string
    }
    time: string
    isMe: boolean
}

interface MessageConversationProps {
    messages: ChatMessage[]
    otherUser: ChatUser
    className?: string
    onSendMessage?: (text: string) => void
    onShowDetails?: () => void
}

export default function MessageConversation({
    messages,
    otherUser,
    className,
    onSendMessage,
    onShowDetails
}: MessageConversationProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    return (
        <Card className={cn("flex flex-col overflow-hidden bg-background", className)}>
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={onShowDetails}
                >
                    <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold leading-none">{otherUser.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className={cn(
                                "h-2 w-2 rounded-full",
                                otherUser.status === 'online' ? "bg-green-500" : "bg-gray-300"
                            )} />
                            {otherUser.status === 'online' ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Video className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onShowDetails}>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Limpar conversa</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Bloquear</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full gap-2",
                                    msg.isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                {!msg.isMe && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={msg.sender.avatar} />
                                        <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "relative max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm",
                                        msg.isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                    )}
                                >
                                    <p className="leading-relaxed">{msg.text}</p>
                                    <div
                                        className={cn(
                                            "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                            msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}
                                    >
                                        <span>{msg.time}</span>
                                        {msg.isMe && <CheckCheck className="h-3 w-3" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Read-only footer */}
            <div className="p-4 border-t bg-background/95 backdrop-blur text-center ">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Modo Leitura: O envio de mensagens está desabilitado nesta visualização.
                </p>
            </div>
        </Card>
    )
}
