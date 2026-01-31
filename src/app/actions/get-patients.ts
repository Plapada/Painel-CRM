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
