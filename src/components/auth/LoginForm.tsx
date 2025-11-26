"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useThemeTransition } from "@/hooks/useThemeTransition"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
    remember: z.boolean().default(false).optional(),
})

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { transitionTheme } = useThemeTransition()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const { data: users, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('email', values.email)
                .single()

            if (error || !users) {
                throw new Error("Usuário não encontrado ou erro na conexão.")
            }

            if (users.senha !== values.password) {
                throw new Error("Senha incorreta.")
            }

            const sessionData = {
                user: {
                    id: users.id,
                    email: users.email,
                },
                clinic_id: users.clinic_id,
            }

            localStorage.setItem('crm_session', JSON.stringify(sessionData))

            // Navigate first
            router.push("/dashboard")

            // Delay theme transition to happen after navigation
            setTimeout(async () => {
                await transitionTheme('light')
            }, 100)
        } catch (error: any) {
            console.error("Login error:", error)
            form.setError("root", {
                message: error.message || "Erro ao fazer login. Verifique suas credenciais.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
                <p className="text-muted-foreground">Entre com suas credenciais para acessar o painel</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative input-golden-glow rounded-md">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input placeholder="seu@email.com" className="pl-10" autoComplete="email" {...field} />
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
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                    <div className="relative input-golden-glow rounded-md">
                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10"
                                            autoComplete="current-password"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
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
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="cursor-pointer"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer">Lembrar de mim</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {form.formState.errors.root && (
                        <div className="text-sm font-medium text-destructive text-center">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Button type="submit" className="w-full button-shimmer cursor-pointer" disabled={isLoading}>
                        {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
