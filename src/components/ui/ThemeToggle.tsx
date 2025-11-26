"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useThemeTransition } from "@/hooks/useThemeTransition"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme } = useTheme()
    const { transitionTheme } = useThemeTransition()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const newTheme = theme === "dark" ? "light" : "dark"
        transitionTheme(newTheme, centerX, centerY)
    }

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-10 h-10 relative overflow-hidden group"
            >
                <div className="w-5 h-5" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="rounded-full w-10 h-10 relative overflow-hidden group hover:bg-primary/10 transition-colors"
            aria-label="Toggle theme"
        >
            {/* Sun Icon - visible in dark mode */}
            <Sun
                className={`h-5 w-5 absolute transition-all duration-500 ${theme === "dark"
                        ? "rotate-0 scale-100 opacity-100"
                        : "rotate-90 scale-0 opacity-0"
                    }`}
            />
            {/* Moon Icon - visible in light mode */}
            <Moon
                className={`h-5 w-5 absolute transition-all duration-500 ${theme === "light"
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-0 opacity-0"
                    }`}
            />
            {/* Hover glow effect */}
            <span className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
    )
}
