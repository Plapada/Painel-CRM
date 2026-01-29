"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ElegantStatsCard } from "@/components/dashboard/ElegantStatsCard"
import {
    ElegantAreaChart,
    ElegantBarChart,
    ElegantDonutChart
} from "@/components/dashboard/ElegantCharts"
import {
    DollarSign,
    Calendar,
    Users,
    TrendingUp,
    Activity,
    Building2,
    MessageSquare,
    ArrowRight,
    CreditCard
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ClinicStats {
    id: string
    name: string
    email?: string
    username?: string
    totalConversations: number
    todayAppointments: number
    totalPatients: number
}

export default function DashboardPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'

    const [loading, setLoading] = useState(true)

    // Admin stats
    const [clinics, setClinics] = useState<ClinicStats[]>([])
    const [totalClinics, setTotalClinics] = useState(0)
    const [totalConversations, setTotalConversations] = useState(0)
    const [totalAppointments, setTotalAppointments] = useState(0)
    const [totalPatients, setTotalPatients] = useState(0)

    // Charts data (admin)
    const [conversationsByClinic, setConversationsByClinic] = useState<any[]>([])
    const [appointmentsByDay, setAppointmentsByDay] = useState<any[]>([])
    const [conversionData, setConversionData] = useState<any[]>([])

    // Client stats - now using null to indicate "no data"
    const [stats, setStats] = useState({
        totalRevenue: null as number | null,
        todayAppointments: null as number | null,
        newPatients: null as number | null,
        monthlyConversations: null as number | null,
    })
    const [recentAppointments, setRecentAppointments] = useState<any[]>([])
    const [recentPatients, setRecentPatients] = useState<any[]>([])
    const [funnelData, setFunnelData] = useState<any[]>([])

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData()
        } else {
            fetchClientData()
        }
    }, [isAdmin, user])

    const fetchAdminData = async () => {
        try {
            setLoading(true)

            // 1. Fetch all client users (clinics)
            const { data: clientUsers, error: clientError } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('role', 'client')

            if (clientError) throw clientError

            const clinicsList: ClinicStats[] = []
            let totalConv = 0
            let totalApt = 0
            let totalPat = 0

            // 2. For each clinic, fetch their stats
            for (const client of clientUsers || []) {
                if (!client.clinic_id) continue

                // Conversations count
                const { count: convCount } = await supabase
                    .from('n8n_chat_histories')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)

                // Today's appointments
                const today = new Date().toISOString().split('T')[0]
                const { count: aptCount } = await supabase
                    .from('consultas')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)
                    .gte('data_inicio', today)

                // Total patients
                const { count: patCount } = await supabase
                    .from('dados_cliente')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)

                const clinicStats: ClinicStats = {
                    id: client.id,
                    name: client.username || client.email?.split('@')[0] || 'Clínica',
                    email: client.email,
                    username: client.username,
                    totalConversations: convCount || 0,
                    todayAppointments: aptCount || 0,
                    totalPatients: patCount || 0
                }

                clinicsList.push(clinicStats)
                totalConv += convCount || 0
                totalApt += aptCount || 0
                totalPat += patCount || 0
            }

            setClinics(clinicsList)
            setTotalClinics(clientUsers?.length || 0)
            setTotalConversations(totalConv)
            setTotalAppointments(totalApt)
            setTotalPatients(totalPat)

            // Prepare chart data
            setConversationsByClinic(
                clinicsList.map(c => ({ name: c.name, value: c.totalConversations }))
            )

            // Conversion funnel (mock based on real patient data)
            setConversionData([
                { name: 'Leads', value: Math.round(totalPat * 1.5) },
                { name: 'Agendados', value: totalApt },
                { name: 'Convertidos', value: totalPat },
            ])

            // Appointments by day (last 7 days)
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            const today = new Date()
            const last7Days = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dayName = days[date.getDay()]
                const dateStr = date.toISOString().split('T')[0]

                // Count appointments for this day across all clinics
                const { count } = await supabase
                    .from('consultas')
                    .select('*', { count: 'exact', head: true })
                    .gte('data_inicio', dateStr)
                    .lt('data_inicio', new Date(date.getTime() + 86400000).toISOString().split('T')[0])

                last7Days.push({ name: dayName, value: count || 0 })
            }
            setAppointmentsByDay(last7Days)

        } catch (error) {
            console.error("Error fetching admin data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchClientData = async () => {
        if (!user?.clinic_id) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // 1. Fetch Clients
            const { data: clients, error: clientError } = await supabase
                .from('dados_cliente')
                .select('*')
                .eq('clinic_id', user.clinic_id)

            if (clientError) throw clientError

            // 2. Fetch Appointments
            const { data: appointments, error: aptError } = await supabase
                .from('consultas')
                .select('*')
                .eq('clinic_id', user.clinic_id)
                .order('data_inicio', { ascending: true })

            if (aptError) throw aptError

            // -- Process Data --
            const newPatientsCount = clients ? clients.length : 0
            const today = new Date().toISOString().split('T')[0]
            const todayAppointmentsCount = appointments ? appointments.filter(a => a.data_inicio?.startsWith(today)).length : 0

            // Procedure Price Mapping
            const PROCEDURE_PRICES: Record<string, number> = {
                'COLPOSCOPIA': 150,
                'EXAME A FRESCO': 150,
                'VULVOSCOPIA': 150,
                'VAGINOSCOPIA': 180,
                'CITOLOGIA': 150, // Shortened for match
                'CITOLOGIA E MICROFLORA VAGINAL': 150,
                'CITOLOGIA HORMONAL ISOLADA': 150,
                'COLETA DE MATERIAL': 120,
                'ELETROCAUTERIZAÇÃO': 500,
                'CAUTERIZAÇÃO QUIMICA': 250,
                'BIOPSIA DE COLO': 500,
                'BIOPSIA DE COLO UTERINO COM PINÇA': 500,
                'BIOPSIA DE COLO UTERINO COM LEEP': 800,
                'BIOPSIA DE VULVA': 600,
                'BIOPSIA DE VULVA COM PINÇA': 600,
                'BIOPSIA DE VULVA COM LEEP': 800,
                'BIOPSIA DA VAGINA': 600,
                'BIOPSIA DA VAGINA COM PINÇA': 600,
                'BIOPSIA DA VAGINA COM LEEP': 800,
                'EXERESE DE LESÃO': 900,
                'DRENAGEM BARTHOLIN': 1200,
                'RETIRADA DE CORPO ESTRANHO': 900,
                'RETIRADA DE POLIPO': 600,
                'CONIZAÇÃO': 1500,
                'TRAQUELECTOMIA': 1500,
                'TRAQUELECTOMIA COM LEEP (CONIZAÇÃO) EM CONSULTORIO': 1500,
                'TRAQUELECTOMIA COM LEEP (CONIZAÇÃO) DAYHOSPITAL': 3000,
                'DIU DE COBRE': 1000,
                'INSERÇÃO DIU T/COBRE': 1000,
                'DIU DE PRATA': 1000,
                'INSERÇÃO DIU PRATA': 1000,
                'DIU MIRENA': 1300,
                'INSERÇÃO DIU MIRENA': 1300,
                'IMPLANON': 1300,
                'INSERÇÃO DIU IMPLANON': 1300,
                'RETIRADA DIU': 400,
                'RETIRADA IMPLANON': 600,
                'BIOIMPEDANCIA': 150,
                'ORTOMOLECULAR': 800,
                'CONSULTA GINECOLOGICA': 530,
                'CONSULTA': 530, // Fallback for simple "Consulta"
                'CONSULTA E PREVENTIVO': 830,
                'PREVENTIVO': 300,
            }

            const getPrice = (type: string | null) => {
                if (!type) return 0
                const normalizedType = type.toUpperCase().trim()

                // Direct match
                if (PROCEDURE_PRICES[normalizedType]) return PROCEDURE_PRICES[normalizedType]

                // Partial match (check if any key is part of the type string)
                for (const key of Object.keys(PROCEDURE_PRICES)) {
                    if (normalizedType.includes(key)) {
                        return PROCEDURE_PRICES[key]
                    }
                }

                return 0 // Default if unknown
            }

            let estimatedRevenue = 0
            if (appointments) {
                appointments.forEach(apt => {
                    if (apt.status === 'confirmada') {
                        estimatedRevenue += getPrice(apt.tipo_consulta)
                    }
                })
            }

            // Fetch monthly conversations
            const monthStart = new Date(new Date().setDate(1)).toISOString()
            const { count: convCount } = await supabase
                .from('n8n_chat_histories')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', user.clinic_id)
                .gte('created_at', monthStart)

            setStats({
                totalRevenue: estimatedRevenue,
                todayAppointments: todayAppointmentsCount,
                newPatients: newPatientsCount,
                monthlyConversations: convCount ?? null,
            })

            // Recent Appointments
            const recentAppts = appointments ? appointments
                .filter(a => new Date(a.data_inicio) >= new Date())
                .slice(0, 5)
                .map(a => ({
                    id: a.id,
                    patient: a.nome_cliente || 'Cliente',
                    time: new Date(a.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: a.tipo_consulta || 'Consulta',
                    status: a.status || 'Pendente',
                    condition: 'Geral'
                })) : []
            setRecentAppointments(recentAppts)

            // Recent Clients
            const recentClis = clients ? clients
                .slice(0, 5)
                .map((c: any) => ({
                    id: c.id,
                    name: c.nomewpp || 'Novo Cliente',
                    date: 'Recente',
                    condition: c.etapa_funil || 'Novo Lead',
                    status: 'Novo'
                })) : []
            setRecentPatients(recentClis)

            // Funnel
            const funnelCounts: Record<string, number> = {}
            clients?.forEach((c: any) => {
                const stage = c.etapa_funil || 'Sem Etapa'
                funnelCounts[stage] = (funnelCounts[stage] || 0) + 1
            })
            const funnelChartData = Object.entries(funnelCounts).map(([name, value]) => ({ name, value }))
            setFunnelData(funnelChartData)

        } catch (error) {
            console.error("Error fetching client data:", error)
        } finally {
            setLoading(false)
        }
    }

    // --- ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="space-y-8 p-2 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Painel Administrativo</h1>
                        <Badge className="bg-primary text-primary-foreground">ADMIN</Badge>
                    </div>
                    <p className="text-muted-foreground">Visão global de todas as clínicas gerenciadas.</p>
                </div>

                {/* Admin Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ElegantStatsCard
                        title="Total de Clínicas"
                        value={totalClinics.toString()}
                        icon={Building2}
                        description="Ativas na plataforma"
                    />
                    <ElegantStatsCard
                        title="Total de Pacientes"
                        value={totalPatients.toString()}
                        icon={Users}
                        description="Base global"
                    />
                    <ElegantStatsCard
                        title="Conversas (Total)"
                        value={totalConversations.toString()}
                        icon={MessageSquare}
                        description="Todas as clínicas"
                    />
                    <ElegantStatsCard
                        title="Agendamentos Hoje"
                        value={totalAppointments.toString()}
                        icon={Calendar}
                        description="Em toda a rede"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ElegantBarChart
                        title="Conversas por Clínica"
                        data={conversationsByClinic.length > 0 ? conversationsByClinic : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#d4af37"
                    />
                    <ElegantBarChart
                        title="Agendamentos (Últimos 7 dias)"
                        data={appointmentsByDay.length > 0 ? appointmentsByDay : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#10b981"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {/* Clinics List Table */}
                        <Card className="border-0 bg-card shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-xl font-medium text-foreground">Clínicas Ativas</CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/clinics">Ver Todas</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                            <tr>
                                                <th className="px-4 py-3">Clínica</th>
                                                <th className="px-4 py-3">Conversas</th>
                                                <th className="px-4 py-3">Pacientes</th>
                                                <th className="px-4 py-3">Hoje</th>
                                                <th className="px-4 py-3">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clinics.length > 0 ? clinics.slice(0, 5).map((clinic) => (
                                                <tr key={clinic.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                {clinic.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            {clinic.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{clinic.totalConversations}</td>
                                                    <td className="px-4 py-3">{clinic.totalPatients}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="border-green-500/30 text-green-500">
                                                            {clinic.todayAppointments} agend.
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Button variant="ghost" size="sm" asChild className="h-8">
                                                            <Link href={`/clinics/${clinic.id}`}>
                                                                Ver <ArrowRight className="ml-1 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                        {loading ? "Carregando..." : "Nenhuma clínica encontrada."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <ElegantDonutChart
                        title="Funil de Conversão"
                        data={conversionData.length > 0 ? conversionData : [{ name: 'Sem dados', value: 1 }]}
                    />
                </div>
            </div>
        )
    }

    // --- CLIENT VIEW (Original Dashboard with Charts) ---
    return (
        <div className="space-y-8 p-2 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo ao CRM Elegance. Dados atualizados em tempo real.</p>
            </div>

            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Receita Estimada"
                    value={stats.totalRevenue !== null ? `R$ ${stats.totalRevenue.toLocaleString()}` : '-'}
                    icon={DollarSign}
                    description="Total acumulado"
                />
                <ElegantStatsCard
                    title="Agendamentos"
                    value={stats.todayAppointments !== null ? stats.todayAppointments.toString() : '-'}
                    icon={Calendar}
                    description="Para hoje"
                />
                <ElegantStatsCard
                    title="Total de Pacientes"
                    value={stats.newPatients !== null ? stats.newPatients.toString() : '-'}
                    icon={Users}
                    description="Base de cadastros"
                />
                <ElegantStatsCard
                    title="Conversas (Mês)"
                    value={stats.monthlyConversations !== null ? stats.monthlyConversations.toString() : '-'}
                    icon={MessageSquare}
                    description="Atendimentos"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Funnel/Clients Chart */}
                    <ElegantBarChart
                        title="Distribuição do Funil"
                        data={funnelData.length > 0 ? funnelData : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#d4af37"
                    />

                    {/* Removed mock AI Performance and Channel charts - no real data source available */}

                    {/* Recent Appointments Table */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Próximos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentAppointments.length > 0 ? recentAppointments.map((apt) => (
                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/20 text-primary-foreground dark:text-primary p-3 rounded-lg flex flex-col items-center justify-center w-14 h-14">
                                                <span className="font-bold text-orange-900 dark:text-orange-100">{apt.time}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{apt.patient}</p>
                                                <p className="text-sm text-muted-foreground">{apt.type} • {apt.condition}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            {apt.status}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-4">Nenhum agendamento próximo.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="lg:col-span-1 space-y-8">
                    <ElegantDonutChart
                        title="Etapas do Funil"
                        data={funnelData.length > 0 ? funnelData : [{ name: 'Sem dados', value: 1 }]}
                    />

                    {/* Stats - only showing real data */}

                    {/* Recent Patients List */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Pacientes Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentPatients.length > 0 ? recentPatients.map((patient) => (
                                    <div key={patient.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-orange-900 dark:text-orange-100 text-xs font-bold">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{patient.name}</p>
                                            <p className="text-xs text-muted-foreground">{patient.condition}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{patient.date}</span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-4">Nenhum cliente recente.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
