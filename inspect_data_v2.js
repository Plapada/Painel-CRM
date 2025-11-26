const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectData() {
    console.log('--- Inspecting Data ---')

    // Check dados_cliente
    const { data: clients, error: clientsError } = await supabase
        .from('dados_cliente')
        .select('id, nomewpp, telefone, clinic_id')
        .limit(5)

    if (clientsError) console.error('Error fetching clients:', clientsError)
    else console.log('Clients (first 5):', clients)

    // Check consultas
    const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('id, nome_cliente, data_inicio, clinic_id')
        .limit(5)

    if (appointmentsError) console.error('Error fetching appointments:', appointmentsError)
    else console.log('Appointments (first 5):', appointments)

    // Check chat history
    const { data: chats, error: chatsError } = await supabase
        .from('n8n_chat_histories')
        .select('id, session_id, clinic_id')
        .limit(5)

    if (chatsError) console.error('Error fetching chats:', chatsError)
    else console.log('Chats (first 5):', chats)
}

inspectData()
