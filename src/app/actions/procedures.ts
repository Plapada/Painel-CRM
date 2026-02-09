'use server'

import { createClient } from '@/lib/supabase'

export interface Procedure {
    id: string
    concessionaria_id: string
    nome: string
    valor: number
    ativo: boolean
    created_at: string
    updated_at: string
}

export async function getProcedures(clinicId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .eq('concessionaria_id', clinicId)
        .eq('ativo', true)
        .order('nome', { ascending: true })

    if (error) {
        console.error('Error fetching procedures:', error)
        return []
    }

    return data as Procedure[]
}

export async function createProcedure(procedure: Omit<Procedure, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('procedimentos')
        .insert([procedure])
        .select()
        .single()

    if (error) {
        console.error('Error creating procedure:', error)
        throw new Error('Failed to create procedure')
    }

    return data as Procedure
}

export async function updateProcedure(id: string, updates: Partial<Procedure>) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('procedimentos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating procedure:', error)
        throw new Error('Failed to update procedure')
    }

    return data as Procedure
}

export async function deleteProcedure(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('procedimentos')
        .update({ ativo: false, updated_at: new Date().toISOString() }) // Soft delete
        .eq('id', id)

    if (error) {
        console.error('Error deleting procedure:', error)
        throw new Error('Failed to delete procedure')
    }

    return true
}
