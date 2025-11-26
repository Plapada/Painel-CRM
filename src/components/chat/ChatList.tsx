import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Chat {
    id: string
    name: string
    lastMessage: string
    time: string
    unread?: number
    avatar?: string
}

interface ChatListProps {
    chats: Chat[]
    selectedId?: string
    onSelect: (id: string) => void
}

export function ChatList({ chats, selectedId, onSelect }: ChatListProps) {
    return (
        <div className="flex flex-col gap-2 p-4 pt-0">
            {chats.map((chat) => (
                <button
                    key={chat.id}
                    onClick={() => onSelect(chat.id)}
                    className={cn(
                        "flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent",
                        selectedId === chat.id && "bg-accent"
                    )}
                >
                    <Avatar>
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="font-semibold">{chat.name}</div>
                                {chat.unread && (
                                    <span className="flex h-2 w-2 rounded-full bg-primary" />
                                )}
                            </div>
                            <div className="ml-auto text-xs text-muted-foreground">
                                {chat.time}
                            </div>
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                            {chat.lastMessage}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    )
}
