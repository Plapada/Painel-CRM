"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, Loader2, Sparkles, FileText, Image as ImageIcon, Video, Mic, File } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Badge } from "@/components/ui/badge" 
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
    id: string
    text: string
    sender: 'me' | 'assistant'
    time: string
    type: 'text' | 'image' | 'video' | 'audio' | 'document'
    fileUrl?: string
    fileName?: string
}

export default function AssistantPage() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou seu assistente virtual. Como posso ajudar hoje? Você pode me enviar textos, imagens, vídeos ou documentos.',
            sender: 'assistant',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)

            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            }
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                // Remove data:image/xyz;base64, prefix
                const result = reader.result as string
                const base64 = result.split(',')[1]
                resolve(base64)
            }
            reader.onerror = error => reject(error)
        })
    }

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !selectedFile) || isLoading) return

        const newMessageId = Date.now().toString()
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // Optimistic UI update
        let messageType: Message['type'] = 'text'
        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) messageType = 'image'
            else if (selectedFile.type.startsWith('video/')) messageType = 'video'
            else if (selectedFile.type.startsWith('audio/')) messageType = 'audio'
            else messageType = 'document'
        }

        const newMessage: Message = {
            id: newMessageId,
            text: inputValue,
            sender: 'me',
            time: currentTime,
            type: messageType,
            fileUrl: previewUrl || undefined,
            fileName: selectedFile?.name
        }

        setMessages(prev => [...prev, newMessage])
        setInputValue("")
        setIsLoading(true)

        try {
            let payload: any = {
                "event": "messages.upsert",
                "instance": "clinica_dra_margarida_matos",
                "data": {
                    "key": {
                        "remoteJid": "5581988718023@s.whatsapp.net",
                        "remoteJidAlt": "5581988718023@s.whatsapp.net",
                        "fromMe": false,
                        "id": newMessageId, // Use consistent ID
                        "participant": "",
                        "addressingMode": "lid"
                    },
                    "pushName": user?.name || "Usuário CRM",
                    "status": "DELIVERY_ACK",
                    "messageTimestamp": Math.floor(Date.now() / 1000),
                    "instanceId": "5fa7e47b-1e1e-41d1-977d-4623b9d0dd26",
                    "source": "android"
                },
                "destination": "https://ia-n8n.jje6ux.easypanel.host/webhook/w-api-webhook",
                "date_time": new Date().toISOString(),
                "sender": "557181290025@s.whatsapp.net",
                "server_url": "https://ia-evolution-api.jje6ux.easypanel.host",
                "apikey": "C06D52EA-023C-4AAD-A7CA-08F03D8160C5"
            }

            if (selectedFile) {
                const base64 = await convertToBase64(selectedFile)
                payload.data.base64 = base64

                if (selectedFile.type.startsWith('image/')) {
                    payload.data.messageType = "imageMessage"
                    payload.data.message = {
                        "imageMessage": {
                            "mimetype": selectedFile.type,
                            "url": "https://mmg.whatsapp.net/v/t62.7118-24/placeholder.enc", // Mock URL as per example structure
                            "caption": inputValue
                        }
                    }
                } else if (selectedFile.type.startsWith('video/')) {
                    payload.data.messageType = "videoMessage"
                    payload.data.message = {
                        "videoMessage": {
                            "mimetype": selectedFile.type,
                            "url": "https://mmg.whatsapp.net/v/t62.7161-24/placeholder.enc",
                            "caption": inputValue,
                            "seconds": 10 // Mock duration
                        }
                    }
                } else {
                    // Document or Audio fallback structure
                    payload.data.messageType = "documentMessage"
                    payload.data.message = {
                        "documentMessage": {
                            "mimetype": selectedFile.type,
                            "url": "https://mmg.whatsapp.net/v/placeholder.enc",
                            "caption": inputValue,
                            "fileName": selectedFile.name
                        }
                    }
                }
            } else {
                payload.data.messageType = "conversation"
                payload.data.message = {
                    "conversation": inputValue
                }
            }

            // Using the user provided webhook URL
            const response = await fetch('https://ia-n8n.jje6ux.easypanel.host/webhook/w-api-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error('Falha ao enviar mensagem')
            }

            toast.success("Mensagem enviada com sucesso!")

        } catch (error) {
            console.error("Error sending message:", error)
            toast.error("Erro ao enviar mensagem para o assistente.")
        } finally {
            setIsLoading(false)
            clearFile()
        }
    }

    return (
        <div className="h-[calc(100vh-6rem)] grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
            <Card className="md:col-span-8 md:col-start-3 h-full flex flex-col overflow-hidden shadow-lg border-primary/10">
                <CardHeader className="bg-primary/5 pb-4 border-b">
                    <CardTitle className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">AS</AvatarFallback>
                                {/* <AvatarImage src="/bot-avatar.png" /> */}
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-playfair text-xl">Assistente Virtual</span>
                            <span className="text-xs text-muted-foreground font-sans font-normal flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                Online
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative bg-[url('/whatsapp-bg.png')] bg-repeat bg-opacity-5">
                    {/* Chat Background Pattern Overlay if needed */}
                    <div className="absolute inset-0 bg-white/90 z-0" />

                    <ScrollArea className="h-full p-4 relative z-10">
                        <div className="space-y-4 pb-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full mb-4",
                                        msg.sender === 'me' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-2xl p-3 shadow-sm relative",
                                            msg.sender === 'me'
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-white text-foreground rounded-tl-none border"
                                        )}
                                    >
                                        {msg.type === 'image' && msg.fileUrl && (
                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                <img src={msg.fileUrl} alt="Upload" className="max-w-full h-auto max-h-64 object-cover" />
                                            </div>
                                        )}
                                        {msg.type === 'video' && msg.fileUrl && (
                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                <video src={msg.fileUrl} controls className="max-w-full h-auto max-h-64" />
                                            </div>
                                        )}
                                        {(msg.type === 'document' || msg.type === 'audio') && (
                                            <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded">
                                                <FileText className="h-5 w-5" />
                                                <span className="text-sm truncate max-w-[150px]">{msg.fileName || 'Arquivo'}</span>
                                            </div>
                                        )}

                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                        <span className={cn(
                                            "text-[10px] absolute bottom-1 right-3 opacity-70",
                                            msg.sender === 'me' ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-end w-full">
                                    <div className="bg-primary/50 text-primary-foreground rounded-2xl rounded-tr-none p-3 shadow-md flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-xs">Enviando...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <div className="p-3 bg-background border-t z-20">
                    {/* File Preview */}
                    {selectedFile && (
                        <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {previewUrl && selectedFile.type.startsWith('image/') ? (
                                    <img src={previewUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
                                ) : (
                                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                        <File className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                    <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                X
                            </Button>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 rounded-full h-10 w-10">
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                                    <File className="h-4 w-4 mr-2" />
                                    Documento
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Imagem
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                                    <Video className="h-4 w-4 mr-2" />
                                    Vídeo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,video/*,application/pdf,audio/*"
                        />

                        <Input
                            placeholder="Digite sua mensagem..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            className="min-h-[2.5rem] py-2 px-4 rounded-full bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                        />

                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || (!inputValue.trim() && !selectedFile)}
                            className="rounded-full h-10 w-10 p-0 shrink-0 bg-primary hover:bg-primary/90 shadow-sm"
                        >
                            {inputValue.trim() || selectedFile ? (
                                <Send className="h-5 w-5 ml-0.5" />
                            ) : (
                                <Mic className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
