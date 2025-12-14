"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { Hexagon } from "lucide-react"

const registerSchema = z.object({
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    username: z.string()
        .min(3, { message: "O nome de usuário deve ter no mínimo 3 caracteres." })
        .max(20, { message: "O nome de usuário deve ter no máximo 20 caracteres." })
        .regex(/^[a-zA-Z0-9._]+$/, { message: "Use apenas letras, números, pontos e underscores." }),
    password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
})

export default function RegisterPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [isLoading, setIsLoading] = useState(false)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
    const [clinicData, setClinicData] = useState<any>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess] = useState(false)

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
    })

    useEffect(() => {
        validateToken()
    }, [token])

    const validateToken = async () => {
        if (!token) {
            setIsValidToken(false)
            return
        }

        // Token format: CLINIC_ID-RANDOM_STRING (e.g., "abc123-XyZ789")
        // We check if there's a clinic with this registration token
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('registration_token', token)
            .eq('status', 'ativo')
            .single()

        if (data) {
            setIsValidToken(true)
            setClinicData(data)
        } else {
            setIsValidToken(false)
        }
    }

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true)
        try {
            // Check if username already exists
            const { data: existingUser } = await supabase
                .from('usuarios_site')
                .select('id')
                .eq('username', values.username.toLowerCase())
                .single()

            if (existingUser) {
                throw new Error("Este nome de usuário já está em uso.")
            }

            // Create user
            const { error } = await supabase
                .from('usuarios_site')
                .insert([{
                    email: values.email.toLowerCase(),
                    username: values.username.toLowerCase(),
                    senha: values.password,
                    role: 'client',
                    clinic_id: clinicData.id,
                }])

            if (error) throw error

            setSuccess(true)

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error: any) {
            form.setError("root", {
                message: error.message || "Erro ao criar conta.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidToken === null) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <div className="animate-pulse text-muted-foreground">Verificando link...</div>
            </div>
        )
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <Card className="w-full max-w-md border-destructive/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-bold text-destructive">Link Inválido</h2>
                        <p className="text-muted-foreground text-sm">
                            Este link de registro não é válido ou expirou. Entre em contato com o administrador para obter um novo link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <Card className="w-full max-w-md border-green-500/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <h2 className="text-xl font-bold text-green-500">Conta Criada!</h2>
                        <p className="text-muted-foreground text-sm">
                            Sua conta foi criada com sucesso. Você será redirecionado para o login...
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
            <div className="absolute -bottom-1/2 left-1/2 w-[150%] pointer-events-none z-0 -translate-x-1/2 opacity-30 blur-3xl bg-primary/20 h-[1000px] rounded-full"></div>

            <Card className="w-full max-w-md relative z-10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Hexagon className="h-10 w-10 text-primary fill-primary/20" />
                    </div>
                    <CardTitle className="text-2xl font-playfair">Criar Conta</CardTitle>
                    <CardDescription>
                        Registro para: <span className="font-medium text-primary">{clinicData?.nome}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="seu@email.com" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome de Usuário</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="seu.usuario" {...field} className="pl-10" />
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
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...field}
                                                    className="pl-10 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar Senha</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.root && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Criando conta..." : "Criar Conta"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
