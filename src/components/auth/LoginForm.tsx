"use client"

import { useState } from "react"
import { Eye, EyeOff, User, Lock, ArrowRight, Shield } from "lucide-react"
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
    username: z.string().min(1, { message: "Nome de usuário é obrigatório." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
    remember: z.boolean().default(false).optional(),
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
        defaultValues: { username: "", password: "", remember: false },
    })

    // Admin login (via email)
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
                throw new Error("Email não encontrado.")
            }

            if (users.senha !== values.password) {
                throw new Error("Senha incorreta.")
            }

            const userData = {
                id: users.id,
                email: users.email,
                username: users.username,
                role: users.role || 'admin',
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

    // Client login (via username)
    async function onClientSubmit(values: z.infer<typeof clientSchema>) {
        setIsLoading(true)
        try {
            const username = values.username.trim().toLowerCase()
            const { data: users, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('username', username)
                .single()

            if (error || !users) {
                throw new Error("Usuário não encontrado.")
            }

            if (users.senha !== values.password) {
                throw new Error("Senha incorreta.")
            }

            const userData = {
                id: users.id,
                email: users.email,
                username: users.username,
                role: users.role || 'client',
                clinic_id: users.clinic_id,
            }

            await transitionTheme('light')
            login(userData, !!values.remember)
        } catch (error: any) {
            clientForm.setError("root", {
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrador
                    </TabsTrigger>
                    <TabsTrigger value="client">
                        Clínica
                    </TabsTrigger>
                </TabsList>

                {/* Admin Login */}
                <TabsContent value="admin" className="mt-6">
                    <Form {...adminForm}>
                        <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                            <FormField
                                control={adminForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">E-mail</FormLabel>
                                        <FormControl>
                                            <div className="relative group input-golden-glow rounded-lg">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="admin@elegance.com"
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
                                control={adminForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Senha</FormLabel>
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
                                control={adminForm.control}
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

                            {adminForm.formState.errors.root && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in">
                                    {adminForm.formState.errors.root.message}
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
                                        <span>Entrar como Admin</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                {/* Client Login */}
                <TabsContent value="client" className="mt-6">
                    <Form {...clientForm}>
                        <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                            <FormField
                                control={clientForm.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Usuário</FormLabel>
                                        <FormControl>
                                            <div className="relative group input-golden-glow rounded-lg">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="seu.usuario"
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
                                control={clientForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">Senha</FormLabel>
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
                                control={clientForm.control}
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

                            {clientForm.formState.errors.root && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in">
                                    {clientForm.formState.errors.root.message}
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
                </TabsContent>
            </Tabs>
        </div>
    )
}
