"use client"

import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"
import { NotificationBell } from "./NotificationBell"
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler"

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 md:pl-20 lg:pl-64 transition-all duration-300">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
                    <span className="font-semibold md:hidden">CRM Elegance</span>

                    <div className="ml-auto flex items-center gap-4">
                        <NotificationBell />
                        <AnimatedThemeToggler />
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    )
}
