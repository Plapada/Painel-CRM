"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Search, ArrowRight, Users, Calendar, MessageSquare, Plus, Copy, Check, Link as LinkIcon, Loader2, RefreshCw, Smartphone, AlertTriangle, CheckCircle, Bell, BellOff } from "lucide-react"
import Link from "next/link"
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger, ModalDescription } from "@/components/ui/animated-modal"
import { Badge } from "@/components/ui/badge"
import { usePushNotifications } from "@/hooks/usePushNotifications"

interface Clinic {
    id: string
    email: string
    username: string
    created_at: string
    role?: string
}

interface InstanceStatus {
    instanceName: string
    status: 'open' | 'close' | 'connecting' | 'unknown'
    profileName?: string
    profilePicUrl?: string
    connectionStatus?: 'unknown' | 'checking' | 'connected' | 'disconnected'
    nome?: string // Clinic real name from metadata or username
    isLoading?: boolean
}

export default function ClinicsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role // Fallback to admin if role missing for main user

    // State
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // New Clinic Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSelectExisting, setIsSelectExisting] = useState(false)
    const [existingClinics, setExistingClinics] = useState<Clinic[]>([])
    const [selectedClinicId, setSelectedClinicId] = useState<string>("")
    const [newClinicName, setNewClinicName] = useState("")
    const [registrationLink, setRegistrationLink] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [copied, setCopied] = useState(false)

    // Instance Statuses
    const [instanceStatuses, setInstanceStatuses] = useState<Record<string, InstanceStatus>>({})
    const [isCheckingStatus, setIsCheckingStatus] = useState(false)
    const [connectedClinics, setConnectedClinics] = useState<string[]>([])
    const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false)

    // Push Notifications
    const { isSupported, subscription, subscribeToNotifications, isLoading: isPushLoading } = usePushNotifications()

    useEffect(() => {
        if (!isAdmin) return
        fetchClinics()
    }, [isAdmin])

    const fetchClinics = async () => {
        try {
            setLoading(true)

            const { data, error: fetchError } = await supabase
                .from('profiles') // Adjust if table name is different
                .select('*')
                .eq('role', 'client')

            if (fetchError) throw fetchError
            setClinics(data || [])

            // Auto check statuses
            checkAllStatuses(data || [])

        } catch (error) {
            console.error("Error fetching clinics:", error)
            // Fallback for demo if table missing
        } finally {
            setLoading(false)
        }
    }

    // Helper to generate instance name
    const getInstanceName = (clinicName: string) => {
        return clinicName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
    }

    const checkAllStatuses = async (clinicsList = clinics) => {
        setIsCheckingStatus(true)
        const newStatuses: Record<string, InstanceStatus> = {}
        const connected: string[] = []

        try {
            // Parallel checks
            await Promise.all(clinicsList.map(async (c) => {
                const name = c.username || c.email.split('@')[0]
                const instanceName = getInstanceName(name)

                newStatuses[c.id] = {
                    instanceName,
                    status: 'unknown',
                    connectionStatus: 'checking',
                    nome: name,
                    isLoading: true
                }

                try {
                    const res = await fetch(process.env.NEXT_PUBLIC_WEBHOOK_STATUS_INSTANCIA!, {
                        method: 'POST',
                        body: JSON.stringify({ instanceName })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        // Check connectivity logic (same as QR code)
                        let isConn = false
                        if (Array.isArray(data) && data.length > 0) {
                            if (data[0]?.instance?.state === 'open') isConn = true
                        } else if (data.instance?.state === 'open') {
                            isConn = true
                        }

                        newStatuses[c.id] = {
                            instanceName,
                            status: isConn ? 'open' : 'close',
                            connectionStatus: isConn ? 'connected' : 'disconnected',
                            nome: name,
                            isLoading: false
                        }

                        if (isConn) connected.push(name)
                    }
                } catch (e) {
                    newStatuses[c.id] = { instanceName, status: 'unknown', nome: name, connectionStatus: 'unknown', isLoading: false }
                }
            }))

            setInstanceStatuses(prev => ({ ...prev, ...newStatuses }))

            if (connected.length > 0) {
                setConnectedClinics(connected)
                setIsSuccessAlertOpen(true)
            }

        } catch (err) {
            console.error(err)
        } finally {
            setIsCheckingStatus(false)
        }
    }

    const fetchExistingClinics = async () => {
        // ... logic
    }

    const handleCreateLink = async () => {
        // ... logic
    }

    const copyLink = () => {
        navigator.clipboard.writeText(registrationLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const resetDialog = () => {
        setIsCreating(false)
        setRegistrationLink("")
        setSelectedClinicId("")
    }

    // Filter
    const filteredClinics = clinics.filter(c =>
        (c.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Clínicas</h1>
                    <p className="text-muted-foreground">Gerencie suas clínicas parceiras.</p>
                </div>

                {/* Responsive Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clínica..."
                            className="pl-10 w-full"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible no-scrollbar">
                        <Button
                            variant="outline"
                            onClick={() => checkAllStatuses()}
                            disabled={isCheckingStatus || loading}
                            className="whitespace-nowrap"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Verificar</span>
                            <span className="sm:hidden">Verificar</span>
                        </Button>

                        {isSupported && (
                            <Button
                                variant="outline"
                                onClick={subscribeToNotifications}
                                disabled={isPushLoading || !!subscription}
                                className={`whitespace-nowrap ${subscription ? "text-green-500 border-green-500/30 bg-green-500/5" : ""}`}
                            >
                                {isPushLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : subscription ? (
                                    <Bell className="mr-2 h-4 w-4" />
                                ) : (
                                    <BellOff className="mr-2 h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">{subscription ? "Notificações Ativas" : "Ativar Notificações"}</span>
                                <span className="sm:hidden">{subscription ? "Ativo" : "Alertas"}</span>
                            </Button>
                        )}

                        <Modal open={isDialogOpen} onOpenChange={(open: boolean) => { setIsDialogOpen(open); if (!open) resetDialog(); }}>
                            <ModalTrigger asChild>
                                <Button className="shrink-0 bg-primary hover:bg-primary/90 whitespace-nowrap">
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Nova Clínica</span>
                                    <span className="sm:hidden">Nova</span>
                                </Button>
                            </ModalTrigger>
                            <ModalContent className="sm:max-w-md">
                                <ModalHeader>
                                    <ModalTitle>Cadastrar Nova Clínica</ModalTitle>
                                    <ModalDescription>
                                        Gere um link para a clínica conectar o WhatsApp.
                                    </ModalDescription>
                                </ModalHeader>
                                <ModalBody>
                                    {!registrationLink ? (
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nome da Clínica</label>
                                                <Input
                                                    value={newClinicName}
                                                    onChange={e => setNewClinicName(e.target.value)}
                                                    placeholder="Ex: Clínica Sorriso"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleCreateLink}
                                                disabled={!newClinicName || isCreating}
                                                className="w-full"
                                            >
                                                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                                                Gerar Link
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 py-4">
                                            <div className="p-4 bg-muted rounded-lg break-all text-sm font-mono border">
                                                {registrationLink}
                                            </div>
                                            <Button onClick={copyLink} className="w-full" variant="outline">
                                                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                                {copied ? "Copiado!" : "Copiar Link"}
                                            </Button>
                                        </div>
                                    )}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredClinics.map((clinic) => {
                    const status = instanceStatuses[clinic.id]
                    return (
                        <Card key={clinic.id} className="overflow-hidden border-l-4 border-l-primary/50 hover:border-l-primary transition-all duration-300">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {clinic.username || clinic.email}
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-playfair">{status?.nome || '...'}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    {status?.isLoading ? (
                                        <Badge variant="outline" className="text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Verificando</Badge>
                                    ) : status?.status === 'open' ? (
                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Online</Badge>
                                    ) : (
                                        <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Offline</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Success Modal */}
            <Modal open={isSuccessAlertOpen} onOpenChange={setIsSuccessAlertOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle className="text-green-500 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6" /> Conexões Ativas
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        <div className="py-4 space-y-2 max-h-[40vh] overflow-y-auto">
                            {connectedClinics.map((name, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>{name}</span>
                                </div>
                            ))}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={() => setIsSuccessAlertOpen(false)}>Fechar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
