const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // This is a hacky way to list tables if we don't have direct access to system tables.
    // We can try to fetch from common table names.
    const tables = ['funil', 'deals', 'oportunidades', 'leads', 'kanban'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Found table: ${table}`);
        }
    }
    console.log('Finished checking common table names.');
}

listTables();
