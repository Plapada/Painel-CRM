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
}

export async function searchPatients(query: string) {
    const supabase = getClient()

    if (!query || query.length < 2) return []

    const { data, error } = await supabase
        .from('banco_de_dados_pacientes')
        .select('id, nome, telefone, cpf, convenio, email, prontuario, profissao, endereco_logradouro, endereco_numero')
        .ilike('nome', `%${query}%`)
        .limit(10)
        .order('nome')

    if (error) {
        console.error('Error searching patients:', error)
        return []
    }

    return data as Patient[]
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
