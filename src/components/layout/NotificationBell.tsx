"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface Notification {
    id: string
    title: string
    message: string
    read: boolean
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return

        fetchNotifications()

        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const newNotif = payload.new as Notification
                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const fetchNotifications = async () => {
        if (!user?.id) return

        // In a real implementation, you would strictly filter by user_id
        // For demonstration, we'll try to fetch notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        }
    }

    const markAsRead = async () => {
        if (unreadCount === 0) return

        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))

        // Optimistic update - in real world, update DB filtered by unread
        // supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    }

    return (
        <DropdownMenu onOpenChange={(open) => {
            if (open) markAsRead()
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse border border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <div className="flex w-full justify-between items-center">
                                <span className={notif.read ? "font-normal" : "font-semibold"}>{notif.title}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhuma notificação nova.
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
