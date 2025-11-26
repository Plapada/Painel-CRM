import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, PlusCircle } from "lucide-react"

interface Message {
    id: string
    content: string
    sender: "user" | "me"
    time: string
}

interface ChatWindowProps {
    chat: {
        id: string
        name: string
        avatar?: string
    } | null
    messages: Message[]
    summary?: string
    onGenerateSummary: () => void
    onSendMessage: (content: string) => void
}

export function ChatWindow({ chat, messages, summary, onGenerateSummary, onSendMessage }: ChatWindowProps) {
    if (!chat) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg font-medium">Selecione uma conversa</p>
                    <p className="text-sm">Escolha um contato para começar a conversar.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold">{chat.name}</div>
                        <div className="text-xs text-muted-foreground">Online agora</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onGenerateSummary}>
                        Gerar Resumo
                    </Button>
                </div>
            </div>
            {summary && (
                <div className="bg-muted/50 p-4 text-sm border-b">
                    <div className="font-semibold mb-1">Resumo da IA:</div>
                    <p className="text-muted-foreground">{summary}</p>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 text-sm ${message.sender === "me"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                        >
                            {message.content}
                            <div className={`text-[10px] mt-1 text-right ${message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {message.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        const form = e.currentTarget
                        const input = form.elements.namedItem("message") as HTMLInputElement
                        if (input.value.trim()) {
                            onSendMessage(input.value)
                            input.value = ""
                        }
                    }}
                    className="flex items-center gap-2"
                >
                    <Button size="icon" variant="ghost" type="button">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Input
                        name="message"
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        autoComplete="off"
                    />
                    <Button size="icon" type="submit">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
