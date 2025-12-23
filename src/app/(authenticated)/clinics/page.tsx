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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Search, ArrowRight, Users, Calendar, MessageSquare, Plus, Copy, Check, Link as LinkIcon, Loader2, RefreshCw, Smartphone, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Clinic {
    id: string
    nome?: string
    email?: string
    username?: string
    clinic_id: string
    created_at?: string
    totalPatients?: number
    todayAppointments?: number
    monthlyConversations?: number
    connectionStatus?: 'connected' | 'disconnected' | 'unknown'
    instanceName?: string
}

interface ExistingClinic {
    id: number
    clinic_id: string
    nome_clinica: string
    status?: string
}

export default function ClinicsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'

    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // New Client Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newClinicName, setNewClinicName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [registrationLink, setRegistrationLink] = useState("")
    const [copied, setCopied] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    // Existing Clinic Selection
    const [isSelectExisting, setIsSelectExisting] = useState(false)
    const [existingClinics, setExistingClinics] = useState<ExistingClinic[]>([])
    const [selectedClinicId, setSelectedClinicId] = useState("")

    const [loadingClinics, setLoadingClinics] = useState(false)
    const [isCheckingStatus, setIsCheckingStatus] = useState(false)
    const [disconnectedClinics, setDisconnectedClinics] = useState<string[]>([])
    const [isAlertOpen, setIsAlertOpen] = useState(false)
    const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false)

    useEffect(() => {
        if (!isAdmin) return
        fetchClinics()
    }, [isAdmin])

    const fetchClinics = async () => {
        try {
            // Fetch users with client role
            const { data: users, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('role', 'client')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Fetch real stats for each clinic AND clinic details for name
            const { data: realClinicsData } = await supabase
                .from('clinicas')
                .select('clinic_id, nome_clinica')

            const realClinicsMap = new Map(realClinicsData?.map(rc => [rc.clinic_id, rc.nome_clinica]) || [])

            const clinicsWithStats: Clinic[] = []
            const today = new Date().toISOString().split('T')[0]
            const monthStart = new Date(new Date().setDate(1)).toISOString()

            for (const c of users || []) {
                const realName = c.clinic_id ? realClinicsMap.get(c.clinic_id) : undefined
                const generatedInstanceName = realName
                    ? realName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
                    : (c.username || c.email?.split('@')[0])?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

                if (!c.clinic_id) {
                    clinicsWithStats.push({
                        id: c.id,
                        email: c.email,
                        username: c.username,
                        clinic_id: c.clinic_id,
                        created_at: c.created_at,
                        connectionStatus: 'unknown',
                        instanceName: generatedInstanceName,
                        // ... (keep defaults)
                        totalPatients: undefined,
                        todayAppointments: undefined,
                        monthlyConversations: undefined,
                    })
                    continue
                }

                // Real patient count
                const { count: patientCount } = await supabase
                    .from('dados_cliente')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', c.clinic_id)

                // Real today's appointments
                const { count: aptCount } = await supabase
                    .from('consultas')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', c.clinic_id)
                    .gte('data_inicio', today)

                // Real monthly conversations
                const { count: convCount } = await supabase
                    .from('n8n_chat_histories')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', c.clinic_id)
                    .gte('created_at', monthStart)

                clinicsWithStats.push({
                    id: c.id,
                    email: c.email,
                    username: c.username,
                    clinic_id: c.clinic_id,
                    created_at: c.created_at,
                    totalPatients: patientCount ?? undefined,
                    todayAppointments: aptCount ?? undefined,
                    monthlyConversations: convCount ?? undefined,
                    connectionStatus: 'unknown',
                    instanceName: generatedInstanceName
                })
            }

            setClinics(clinicsWithStats)
        } catch (error) {
            console.error("Error fetching clinics:", error)
        } finally {
            setLoading(false)
        }
    }

    const checkAllStatuses = async (currentClinics = clinics) => {
        setIsCheckingStatus(true)
        try {
            // Use local API proxy to avoid CORS issues
            const webhookUrl = '/api/check-status'

            console.log("Calling API:", webhookUrl)

            const response = await fetch(webhookUrl, {
                method: 'GET',
            })

            console.log("Response status:", response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error("API error response:", errorData)
                alert(`Erro na API (${response.status}): ${errorData.details || errorData.error || 'Erro desconhecido'}`)
                return
            }

            const data = await response.json()
            console.log("Webhook response data:", data)

            // Handle different possible response formats from N8N/Evolution API
            const instances = Array.isArray(data) ? data : (data.instances || data.data || [])

            console.log("Parsed instances:", instances)

            if (instances.length === 0) {
                alert("Nenhuma instância retornada pelo webhook. Verifique a configuração do N8N.")
                return
            }

            let disconnectedList: string[] = []

            setClinics(prev => {
                const updated = prev.map(clinic => {
                    if (!clinic.instanceName) {
                        console.log("Clinic without instanceName:", clinic.username || clinic.email)
                        return clinic
                    }

                    console.log("Looking for instance:", clinic.instanceName)

                    // Find matching instance - try multiple field patterns
                    const match = instances.find((i: any) => {
                        const iName = i.instance?.instanceName || i.instanceName || i.name || i.instance
                        console.log("Comparing:", iName, "vs", clinic.instanceName)
                        return iName === clinic.instanceName
                    })

                    let isConnected = false
                    if (match) {
                        const state = match.instance?.state || match.state || match.status
                        console.log("Match found. State:", state)
                        isConnected = state === 'open' || state === 'connected'
                    } else {
                        console.log("No match found for:", clinic.instanceName)
                    }

                    if (!isConnected && clinic.instanceName) {
                        disconnectedList.push(clinic.username || clinic.email?.split('@')[0] || clinic.instanceName)
                    }

                    return { ...clinic, connectionStatus: (isConnected ? 'connected' : 'disconnected') as 'connected' | 'disconnected' }
                })
                return updated
            })

            if (disconnectedList.length > 0) {
                setDisconnectedClinics(disconnectedList)
                setIsAlertOpen(true)
            } else if (instances.length > 0) {
                setIsSuccessAlertOpen(true)
            }
        } catch (error: any) {
            console.error("Error checking statuses:", error)
            alert(`Erro ao verificar conexões: ${error.message}`)
        } finally {
            setIsCheckingStatus(false)
        }
    }

    const fetchExistingClinics = async () => {
        setLoadingClinics(true)
        try {
            const { data, error } = await supabase
                .from('clinicas')
                .select('id, clinic_id, nome_clinica, status')
                .order('nome_clinica', { ascending: true })

            if (error) throw error
            setExistingClinics(data || [])
        } catch (error) {
            console.error("Error fetching existing clinics:", error)
            setExistingClinics([])
        } finally {
            setLoadingClinics(false)
        }
    }

    const createClinicAndGenerateLink = async () => {
        // Validation based on mode
        if (isSelectExisting) {
            if (!selectedClinicId) {
                setErrorMsg("Selecione uma clínica existente.")
                return
            }
        } else {
            if (!newClinicName.trim()) {
                setErrorMsg("O nome da clínica é obrigatório.")
                return
            }
        }

        setIsCreating(true)
        setErrorMsg("")

        try {
            let clinicId: string
            let clinicName: string

            if (isSelectExisting) {
                // Use the selected existing clinic
                const selectedClinic = existingClinics.find(c => c.clinic_id === selectedClinicId)
                if (!selectedClinic) {
                    throw new Error("Clínica selecionada não encontrada.")
                }
                clinicId = selectedClinic.clinic_id
                clinicName = selectedClinic.nome_clinica
            } else {
                // Create new clinic or use existing with same name
                const { data: existingClinic } = await supabase
                    .from('clinicas')
                    .select('clinic_id, id')
                    .ilike('nome_clinica', newClinicName.trim())
                    .single()

                if (existingClinic) {
                    clinicId = existingClinic.clinic_id
                } else {
                    const newId = crypto.randomUUID()

                    const { data: newClinic, error: createError } = await supabase
                        .from('clinicas')
                        .insert([{
                            nome_clinica: newClinicName.trim(),
                            clinic_id: newId,
                            status: 'ativo'
                        }])
                        .select()
                        .single()

                    if (createError) throw createError
                    clinicId = newClinic.clinic_id
                }
                clinicName = newClinicName.trim()
            }

            // Generate registration token
            const token = crypto.randomUUID()

            // Insert into pending_registrations
            const { error: insertError } = await supabase
                .from('pending_registrations')
                .insert([{
                    token: token,
                    clinic_id: clinicId,
                    clinic_name: clinicName,
                    used: false
                }])

            if (insertError) throw insertError

            // Show link
            const baseUrl = window.location.origin
            setRegistrationLink(`${baseUrl}/register/${token}`)

        } catch (error: any) {
            console.error("Error creating clinic:", error)
            setErrorMsg(error.message || "Erro ao criar clínica.")
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
        setNewClinicName("")
        setRegistrationLink("")
        setCopied(false)
        setErrorMsg("")
        setIsSelectExisting(false)
        setSelectedClinicId("")
        setExistingClinics([])
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
        <div className="space-y-6 animate-in fade-in duration-500">
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
                    {/* Check Status Button */}
                    <Button
                        variant="outline"
                        onClick={() => checkAllStatuses()}
                        disabled={isCheckingStatus || loading}
                        className="mr-2"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                        Verificar Conexões
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetDialog(); }}>
                        <DialogTrigger asChild>
                            <Button className="shrink-0 bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Nova Clínica</DialogTitle>
                                <DialogDescription>
                                    Crie uma nova clínica ou selecione uma existente para gerar um link de registro.
                                </DialogDescription>
                            </DialogHeader>

                            {!registrationLink ? (
                                <div className="space-y-4 py-4">
                                    {/* Mode Toggle Tabs */}
                                    <Tabs
                                        value={isSelectExisting ? "existing" : "new"}
                                        onValueChange={(value) => {
                                            setIsSelectExisting(value === "existing")
                                            setErrorMsg("")
                                            if (value === "existing") {
                                                fetchExistingClinics()
                                            }
                                        }}
                                    >
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="new">Nova Clínica</TabsTrigger>
                                            <TabsTrigger value="existing">Clínica Existente</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    {!isSelectExisting ? (
                                        // Create New Clinic Form
                                        <div className="space-y-2">
                                            <Label htmlFor="clinicName">Nome da Clínica</Label>
                                            <Input
                                                id="clinicName"
                                                placeholder="Ex: Clínica Saúde Total"
                                                value={newClinicName}
                                                onChange={e => setNewClinicName(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Este nome será usado para criar o registro no banco de dados.
                                            </p>
                                        </div>
                                    ) : (
                                        // Select Existing Clinic Form
                                        <div className="space-y-2">
                                            <Label>Selecione a Clínica</Label>
                                            {loadingClinics ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                    <span className="ml-2 text-sm text-muted-foreground">Carregando clínicas...</span>
                                                </div>
                                            ) : existingClinics.length === 0 ? (
                                                <div className="text-center py-4 text-sm text-muted-foreground">
                                                    Nenhuma clínica encontrada no banco de dados.
                                                </div>
                                            ) : (
                                                <>
                                                    <Select
                                                        value={selectedClinicId}
                                                        onValueChange={setSelectedClinicId}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma clínica..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {existingClinics.map((clinic) => (
                                                                <SelectItem key={clinic.clinic_id} value={clinic.clinic_id}>
                                                                    <div className="flex flex-col">
                                                                        <span>{clinic.nome_clinica}</span>
                                                                        <span className="text-xs text-muted-foreground">ID: {clinic.clinic_id.slice(0, 8)}...</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground">
                                                        {existingClinics.length} clínica(s) disponível(is).
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {errorMsg && (
                                        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                            {errorMsg}
                                        </p>
                                    )}
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
                                            Envie este link para o cliente. Ele criará o usuário e senha.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                {!registrationLink ? (
                                    <Button
                                        onClick={createClinicAndGenerateLink}
                                        disabled={(isSelectExisting ? !selectedClinicId : !newClinicName) || isCreating}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                                            </>
                                        ) : "Gerar Link"}
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
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">{clinic.email || clinic.username}</p>
                                    {clinic.connectionStatus && clinic.connectionStatus !== 'unknown' && (
                                        <Badge variant={clinic.connectionStatus === 'connected' ? 'default' : 'destructive'} className={clinic.connectionStatus === 'connected' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-0'}>
                                            <MessageSquare className="w-3 h-3 mr-1" />
                                            {clinic.connectionStatus === 'connected' ? 'WhatsApp Conectado' : 'WhatsApp Offline'}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.totalPatients !== undefined ? clinic.totalPatients : '-'}</p>
                                        <p className="text-[10px] text-muted-foreground">Pacientes</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.todayAppointments !== undefined ? clinic.todayAppointments : '-'}</p>
                                        <p className="text-[10px] text-muted-foreground">Hoje</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.monthlyConversations !== undefined ? clinic.monthlyConversations : '-'}</p>
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
            {/* Disconnected Alert Dialog */}
            <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Instâncias Desconectadas
                        </DialogTitle>
                        <DialogDescription>
                            As seguintes clínicas estão com o WhatsApp desconectado ou instável:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                        {disconnectedClinics.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-3 rounded bg-destructive/10 text-destructive text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {name}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsAlertOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Alert Dialog */}
            <Dialog open={isSuccessAlertOpen} onOpenChange={setIsSuccessAlertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="h-5 w-5" />
                            Tudo Conectado!
                        </DialogTitle>
                        <DialogDescription>
                            Todas as instâncias verificadas estão conectadas e operando normalmente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <div className="bg-green-500/10 p-4 rounded-full">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsSuccessAlertOpen(false)} className="bg-green-500 hover:bg-green-600 text-white">Ótimo!</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
