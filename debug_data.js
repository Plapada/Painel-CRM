const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Checking dados_cliente (Funnel & Names) ---");
    const { data: clients, error: clientError } = await supabase
        .from('dados_cliente')
        .select('id, nome, telefone, etapa_funil, clinic_id')
        .limit(5);

    if (clientError) console.error(clientError);
    else console.log(clients);

    console.log("\n--- Checking n8n_chat_histories (Chat Data) ---");
    const { data: chats, error: chatError } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .limit(5);

    if (chatError) console.error(chatError);
    else console.log(chats);

    console.log("\n--- Checking consultas (Appointments) ---");
    const { data: appts, error: apptError } = await supabase
        .from('consultas')
        .select('*')
        .limit(5);

    if (apptError) console.error(apptError);
    else console.log(appts);
}

inspect();
