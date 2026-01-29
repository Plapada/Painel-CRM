"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { StatsCard as ElegantStatsCard } from "@/components/dashboard/StatsCard"
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
    CreditCard,
    Clock,
    CheckCircle2,
    User
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
                'CITOLOGIA': 150,
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
                'CONSULTA': 530,
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

    // Status color helper
    const getStatusStyle = (status: string) => {
        const normalized = status?.toLowerCase()
        if (normalized === 'confirmada' || normalized === 'confirmado') {
            return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
        }
        if (normalized === 'pendente') {
            return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
        }
        if (normalized === 'cancelada' || normalized === 'cancelado') {
            return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
        }
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
    }

    // --- ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="space-y-8 p-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-playfair">
                            Painel Administrativo
                        </h1>
                        <Badge className="bg-amber-500 text-white border-0 shadow-lg">ADMIN</Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                        Visão global de todas as clínicas gerenciadas.
                    </p>
                </div>

                {/* Admin Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        title="Agendamentos Hoje"
                        value={totalAppointments.toString()}
                        icon={Calendar}
                        description="Em toda a rede"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700">
                                <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Clínicas Ativas</CardTitle>
                                <Button variant="outline" size="sm" asChild className="border-slate-300 dark:border-slate-600">
                                    <Link href="/clinics">Ver Todas</Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Clínica</th>
                                                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Pacientes</th>
                                                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Hoje</th>
                                                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {clinics.length > 0 ? clinics.slice(0, 5).map((clinic) => (
                                                <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                                                {clinic.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-slate-800 dark:text-white">{clinic.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{clinic.totalPatients}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                                                            {clinic.todayAppointments} agend.
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="ghost" size="sm" asChild className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                                            <Link href={`/clinics/${clinic.id}`}>
                                                                Ver <ArrowRight className="ml-1 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
        <div className="space-y-8 p-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-black">
                    Visão Geral
                </h1>
                <p className="text-gray-700 dark:text-slate-400 font-medium">
                    Bem-vindo ao CRM Elegance. Dados atualizados em tempo real.
                </p>
            </div>

            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Receita Estimada"
                    value={stats.totalRevenue !== null ? `R$ ${stats.totalRevenue.toLocaleString()}` : '-'}
                    icon={DollarSign}
                    description="Total acumulado"
                    variant="highlight"
                />
                <ElegantStatsCard
                    title="Agendamentos"
                    value={stats.todayAppointments !== null ? stats.todayAppointments.toString() : '-'}
                    icon={Calendar}
                    description="Para hoje"
                    variant="dark"
                />
                <ElegantStatsCard
                    title="Total de Pacientes"
                    value={stats.newPatients !== null ? stats.newPatients.toString() : '-'}
                    icon={Users}
                    description="Base de cadastros"
                    variant="dark"
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
                        color="#FFD700"
                        className="bg-zinc-900 border-zinc-900 text-white shadow-lg"
                    />

                    {/* Recent Appointments Table */}
                    <Card className="border border-zinc-800 bg-zinc-900 shadow-lg text-white">
                        <CardHeader className="border-b border-zinc-800">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-amber-400" />
                                Próximos Agendamentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                {recentAppointments.length > 0 ? recentAppointments.map((apt) => (
                                    <div key={apt.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/80 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-amber-500 text-white p-3 rounded-xl flex flex-col items-center justify-center min-w-[60px] shadow-lg shadow-amber-500/30">
                                                <Clock className="h-4 w-4 mb-1" />
                                                <span className="font-bold text-sm">{apt.time}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{apt.patient}</p>
                                                <p className="text-sm text-zinc-400">{apt.type} • {apt.condition}</p>
                                            </div>
                                        </div>
                                        <Badge className={`font-medium border ${getStatusStyle(apt.status)}`}>
                                            {apt.status}
                                        </Badge>
                                    </div>
                                )) : (
                                    <div className="px-6 py-8 text-center">
                                        <Calendar className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
                                        <p className="text-zinc-500">Nenhum agendamento próximo.</p>
                                    </div>
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
                        className="bg-zinc-900 border-zinc-900 text-white shadow-lg"
                        colors={['#FFD700', '#FFFFFF', '#A1A1AA', '#52525B', '#27272A', '#E4E4E7']}
                    />

                    {/* Recent Patients List */}
                    <Card className="border border-zinc-800 bg-zinc-900 shadow-lg">
                        <CardHeader className="border-b border-zinc-800">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-amber-400" />
                                Pacientes Recentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                {recentPatients.length > 0 ? recentPatients.map((patient) => (
                                    <div key={patient.id} className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-800 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {patient.name}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {patient.condition}
                                            </p>
                                        </div>
                                        <span className="text-xs text-zinc-500 font-medium">
                                            {patient.date}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="px-6 py-8 text-center">
                                        <User className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
                                        <p className="text-zinc-500">Nenhum cliente recente.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
