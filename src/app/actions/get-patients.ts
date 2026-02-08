'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getClient() {
    return createClient(supabaseUrl, supabaseAnonKey)
}

export interface Patient {
    id: string
    nome: string
    telefone: string | null
    cpf: string | null
    convenio: string | null
    clinica_id: string
    email: string | null
    prontuario: string | null
    profissao: string | null
    endereco_logradouro: string | null
    endereco_numero: string | null
    source?: 'database' | 'whatsapp'
}

export async function searchPatients(query: string, clinicId?: string) {
    const supabase = getClient()

    if (!query || query.length < 2) return []

    // 1. Search Database Patients
    let dbQuery = supabase
        .from('banco_de_dados_pacientes')
        .select('id, nome, telefone, cpf, convenio, email, prontuario, profissao, endereco_logradouro, endereco_numero, clinica_id')
        .ilike('nome', `%${query}%`)
        .limit(5)
        .order('nome')

    if (clinicId) {
        dbQuery = dbQuery.eq('clinica_id', clinicId)
    }

    const { data: dbData, error: dbError } = await dbQuery

    if (dbError) {
        console.error('Error searching db patients:', dbError)
    }

    // 2. Search WhatsApp Clients
    let wpQuery = supabase
        .from('dados_cliente')
        .select('id, nomewpp, telefone, clinic_id')
        .or(`nomewpp.ilike.%${query}%,telefone.ilike.%${query}%`)
        .limit(5)

    if (clinicId) {
        wpQuery = wpQuery.eq('clinic_id', clinicId)
    }

    const { data: wpData, error: wpError } = await wpQuery

    if (wpError) {
        console.error('Error searching wp clients:', wpError)
    }

    // 3. Map and Merge
    const formattedDbPatients: Patient[] = (dbData || []).map((p: any) => ({
        ...p,
        source: 'database'
    }))

    const formattedWpClients: Patient[] = (wpData || []).map((p: any) => ({
        id: p.id,
        nome: p.nomewpp || 'Sem Nome (WhatsApp)',
        telefone: p.telefone,
        clinica_id: p.clinic_id,
        source: 'whatsapp',
        cpf: null,
        convenio: null,
        email: null,
        prontuario: null,
        profissao: null,
        endereco_logradouro: null,
        endereco_numero: null
    }))

    // Merge and deduplicate (optional, simplistic merge here)
    return [...formattedDbPatients, ...formattedWpClients]
}

export async function getPatients(page = 1, limit = 10, search = '') {
    const supabase = getClient()

    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = supabase
        .from('banco_de_dados_pacientes')
        .select('id, nome, telefone, cpf, convenio, email', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

    if (search) {
        queryBuilder = queryBuilder.ilike('nome', `%${search}%`)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
        console.error('Error fetching patients:', error)
        return { data: [], count: 0 }
    }

    return { data: data as Patient[], count: count || 0 }
}

export interface WhatsAppPatient {
    id: number
    nomewpp: string | null
    telefone: string
    etapa_funil: string | null
    atendimento_ia: string | null
    resumo_conversa: string | null
    clinic_id: string
    created_at: string
}

export async function getWhatsAppPatients(page = 1, limit = 10, search = '', clinicId?: string) {
    const supabase = getClient()

    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = supabase
        .from('dados_cliente')
        .select('id, nomewpp, telefone, etapa_funil, atendimento_ia, resumo_conversa, clinic_id, created_at', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

    if (clinicId) {
        queryBuilder = queryBuilder.eq('clinic_id', clinicId)
    }

    if (search) {
        queryBuilder = queryBuilder.or(`nomewpp.ilike.%${search}%,telefone.ilike.%${search}%`)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
        console.error('Error fetching WhatsApp patients:', error)
        return { data: [], count: 0 }
    }

    return { data: data as WhatsAppPatient[], count: count || 0 }
}

export async function pauseWhatsAppPatient(patientId: number) {
    const supabase = getClient()

    const { error } = await supabase
        .from('dados_cliente')
        .update({ atendimento_ia: 'pausado' })
        .eq('id', patientId)

    if (error) {
        console.error('Error pausing patient:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function resumeWhatsAppPatient(patientId: number) {
    const supabase = getClient()

    const { error } = await supabase
        .from('dados_cliente')
        .update({ atendimento_ia: 'ativo' })
        .eq('id', patientId)

    if (error) {
        console.error('Error resuming patient:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
