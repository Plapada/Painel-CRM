"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Building2, ArrowLeft, Users, Calendar, MessageSquare,
    TrendingUp, DollarSign, Clock
} from "lucide-react"
import Link from "next/link"
import { ElegantStatsCard } from "@/components/dashboard/ElegantStatsCard"
import { ElegantBarChart, ElegantDonutChart } from "@/components/dashboard/ElegantCharts"

interface ClinicData {
    id: string
    email: string
    clinic_id: string
    created_at?: string
}

interface ConversationStats {
    today: number
    week: number
    month: number
}

export default function ClinicDetailPage() {
    const params = useParams()
    const clinicId = params.id as string
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role

    const [clinic, setClinic] = useState<ClinicData | null>(null)
    const [loading, setLoading] = useState(true)
    const [conversationStats, setConversationStats] = useState<ConversationStats>({ today: 0, week: 0, month: 0 })
    const [appointments, setAppointments] = useState<any[]>([])
    const [recentMessages, setRecentMessages] = useState<any[]>([])

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

            // 2. Fetch conversation stats using clinic's clinic_id
            if (clinicData?.clinic_id) {
                const now = new Date()
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
                const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString()
                const monthStart = new Date(now.setMonth(now.getMonth() - 1)).toISOString()

                // Today's conversations (New Chats)
                const { count: todayCount } = await supabase
                    .from('chats')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinicData.clinic_id)
                    .gte('created_at', todayStart)

                // Week's conversations
                const { count: weekCount } = await supabase
                    .from('chats')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinicData.clinic_id)
                    .gte('created_at', weekStart)

                // Month's conversations
                const { count: monthCount } = await supabase
                    .from('chats')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinicData.clinic_id)
                    .gte('created_at', monthStart)

                setConversationStats({
                    today: todayCount || 0,
                    week: weekCount || 0,
                    month: monthCount || 0,
                })

                // 3. Fetch today's appointments
                const { data: aptData } = await supabase
                    .from('consultas')
                    .select('*')
                    .eq('clinic_id', clinicData.clinic_id)
                    .gte('data_inicio', todayStart)
                    .order('data_inicio', { ascending: true })
                    .limit(10)

                setAppointments(aptData || [])

                // 4. Fetch recent messages
                const { data: msgData } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('clinic_id', clinicData.clinic_id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                setRecentMessages(msgData || [])
            }
        } catch (error) {
            console.error("Error fetching clinic data:", error)
        } finally {
            setLoading(false)
        }
    }

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

    // Mock data for charts (in production, fetch real data)
    const weeklyConversations = [
        { name: 'Seg', value: Math.floor(Math.random() * 50) + 10 },
        { name: 'Ter', value: Math.floor(Math.random() * 50) + 10 },
        { name: 'Qua', value: Math.floor(Math.random() * 50) + 10 },
        { name: 'Qui', value: Math.floor(Math.random() * 50) + 10 },
        { name: 'Sex', value: Math.floor(Math.random() * 50) + 10 },
        { name: 'Sab', value: Math.floor(Math.random() * 20) },
        { name: 'Dom', value: Math.floor(Math.random() * 10) },
    ]

    const conversionData = [
        { name: 'Agendados', value: 45 },
        { name: 'Em Contato', value: 30 },
        { name: 'Perdidos', value: 25 },
    ]

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
                            <h1 className="text-2xl font-bold">{clinic.email.split('@')[0]}</h1>
                            <p className="text-sm text-muted-foreground">{clinic.email}</p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/30 self-start md:self-auto">Ativo</Badge>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ElegantStatsCard
                    title="Conversas Hoje"
                    value={conversationStats.today.toString()}
                    icon={MessageSquare}
                    description="Novos atendimentos"
                />
                <ElegantStatsCard
                    title="Conversas (Semana)"
                    value={conversationStats.week.toString()}
                    icon={TrendingUp}
                    trend="+12%"
                    trendUp={true}
                    description="Últimos 7 dias"
                />
                <ElegantStatsCard
                    title="Conversas (Mês)"
                    value={conversationStats.month.toString()}
                    icon={MessageSquare}
                    description="Últimos 30 dias"
                />
                <ElegantStatsCard
                    title="Agendamentos Hoje"
                    value={appointments.length.toString()}
                    icon={Calendar}
                    description="Consultas marcadas"
                />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                    <TabsTrigger value="conversations">Atividade Recente</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ElegantBarChart
                            title="Conversas por Dia (Semana)"
                            data={weeklyConversations}
                            dataKey="value"
                            color="#d4af37"
                        />
                        <ElegantDonutChart
                            title="Taxa de Conversão"
                            data={conversionData}
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

                <TabsContent value="conversations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mensagens Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentMessages.length > 0 ? (
                                <div className="space-y-3">
                                    {recentMessages.map((msg, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                {msg.user_message ? 'U' : 'IA'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm line-clamp-2">
                                                    {msg.user_message || msg.bot_message || '...'}
                                                </p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(msg.created_at).toLocaleString()}
                                                    </p>
                                                    <Badge variant="outline" className="text-[10px] h-4">
                                                        {msg.message_type || 'text'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Nenhuma atividade recente.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
