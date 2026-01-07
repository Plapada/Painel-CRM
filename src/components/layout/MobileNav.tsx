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
    Menu,
    LifeBuoy
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Funil", href: "/funnel", icon: Filter },
    { name: "Conversas", href: "/chat", icon: MessageSquare },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Pacientes", href: "/clients", icon: ClipboardList },
    { name: "Clínicas", href: "/clinics", icon: Users },
    { name: "Suporte", href: "/support", icon: LifeBuoy },
]

export function MobileNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const isClient = user?.role === 'client'

    // Define visible items vs menu items
    let visibleItems: typeof navItems = []
    let menuItems: typeof navItems = []

    if (isClient) {
        // Client: Dashboard, Chat, Calendar visible. Rest in Menu.
        visibleItems = navItems.filter(i => ['Dashboard', 'Conversas', 'Agendamentos'].includes(i.name))
        menuItems = navItems.filter(i => ['Funil', 'Clientes', 'Suporte'].includes(i.name))
    } else {
        // Admin: Show all (3 items)
        visibleItems = navItems.filter(i => ['Dashboard', 'Clínicas', 'Suporte'].includes(i.name))
        menuItems = [] // Admin usually has few enough to fit, but we can add Menu if needed
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit sm:max-w-sm md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="relative flex items-center justify-around bg-background/90 shadow-lg rounded-full px-4 py-2 border border-border/50 backdrop-blur-lg gap-2">

                {/* Visible Items */}
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300 min-w-[50px] gap-0.5",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[9px] font-medium leading-none mt-0.5">{item.name}</span>
                        </Link>
                    )
                })}

                {/* Divider */}
                <div className="h-6 w-px bg-border/50 mx-1"></div>

                {/* Menu Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300 min-w-[50px] gap-0.5",
                                "text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none"
                            )}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="text-[9px] font-medium leading-none mt-0.5">Menu</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56 mb-2 rounded-xl p-2 shadow-xl border-border/50 bg-background/95 backdrop-blur">
                        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Navegação
                        </DropdownMenuLabel>

                        {menuItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link href={item.href} className="flex items-center gap-2 p-2.5 cursor-pointer rounded-lg hover:bg-muted focus:bg-muted">
                                    <item.icon className="h-4 w-4 text-primary" />
                                    <span>{item.name}</span>
                                </Link>
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator className="my-1 bg-border/50" />

                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2 p-2.5 cursor-pointer rounded-lg hover:bg-muted focus:bg-muted">
                                <Settings className="h-4 w-4" />
                                <span className="text-sm">Configurações</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 p-2.5 cursor-pointer rounded-lg text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
