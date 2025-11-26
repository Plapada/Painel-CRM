"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
    LayoutDashboard,
    Users,
    Calendar,
    MessageSquare,
    UserCircle,
    LogOut,
    Settings
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Conversas", href: "/chat", icon: MessageSquare },
]

export function MobileNav() {
    const pathname = usePathname()
    const router = useRouter()
    const { setTheme } = useTheme()

    const handleLogout = () => {
        localStorage.removeItem("crm_session")
        setTheme('dark') // Force dark mode for login page
        router.push("/login")
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-sm md:hidden">
            <div className="relative flex items-center justify-around bg-card shadow-xl rounded-full p-1 border border-border/80 backdrop-blur-sm">
                {navItems.map((item) => {
                    // Check if current path matches or is a child route
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "z-10 flex-1 flex items-center justify-center p-3 rounded-full transition-all duration-300",
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
                            className="z-10 flex-1 flex items-center justify-center p-3 rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        >
                            <UserCircle className="h-6 w-6" />
                            <span className="sr-only">Perfil</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="mb-2">
                        <DropdownMenuItem onClick={() => router.push("/settings")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
