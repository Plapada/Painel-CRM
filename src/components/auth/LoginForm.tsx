"use client"

import { useState } from "react"
import { Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react"
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
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">
                    Bem-vindo
                </h1>
                <p className="text-muted-foreground text-sm">
                    Acesse sua conta para continuar
                </p>
            </div>

            {/* Login Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="identifier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-foreground/80">
                                    E-mail ou Usuário
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group input-golden-glow rounded-lg">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="seu@email.com ou usuario"
                                            {...field}
                                            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
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
                                <FormLabel className="text-foreground/80">
                                    Senha
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group input-golden-glow rounded-lg">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...field}
                                            className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="remember"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </FormControl>
                                <FormLabel className="text-sm text-muted-foreground font-normal">
                                    Lembrar de mim
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    {form.formState.errors.root && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5 button-shimmer"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
