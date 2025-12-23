"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface User {
    id: string
    email?: string
    username?: string
    role?: 'admin' | 'client'
    clinic_id?: string
    access_key?: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (userData: User, remember: boolean) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkSession()
    }, [])

    const checkSession = () => {
        try {
            // Check localStorage first (Remember Me)
            const localSession = localStorage.getItem('crm_session')
            if (localSession) {
                const parsed = JSON.parse(localSession)
                setUser(parsed.user)
                setLoading(false)
                return
            }

            // Check sessionStorage (Session only)
            const sessionSession = sessionStorage.getItem('crm_session')
            if (sessionSession) {
                const parsed = JSON.parse(sessionSession)
                setUser(parsed.user)
                setLoading(false)
                return
            }

            setUser(null)
        } catch (error) {
            console.error("Error checking session:", error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = (userData: User, remember: boolean) => {
        const sessionData = { user: userData, clinic_id: userData.clinic_id }
        const stringified = JSON.stringify(sessionData)

        if (remember) {
            localStorage.setItem('crm_session', stringified)
        } else {
            sessionStorage.setItem('crm_session', stringified)
        }

        setUser(userData)

        // Redirect based on role
        if (userData.role === 'admin') {
            router.push("/dashboard")
        } else {
            router.push("/dashboard")
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('crm_session')
        sessionStorage.removeItem('crm_session')
        setUser(null)
        router.push("/login")
    }

    // Protect routes
    useEffect(() => {
        if (loading) return

        // Define public routes
        const isPublicRoute =
            pathname === "/login" ||
            pathname?.startsWith("/register") ||
            pathname?.startsWith("/connect-whatsapp")

        if (!user && !isPublicRoute) {
            router.push("/login")
        }

        if (user && pathname === "/login") {
            router.push("/dashboard")
        }
    }, [user, loading, pathname, router])

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
