const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // Check dados_cliente
    const { data: wpData, error: wpError } = await supabase
        .from('dados_cliente')
        .select('*')
        .limit(1);

    if (wpError) {
        console.error('Error dados_cliente:', wpError);
    } else {
        if (wpData && wpData.length > 0) {
            console.log('--- dados_cliente Columns ---');
            Object.keys(wpData[0]).forEach(key => console.log(key));
        } else {
            console.log('dados_cliente is empty.');
        }
    }

    // Check banco_de_dados_pacientes
    const { data: dbData, error: dbError } = await supabase
        .from('banco_de_dados_pacientes')
        .select('*')
        .limit(1);

    if (dbError) {
        console.error('Error banco_de_dados_pacientes:', dbError);
    } else {
        if (dbData && dbData.length > 0) {
            console.log('--- banco_de_dados_pacientes Columns ---');
            Object.keys(dbData[0]).forEach(key => console.log(key));
        } else {
            console.log('banco_de_dados_pacientes is empty.');
        }
    }
}

inspect();
