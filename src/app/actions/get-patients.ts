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
    atendimento_ia?: string
    etapa_funil?: string
    resumo_conversa?: string
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

export async function getPatients(page = 1, limit = 10, search = '', clinicId?: string) {
    const supabase = getClient()

    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = supabase
        .from('dados_cliente')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

    if (clinicId) {
        queryBuilder = queryBuilder.eq('clinic_id', clinicId)
    }

    if (search) {
        queryBuilder = queryBuilder.or(`nomewpp.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
        console.error('Error fetching patients:', error)
        return { data: [], count: 0 }
    }

    // Map dados_cliente to Patient interface
    const patients: Patient[] = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nomewpp || 'Sem Nome',
        telefone: p.telefone,
        clinica_id: p.clinic_id,
        source: 'whatsapp', // We can treat all as 'whatsapp' source or just 'database' now
        cpf: p.cpf,
        convenio: p.convenio,
        email: p.email,
        prontuario: p.prontuario,
        profissao: p.profissao,
        endereco_logradouro: p.endereco_logradouro,
        endereco_numero: p.endereco_numero,
        atendimento_ia: p.atendimento_ia,
        etapa_funil: p.etapa_funil,
        resumo_conversa: p.resumo_conversa
    }))

    return { data: patients, count: count || 0 }
}

export interface WhatsAppPatient {
    id: number
    nomewpp: string
    telefone: string
    etapa_funil?: string
    atendimento_ia?: string
    resumo_conversa?: string
    clinic_id: string
    created_at?: string
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
        .update({ atendimento_ia: 'pause' })
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
        .update({ atendimento_ia: 'reativada' })
        .eq('id', patientId)

    if (error) {
        console.error('Error resuming patient:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function updatePatient(patientId: number, data: Partial<Patient>) {
    const supabase = getClient()

    // Map fields back to database columns if necessary
    // Assuming Patient interface matches dados_cliente where relevant or using direct mapping
    const updateData: any = {
        nomewpp: data.nome,
        telefone: data.telefone,
        cpf: data.cpf,
        convenio: data.convenio,
        email: data.email,
        prontuario: data.prontuario,
        profissao: data.profissao,
        endereco_logradouro: data.endereco_logradouro,
        endereco_numero: data.endereco_numero
    }

    // Remove undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

    const { error } = await supabase
        .from('dados_cliente')
        .update(updateData)
        .eq('id', patientId)

    if (error) {
        console.error('Error updating patient:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
