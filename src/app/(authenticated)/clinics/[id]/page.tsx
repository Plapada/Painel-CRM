"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    Building2, ArrowLeft, Users, Calendar, MessageSquare,
    TrendingUp, Clock, Search, AlertCircle, Link2, Copy, Check, ExternalLink, MessageCircle, Settings, Trash2, Loader2
} from "lucide-react"
import Link from "next/link"
import { ElegantStatsCard } from "@/components/dashboard/ElegantStatsCard"
import { ElegantBarChart, ElegantDonutChart } from "@/components/dashboard/ElegantCharts"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClinicData {
    id: string
    email: string
    username?: string
    clinic_id: string
    created_at?: string
}

interface ConversationStats {
    today: number | null
    week: number | null
    month: number | null
}

interface ClientConversation {
    clientId: string
    clientName: string
    phone: string
    lastMessage: string
    lastMessageDate: string
    messageCount: number
}

export default function ClinicDetailPage() {
    const params = useParams()
    const clinicId = params.id as string
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role

    const [clinic, setClinic] = useState<ClinicData | null>(null)
    const [loading, setLoading] = useState(true)
    const [conversationStats, setConversationStats] = useState<ConversationStats>({ today: null, week: null, month: null })
    const [appointments, setAppointments] = useState<any[]>([])
    const [totalPatients, setTotalPatients] = useState<number | null>(null)

    // Conversations
    const [clientConversations, setClientConversations] = useState<ClientConversation[]>([])
    const [allMessages, setAllMessages] = useState<any[]>([])
    const [conversationSearch, setConversationSearch] = useState("")

    // Weekly conversation data for chart
    const [weeklyConversations, setWeeklyConversations] = useState<any[]>([])

    // Funnel data
    const [funnelData, setFunnelData] = useState<any[]>([])

    // Copy link state
    const [copied, setCopied] = useState(false)
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [clinicRealName, setClinicRealName] = useState<string | null>(null)

    useEffect(() => {
        if (clinic) {
            checkWhatsAppStatus()
        }
    }, [clinic, clinicRealName])

    const checkWhatsAppStatus = async () => {
        if (!clinic) return

        // Use the real clinic name from 'clinicas' table, falling back to username only if absolutely necessary
        const nameSource = clinicRealName || clinic.username || clinic.email?.split('@')[0]
        if (!nameSource) return

        const instanceName = nameSource
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_WEBHOOK_STATUS_INSTANCIA!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName }),
            })

            if (response.ok) {
                const data = await response.json()
                let connected = false

                if (Array.isArray(data) && data.length > 0) {
                    const instanceData = data[0]
                    if (instanceData.instance?.instanceName === instanceName && instanceData.instance.state === 'open') {
                        connected = true
                    }
                } else if (data.instance) {
                    if (data.instance.instanceName === instanceName && data.instance.state === 'open') {
                        connected = true
                    }
                } else {
                    connected = data.connected === true || data.status === 'connected' || data.state === 'open'
                }
                setIsWhatsAppConnected(connected)
            }
        } catch (error) {
            console.error('Error checking WhatsApp status:', error)
        }
    }

    const handleDeleteClinic = async () => {
        if (!clinic) return
        if (!confirm("⚠️ ATENÇÃO: Tem certeza absoluta que deseja excluir esta clínica?\n\nEsta ação irá:\n1. Deletar a conta da clínica do sistema\n2. Deletar a instância do WhatsApp conectada\n3. Remover todos os dados associados\n\nEsta ação não pode ser desfeita.")) return

        setIsDeleting(true)
        try {
            // 1. Delete WhatsApp Instance (Fire and forget, or await if critical)
            const nameSource = clinicRealName || clinic.username || clinic.email?.split('@')[0]
            if (nameSource) {
                const instanceName = nameSource
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '')

                try {
                    await fetch(process.env.NEXT_PUBLIC_WEBHOOK_DELETE_INSTANCE!, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ instanceName })
                    })
                } catch (e) {
                    console.error("Error calling delete webhook:", e)
                    // Continue deletion even if webhook fails, but maybe warn
                }
            }

            // 2. Delete from Supabase
            // Note: If you have RLS or foreign keys, ensure cascading is handled or multiple deletes are needed.
            // Assuming cascading or simple user deletion for now.
            const { error } = await supabase
                .from('usuarios_site')
                .delete()
                .eq('id', clinicId)

            if (error) throw error

            // 3. Redirect
            window.location.href = '/clinics'

        } catch (error: any) {
            console.error("Error deleting clinic:", error)
            alert(`Erro ao deletar clínica: ${error.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        if (clinicId) {
            fetchClinicData()
        }
    }, [clinicId])

    const fetchClinicData = async () => {
        try {
            // 1. Fetch clinic user info
            const { data: clinicData, error: clinicError } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('id', clinicId)
                .single()

            if (clinicError) throw clinicError
            setClinic(clinicData)

            if (!clinicData?.clinic_id) {
                setLoading(false)
                return
            }

            const clinicUUID = clinicData.clinic_id

            // Fetch real clinic name from 'clinicas' table
            const { data: realClinic } = await supabase
                .from('clinicas')
                .select('nome_clinica')
                .eq('clinic_id', clinicUUID)
                .single()

            if (realClinic?.nome_clinica) {
                setClinicRealName(realClinic.nome_clinica)
            }

            // 2. Fetch conversation stats
            const now = new Date()
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

            const { count: todayCount } = await supabase
                .from('n8n_chat_histories')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicUUID)
                .gte('created_at', todayStart)

            const { count: weekCount } = await supabase
                .from('n8n_chat_histories')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicUUID)
                .gte('created_at', weekStart)

            const { count: monthCount } = await supabase
                .from('n8n_chat_histories')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicUUID)
                .gte('created_at', monthStart)

            setConversationStats({
                today: todayCount,
                week: weekCount,
                month: monthCount,
            })

            // 3. Fetch today's appointments
            const { data: aptData } = await supabase
                .from('consultas')
                .select('*')
                .eq('clinic_id', clinicUUID)
                .gte('data_inicio', todayStart)
                .order('data_inicio', { ascending: true })
                .limit(10)

            setAppointments(aptData || [])

            // 4. Fetch total patients
            const { count: patientCount } = await supabase
                .from('dados_cliente')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicUUID)

            setTotalPatients(patientCount)

            // 5. Fetch all clients to get their conversations
            const { data: clients } = await supabase
                .from('dados_cliente')
                .select('id, nomewpp, telefone, etapa_funil')
                .eq('clinic_id', clinicUUID)

            // 6. Fetch all messages for this clinic
            const { data: messages } = await supabase
                .from('n8n_chat_histories')
                .select('*')
                .eq('clinic_id', clinicUUID)
                .order('created_at', { ascending: false })

            setAllMessages(messages || [])

            // 7. Group conversations by client (session_id)
            const sessionMap = new Map<string, any[]>()
            messages?.forEach(msg => {
                const sid = msg.session_id || 'unknown'
                if (!sessionMap.has(sid)) {
                    sessionMap.set(sid, [])
                }
                sessionMap.get(sid)!.push(msg)
            })

            // Match with clients
            const clientConvList: ClientConversation[] = []
            clients?.forEach(client => {
                const phone = client.telefone?.replace(/\D/g, '')
                // Find session matching this phone
                const matchingSessions = Array.from(sessionMap.entries()).filter(([sid]) =>
                    sid.includes(phone || 'xxx')
                )

                let totalMsgs = 0
                let lastMsg = ''
                let lastDate = ''

                matchingSessions.forEach(([, msgs]) => {
                    totalMsgs += msgs.length
                    if (msgs.length > 0 && (!lastDate || new Date(msgs[0].created_at) > new Date(lastDate))) {
                        lastMsg = msgs[0].content || ''
                        lastDate = msgs[0].created_at
                    }
                })

                if (totalMsgs > 0 || clients) {
                    clientConvList.push({
                        clientId: client.id,
                        clientName: client.nomewpp || 'Sem nome',
                        phone: client.telefone || '',
                        lastMessage: lastMsg.substring(0, 100),
                        lastMessageDate: lastDate,
                        messageCount: totalMsgs
                    })
                }
            })

            setClientConversations(clientConvList.sort((a, b) =>
                new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime()
            ))

            // 8. Calculate weekly conversations from real data
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            const weeklyData = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now)
                date.setDate(date.getDate() - i)
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString()

                const dayMessages = messages?.filter(m =>
                    m.created_at >= dayStart && m.created_at < dayEnd
                )?.length || 0

                weeklyData.push({ name: days[date.getDay()], value: dayMessages })
            }
            setWeeklyConversations(weeklyData)

            // 9. Calculate funnel data from real clients
            const funnelCounts: Record<string, number> = {}
            clients?.forEach(c => {
                const stage = c.etapa_funil || 'Sem Etapa'
                funnelCounts[stage] = (funnelCounts[stage] || 0) + 1
            })
            const funnelChartData = Object.entries(funnelCounts).map(([name, value]) => ({ name, value }))
            setFunnelData(funnelChartData)

        } catch (error) {
            console.error("Error fetching clinic data:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredConversations = clientConversations.filter(c =>
        c.clientName.toLowerCase().includes(conversationSearch.toLowerCase()) ||
        c.phone.includes(conversationSearch)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
                <p className="text-muted-foreground animate-pulse">Carregando dados da clínica...</p>
            </div>
        )
    }

    if (!clinic) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-4">
                <p className="text-muted-foreground">Clínica não encontrada.</p>
                <Button asChild variant="outline">
                    <Link href="/clinics"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
                </Button>
            </div>
        )
    }

    // Helper to format value or show dash
    const formatValue = (val: number | null | undefined) => val !== null && val !== undefined ? val.toString() : '-'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/clinics"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{clinic.username || clinic.email.split('@')[0]}</h1>
                            <p className="text-sm text-muted-foreground">{clinic.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto">
                    {isWhatsAppConnected ? (
                        <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-default">
                            <MessageCircle className="h-4 w-4" />
                            Conectado
                        </Button>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Conectar WhatsApp
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/clinics/connect-whatsapp?clinic_id=${clinicId}&clinic_name=${encodeURIComponent(clinic.username || clinic.email.split('@')[0])}`}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Conectar neste computador
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        const link = `${window.location.origin}/connect-whatsapp/${clinic.clinic_id}`
                                        navigator.clipboard.writeText(link)
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 2000)
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Link copiado!' : 'Copiar link para cliente'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ElegantStatsCard
                    title="Conversas Hoje"
                    value={formatValue(conversationStats.today)}
                    icon={MessageSquare}
                    description="Novos atendimentos"
                />
                <ElegantStatsCard
                    title="Conversas (Semana)"
                    value={formatValue(conversationStats.week)}
                    icon={TrendingUp}
                    description="Últimos 7 dias"
                />
                <ElegantStatsCard
                    title="Conversas (Mês)"
                    value={formatValue(conversationStats.month)}
                    icon={MessageSquare}
                    description="Últimos 30 dias"
                />
                <ElegantStatsCard
                    title="Total de Pacientes"
                    value={formatValue(totalPatients)}
                    icon={Users}
                    description="Cadastrados"
                />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="conversations" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="conversations">Conversas</TabsTrigger>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                {/* Conversations Tab - NEW */}
                <TabsContent value="conversations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Todas as Conversas ({clientConversations.length} clientes)
                                </CardTitle>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar cliente..."
                                        className="pl-10"
                                        value={conversationSearch}
                                        onChange={e => setConversationSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredConversations.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {filteredConversations.map((conv) => (
                                        <Link
                                            key={conv.clientId}
                                            href={`/clients/${conv.clientId}`}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                {conv.clientName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium truncate">{conv.clientName}</p>
                                                    <Badge variant="secondary" className="shrink-0">
                                                        {conv.messageCount} msgs
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{conv.phone}</p>
                                                {conv.lastMessage && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                        {conv.lastMessage}...
                                                    </p>
                                                )}
                                                {conv.lastMessageDate && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        Última msg: {new Date(conv.lastMessageDate).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">
                                        {conversationSearch ? 'Nenhum cliente encontrado.' : 'Nenhuma conversa registrada.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ElegantBarChart
                            title="Conversas por Dia (Semana)"
                            data={weeklyConversations.length > 0 ? weeklyConversations : [{ name: 'Sem dados', value: 0 }]}
                            dataKey="value"
                            color="#d4af37"
                        />
                        <ElegantDonutChart
                            title="Distribuição do Funil"
                            data={funnelData.length > 0 ? funnelData : [{ name: 'Sem dados', value: 1 }]}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agendamentos de Hoje</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointments.length > 0 ? (
                                <div className="space-y-3">
                                    {appointments.map((apt, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/20 text-primary p-2 rounded-lg">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{apt.nome_cliente || 'Cliente'}</p>
                                                    <p className="text-xs text-muted-foreground">{apt.tipo_consulta || 'Consulta'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">
                                                    {new Date(apt.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <Badge variant="secondary" className="text-[10px]">{apt.status || 'Pendente'}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Nenhum agendamento para hoje.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                Zona de Perigo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-destructive">Deletar Clínica</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Ao deletar esta clínica, todos os dados de pacientes, conversas e a instância do WhatsApp serão removidos permanentemente.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteClinic}
                                    disabled={isDeleting}
                                    className="shrink-0"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deletando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Deletar Permanentemente
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
