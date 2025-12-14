"use client"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, Key, ArrowRight } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const adminSchema = z.object({
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
    remember: z.boolean().default(false).optional(),
})

const clientSchema = z.object({
    accessKey: z.string().min(1, { message: "Chave de acesso é obrigatória." }),
})

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const { transitionTheme } = useThemeTransition()
    const [activeTab, setActiveTab] = useState("admin")

    const adminForm = useForm<z.infer<typeof adminSchema>>({
        resolver: zodResolver(adminSchema),
        defaultValues: { email: "", password: "", remember: false },
    })

    const clientForm = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: { accessKey: "" },
    })

    async function onAdminSubmit(values: z.infer<typeof adminSchema>) {
        setIsLoading(true)
        try {
            const email = values.email.trim().toLowerCase()
            const { data: users, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('email', email)
                .single()

            if (error || !users) {
                console.error("Login error:", error)
                throw new Error("Email não encontrado ou erro na conexão.")
            }

            if (users.senha !== values.password) {
                throw new Error("Senha incorreta.")
            }

            const userData = {
                id: users.id,
                email: users.email,
                role: users.role || 'admin', // Default to admin if role missing
                clinic_id: users.clinic_id,
            }

            await transitionTheme('light')
            login(userData, !!values.remember)
        } catch (error: any) {
            adminForm.setError("root", {
                message: error.message || "Erro ao fazer login.",
            })
            setIsLoading(false)
        }
    }

    async function onClientSubmit(values: z.infer<typeof clientSchema>) {
        setIsLoading(true)
        try {
            const key = values.accessKey.trim()
            const { data: users, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('access_key', key)
                .single()

            if (error || !users) {
                throw new Error("Chave de acesso inválida.")
            }

            const userData = {
                id: users.id,
                email: users.email,
                role: 'client' as const,
                clinic_id: users.clinic_id,
                access_key: users.access_key
            }

            await transitionTheme('light')
            login(userData, true) // Always remember client for easier access
        } catch (error: any) {
            clientForm.setError("root", {
                message: error.message || "Erro ao acessar área do cliente.",
            })
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo</h1>
                <p className="text-muted-foreground">Acesse sua conta para continuar</p>
            </div>

            <Tabs defaultValue="admin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="admin">Administrador</TabsTrigger>
                    <TabsTrigger value="client">Área do Cliente</TabsTrigger>
                </TabsList>

                <TabsContent value="admin">
                    <Form {...adminForm}>
                        <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                            <FormField
                                control={adminForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative input-golden-glow rounded-md">
                                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input placeholder="admin@elegance.com" className="pl-10" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={adminForm.control}
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
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={adminForm.control}
                                name="remember"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                            Lembrar de mim neste computador
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            {adminForm.formState.errors.root && (
                                <div className="text-sm font-medium text-destructive text-center">
                                    {adminForm.formState.errors.root.message}
                                </div>
                            )}

                            <Button type="submit" className="w-full button-shimmer" disabled={isLoading}>
                                {isLoading ? "Entrando..." : "Entrar como Admin"}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="client">
                    <Form {...clientForm}>
                        <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg text-sm text-muted-foreground mb-4 border border-primary/10">
                                <p>Digite a chave de acesso fornecida pela equipe Elegance para visualizar os dados da sua clínica.</p>
                            </div>

                            <FormField
                                control={clientForm.control}
                                name="accessKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chave de Acesso</FormLabel>
                                        <FormControl>
                                            <div className="relative input-golden-glow rounded-md">
                                                <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    placeholder="ELEGANCE-XXXX-XXXX"
                                                    className="pl-10 uppercase tracking-widest font-mono"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {clientForm.formState.errors.root && (
                                <div className="text-sm font-medium text-destructive text-center">
                                    {clientForm.formState.errors.root.message}
                                </div>
                            )}

                            <Button type="submit" className="w-full button-shimmer group" disabled={isLoading}>
                                {isLoading ? "Verificando..." : "Acessar Dashboard"}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </div>
    )
}
