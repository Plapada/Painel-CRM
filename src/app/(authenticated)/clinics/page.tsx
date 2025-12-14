"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Building2, Search, ArrowRight, Users, Calendar, MessageSquare, Plus, Copy, Check, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

interface Clinic {
    id: string
    email?: string
    username?: string
    clinic_id: string
    created_at?: string
    totalPatients?: number
    todayAppointments?: number
    monthlyConversations?: number
}

export default function ClinicsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role

    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // New Client Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newClinicId, setNewClinicId] = useState("")
    const [newClinicName, setNewClinicName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [registrationLink, setRegistrationLink] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!isAdmin) return
        fetchClinics()
    }, [isAdmin])

    const fetchClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('role', 'client')
                .order('created_at', { ascending: false })

            if (error) throw error

            const clinicsWithStats = data?.map(c => ({
                ...c,
                totalPatients: Math.floor(Math.random() * 200) + 50,
                todayAppointments: Math.floor(Math.random() * 10),
                monthlyConversations: Math.floor(Math.random() * 500) + 100,
            })) || []

            setClinics(clinicsWithStats)
        } catch (error) {
            console.error("Error fetching clinics:", error)
        } finally {
            setLoading(false)
        }
    }

    const generateRegistrationLink = async () => {
        if (!newClinicId.trim()) return

        setIsCreating(true)
        try {
            // Generate a random token using Supabase's gen_random_uuid function
            // We'll create a pending registration entry
            const { data, error } = await supabase
                .rpc('generate_registration_token', {
                    p_clinic_id: newClinicId.trim(),
                    p_clinic_name: newClinicName.trim() || 'Nova Clínica'
                })

            if (error) {
                // If the function doesn't exist, we'll use a client-side fallback
                console.warn("RPC not available, using client-side generation")
                const token = crypto.randomUUID()

                // Insert into pending_registrations table
                const { error: insertError } = await supabase
                    .from('pending_registrations')
                    .insert([{
                        token: token,
                        clinic_id: newClinicId.trim(),
                        clinic_name: newClinicName.trim() || 'Nova Clínica',
                        used: false
                    }])

                if (insertError) throw insertError

                const baseUrl = window.location.origin
                setRegistrationLink(`${baseUrl}/register/${token}`)
            } else {
                // Use the token from RPC
                const baseUrl = window.location.origin
                setRegistrationLink(`${baseUrl}/register/${data}`)
            }
        } catch (error) {
            console.error("Error generating registration link:", error)
            alert("Erro ao gerar link. Verifique se a tabela 'pending_registrations' existe.")
        } finally {
            setIsCreating(false)
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(registrationLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const resetDialog = () => {
        setNewClinicId("")
        setNewClinicName("")
        setRegistrationLink("")
        setCopied(false)
    }

    const filteredClinics = clinics.filter(c =>
        (c.email?.toLowerCase() || c.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
                <p className="text-muted-foreground">Acesso restrito a administradores.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Clínicas</h1>
                    <p className="text-muted-foreground">Gerencie suas clínicas parceiras.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clínica..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* New Client Button */}
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetDialog(); }}>
                        <DialogTrigger asChild>
                            <Button className="shrink-0">
                                <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Nova Clínica</DialogTitle>
                                <DialogDescription>
                                    Gere um link de registro único para o seu cliente.
                                </DialogDescription>
                            </DialogHeader>

                            {!registrationLink ? (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicId">ID da Clínica (Supabase)</Label>
                                        <Input
                                            id="clinicId"
                                            placeholder="Ex: abc123-def456..."
                                            value={newClinicId}
                                            onChange={e => setNewClinicId(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Cole o ID da clínica da tabela 'clinics' do Supabase.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicName">Nome da Clínica</Label>
                                        <Input
                                            id="clinicName"
                                            placeholder="Ex: Dra. Margarida"
                                            value={newClinicName}
                                            onChange={e => setNewClinicName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span className="text-green-500 text-sm font-medium">Link gerado com sucesso!</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Link de Registro</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={registrationLink}
                                                readOnly
                                                className="text-xs"
                                            />
                                            <Button variant="outline" size="icon" onClick={copyLink}>
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Envie este link para o cliente. Ele poderá criar sua conta.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                {!registrationLink ? (
                                    <Button onClick={generateRegistrationLink} disabled={!newClinicId || isCreating}>
                                        {isCreating ? "Gerando..." : "Gerar Link"}
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Fechar
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-20 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredClinics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClinics.map(clinic => (
                        <Card key={clinic.id} className="group hover:shadow-lg transition-all duration-300 border-border/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {clinic.username || clinic.email?.split('@')[0] || 'Cliente'}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">{clinic.email || clinic.username}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.totalPatients}</p>
                                        <p className="text-[10px] text-muted-foreground">Pacientes</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.todayAppointments}</p>
                                        <p className="text-[10px] text-muted-foreground">Hoje</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.monthlyConversations}</p>
                                        <p className="text-[10px] text-muted-foreground">Conversas/Mês</p>
                                    </div>
                                </div>
                                <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                                    <Link href={`/clinics/${clinic.id}`}>
                                        Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold">Nenhuma clínica encontrada</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {searchQuery ? "Tente ajustar sua busca." : "Clique em 'Novo Cliente' para adicionar."}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
