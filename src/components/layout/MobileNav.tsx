"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
    LayoutDashboard,
    Filter,
    MessageSquare,
    Calendar,
    Users,
    ClipboardList,
    Settings,
    LogOut,
    UserCircle
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Funil", href: "/funnel", icon: Filter },
    { name: "Conversas", href: "/chat", icon: MessageSquare },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Clientes", href: "/clients", icon: ClipboardList },
    { name: "Clínicas", href: "/clinics", icon: Users },
    { name: "Suporte", href: "/support", icon: MessageSquare },
]

export function MobileNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const { setTheme } = useTheme()

    const isClient = user?.role === 'client'

    // Filter items based on role
    const filteredNavItems = navItems.filter(item => {
        if (isClient) {
            // Clients see: Dashboard, Funil, Conversas, Agendamentos, Clientes, Suporte
            return ['Dashboard', 'Funil', 'Conversas', 'Agendamentos', 'Clientes', 'Suporte'].includes(item.name)
        } else {
            // Admin sees: Dashboard, Clínicas, Suporte
            return ['Dashboard', 'Clínicas', 'Suporte'].includes(item.name)
        }
    })

    // On mobile, we can only fit so many items. 
    // Usually 4-5 items fit well. If more, maybe group them or scroll?
    // Admin has 3 items. Good.
    // Client has 6 items. Might be tight.
    // I'll allow horizontal scroll if needed or just shrink padding.
    // Or prioritise main ones and put others in "Menu"? 
    // For now I'll render all, flex will shrink them.

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-sm md:hidden">
            <div className="relative flex items-center justify-around bg-card shadow-xl rounded-full p-1 border border-border/80 backdrop-blur-sm overflow-x-auto no-scrollbar">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "z-10 flex-1 flex items-center justify-center p-3 rounded-full transition-all duration-300 min-w-[50px]",
                                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="sr-only">{item.name}</span>
                        </Link>
                    )
                })}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="z-10 flex-1 flex items-center justify-center p-3 rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none min-w-[50px]"
                        >
                            <UserCircle className="h-6 w-6" />
                            <span className="sr-only">Perfil</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
                        <DropdownMenuItem onClick={() => {
                            // Link to Settings via router logic usually, or just link
                            // Since DropdownMenuItem assumes onClick, I need router or Link wrapper
                            window.location.href = "/settings"
                        }}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
