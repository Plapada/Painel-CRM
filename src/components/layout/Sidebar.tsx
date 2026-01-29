"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Filter,
    MessageSquare,
    Calendar,
    Users,
    ClipboardList,
    Settings,
    LogOut,
    Hexagon,
    Sparkles
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Funil", href: "/funnel", icon: Filter },
    { name: "Conversas", href: "/chat", icon: MessageSquare },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Pacientes", href: "/clients", icon: ClipboardList },
    { name: "Clínicas", href: "/clinics", icon: Users },
    { name: "Suporte", href: "/support", icon: MessageSquare },
    { name: "Assistente IA", href: "/assistant", icon: Sparkles },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const isClient = user?.role === 'client'
    const isAdmin = user?.role === 'admin' || !user?.role

    // Filter items based on role
    const filteredNavItems = navItems.filter(item => {
        if (isClient) {
            // Clients see: Dashboard, Funil, Conversas, Agendamentos, Pacientes, Suporte
            return ['Dashboard', 'Funil', 'Conversas', 'Agendamentos', 'Pacientes', 'Suporte'].includes(item.name)
        } else {
            // Admin sees: Dashboard, Clínicas, Suporte
            return ['Dashboard', 'Clínicas', 'Suporte'].includes(item.name)
        }
    })

    return (
        <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r bg-card fixed inset-y-0 z-50 transition-all duration-300">
            <div className="flex h-16 items-center justify-between lg:px-6 px-2 border-b shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
                    <Hexagon className="h-6 w-6 text-primary fill-primary/20" />
                    <span className="hidden lg:inline-block">CRM Elegance</span>
                </Link>
                {/* <AnimatedThemeToggler /> */}
            </div>

            <div className="flex-1 py-4 flex flex-col gap-2 px-2">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Button
                            key={item.href}
                            variant="ghost"
                            asChild
                            className={cn(
                                "w-full justify-center lg:justify-start gap-3 px-2 lg:px-3",
                                isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                            )}
                        >
                            <Link href={item.href}>
                                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                                <span className="hidden lg:inline-block">{item.name}</span>
                            </Link>
                        </Button>
                    )
                })}
            </div>

            <div className="p-4 border-t space-y-2">
                {!isClient && (
                    <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-center lg:justify-start gap-3 px-2 lg:px-3"
                    >
                        <Link href="/settings">
                            <Settings className="h-5 w-5" />
                            <span className="hidden lg:inline-block">Configurações</span>
                        </Link>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-center lg:justify-start gap-3 px-2 lg:px-3 hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden lg:inline-block">Sair</span>
                </Button>

                <div className="pt-4 border-t mt-2 flex items-center justify-center lg:justify-start gap-3 px-1">
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={`https://placehold.co/40x40/f59e0b/000000?text=${user?.role === 'client' ? 'CL' : 'AD'}`} />
                        <AvatarFallback>{user?.role === 'client' ? 'CL' : 'AD'}</AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-sm overflow-hidden">
                        <p className="font-medium truncate">{user?.email || (isClient ? 'Cliente' : 'Admin')}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'Admin'}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
