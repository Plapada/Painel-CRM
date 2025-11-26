const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('dados_cliente')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Data:', data);
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty or data is null.');
        }
    }
}

inspect();
