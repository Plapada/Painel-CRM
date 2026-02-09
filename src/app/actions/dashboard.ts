'use server'

import { createClient } from '@/lib/supabase'

export interface DashboardMetrics {
    revenue: {
        current: number
        estimated: number
        lastMonth: number
    }
    appointments: {
        total: number
        month: number
        day: number
        week: number
    }
    patients: {
        attended: number
        new: number
    }
    procedures: {
        total: number
    }
}

export async function getDashboardMetrics(clinicId: string): Promise<DashboardMetrics> {
    // Assuming createClient() works as in procedures.ts
    // If it requires arguments here, we might need to adjust, 
    // but usually server actions use a specific server-side client creator.
    // If imports fail, we will debug.
    const supabase = createClient()

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    // Calculate week start (Sunday)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartIso = weekStart.toISOString()


    // Fetch all relevant appointments for the month to minimize queries?
    // Or just fetch summary stats.

    // 1. Fetch appointments for current month to calculate Revenue, Month Count, Patients Attended
    const { data: monthData, error: monthError } = await supabase
        .from('consultas')
        .select('valor, status, data_inicio, nome_cliente, procedimento_id')
        .eq('clinic_id', clinicId)
        .gte('data_inicio', firstDayOfMonth)
        .lte('data_inicio', lastDayOfMonth)

    if (monthError) {
        console.error('Error fetching dashboard metrics:', monthError)
        return {
            revenue: { current: 0, estimated: 0, lastMonth: 0 },
            appointments: { total: 0, month: 0, day: 0, week: 0 },
            patients: { attended: 0, new: 0 },
            procedures: { total: 0 }
        }
    }

    let revenueCurrent = 0
    let revenueEstimated = 0
    let appointmentsMonth = 0
    let appointmentsDay = 0
    let appointmentsWeek = 0
    let proceduresCount = 0

    // Patients attended (unique patients with realized appointments in month)
    const patientsAttendedSet = new Set<string>()

    if (monthData) {
        monthData.forEach((app: any) => {
            appointmentsMonth++

            // Check Day
            if (app.data_inicio >= todayStart) appointmentsDay++

            // Check Week
            if (app.data_inicio >= weekStartIso) appointmentsWeek++

            const val = Number(app.valor) || 0
            // Status Check
            // Realized: 'finalizado', 'compareceu', 'em_atendimento'
            // Estimated: 'pendente', 'confirmado', 'agendado'

            if (['finalizado', 'compareceu', 'em_atendimento'].includes(app.status)) {
                revenueCurrent += val
                if (app.nome_cliente) patientsAttendedSet.add(app.nome_cliente)
                if (app.procedimento_id) proceduresCount++ // Count procedures only if realized? Or all? User said "Procedures Performed". So realized.
            } else if (['pendente', 'confirmado', 'confirmada', 'agendado'].includes(app.status)) {
                revenueEstimated += val
            }
        })
    }

    // Separate query for ALL time procedures? Or just month?
    // Users usually want month stats on dashboard. I'll stick to month for now.

    return {
        revenue: {
            current: revenueCurrent,
            estimated: revenueEstimated,
            lastMonth: 0 // Implement if needed
        },
        appointments: {
            total: appointmentsMonth, // Month count
            month: appointmentsMonth,
            day: appointmentsDay,
            week: appointmentsWeek
        },
        patients: {
            attended: patientsAttendedSet.size,
            new: 0
        },
        procedures: {
            total: proceduresCount
        }
    }
}
