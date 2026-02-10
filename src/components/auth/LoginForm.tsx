"use client"

import { useState } from "react"
import { Eye, EyeOff, User, Lock, ArrowRight, Hexagon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useThemeTransition } from "@/hooks/useThemeTransition"
import { useAuth } from "@/lib/auth-context"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
    identifier: z.string().min(1, { message: "E-mail ou usuário é obrigatório." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
    remember: z.boolean().default(false).optional(),
})

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const { transitionTheme } = useThemeTransition()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { identifier: "", password: "", remember: false },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)
        try {
            const identifier = values.identifier.trim().toLowerCase()

            // Try to find user by email first, then by username
            let userData = null

            // Check if it looks like an email
            const isEmail = identifier.includes('@')

            if (isEmail) {
                const { data, error } = await supabase
                    .from('usuarios_site')
                    .select('*')
                    .eq('email', identifier)
                    .single()

                if (!error && data) userData = data
            }

            // If not found by email, try username
            if (!userData) {
                const { data, error } = await supabase
                    .from('usuarios_site')
                    .select('*')
                    .eq('username', identifier)
                    .single()

                if (!error && data) userData = data
            }

            if (!userData) {
                throw new Error("Usuário não encontrado.")
            }

            if (userData.senha !== values.password) {
                throw new Error("Senha incorreta.")
            }

            const user = {
                id: userData.id,
                email: userData.email,
                username: userData.username,
                role: userData.role || 'client',
                clinic_id: userData.clinic_id,
            }

            await transitionTheme('light')
            login(user, !!values.remember)
        } catch (error: any) {
            form.setError("root", {
                message: error.message || "Erro ao fazer login.",
            })
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
            {/* Logo + Header — visible on mobile, hidden on desktop (shown in panel) */}
            <div className="flex flex-col items-center gap-4 lg:hidden">
                <Hexagon className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
                <h1 className="text-2xl font-bold tracking-wider font-playfair text-white">
                    CRM Elegance
                </h1>
            </div>

            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white font-playfair">
                    Bem-vindo
                </h2>
                <p className="text-white/40 text-sm">
                    Acesse sua conta para continuar
                </p>
            </div>

            {/* Login Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="identifier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white/60 text-xs uppercase tracking-wider">
                                    E-mail ou Usuário
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-amber-500 transition-colors duration-300" />
                                        <Input
                                            placeholder="seu@email.com"
                                            {...field}
                                            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/50 focus:bg-white/[0.06] transition-all duration-300 h-11"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white/60 text-xs uppercase tracking-wider">
                                    Senha
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-amber-500 transition-colors duration-300" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...field}
                                            className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/50 focus:bg-white/[0.06] transition-all duration-300 h-11"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center justify-between">
                        <FormField
                            control={form.control}
                            name="remember"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="border-white/20 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                        />
                                    </FormControl>
                                    <FormLabel className="text-xs text-white/40 font-normal">
                                        Lembrar de mim
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>

                    {form.formState.errors.root && (
                        <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-5 transition-all duration-300 shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Entrando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>Entrar</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
