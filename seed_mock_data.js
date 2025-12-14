const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfblhljtfqnopwlffffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYmxobGp0ZnFub3B3bGZmZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjgxNDgsImV4cCI6MjA3MzA0NDE0OH0.m76j7L_49X_8tV0myINjEQIzizOUAa7SLCO1li3MKdg';

const supabase = createClient(supabaseUrl, supabaseKey);

const CLINIC_ID = '457e67c0-55ca-456d-8762-cc94df166e6d';

const MOCK_LEADS = [
    {
        nomewpp: "Carla Siqueira",
        telefone: "5511999990001",
        stage: "new",
        email: "carla.siq@gmail.com",
        ai_status: "Interessado",
        chat: [
            { role: "user", content: "Olá, gostaria de saber o valor do preenchimento labial." },
            { role: "assistant", content: "Olá Carla! O valor varia de acordo com a quantidade de ml necessária. Para te passar um orçamento preciso, o ideal seria agendar uma avaliação gratuita. Você tem disponibilidade esta semana?" },
            { role: "user", content: "Tenho sim, na quinta à tarde." }
        ]
    },
    {
        nomewpp: "Roberto Mendes",
        telefone: "5511999990002",
        stage: "contacted",
        email: "beto.mendes@hotmail.com",
        ai_status: "Em Atendimento",
        chat: [
            { role: "user", content: "Bom dia, vocês fazem harmonização facial?" },
            { role: "assistant", content: "Bom dia Roberto! Sim, somos especialistas em harmonização. Gostaria de ver alguns resultados?" },
            { role: "user", content: "Sim, por favor." } // In 'contacted'
        ]
    },
    {
        nomewpp: "Ana Paula Cruz",
        telefone: "5511999990003",
        stage: "scheduled",
        email: "anapaula.cruz@uol.com.br",
        ai_status: "Agendado",
        chat: [
            { role: "user", content: "Oi, quero marcar um botox." },
            { role: "assistant", content: "Olá Ana! Temos horários para sexta-feira. 14h ou 16h?" },
            { role: "user", content: "Pode ser as 16h." },
            { role: "assistant", content: "Perfeito! Agendado para sexta às 16h." }
        ]
    },
    {
        nomewpp: "Lucas Ferreira",
        telefone: "5511999990004",
        stage: "new",
        email: "lucas.ferreira@gmail.com",
        ai_status: "Curioso",
        chat: [
            { role: "user", content: "Qual o endereço de vocês?" }
        ]
    },
    {
        nomewpp: "Mariana Oliveira",
        telefone: "5511999990005",
        stage: "done",
        email: "mari.oli@gmail.com",
        ai_status: "Cliente",
        chat: [
            { role: "user", content: "Adorei o resultado, obrigada!" },
            { role: "assistant", content: "Fico muito feliz que tenha gostado, Mariana! Até a próxima." }
        ]
    }
];

async function seedData() {
    console.log('--- Seeding Mock Data ---');

    for (const lead of MOCK_LEADS) {
        console.log(`Processing lead: ${lead.nomewpp}`);

        // 1. Insert/Update Lead in dados_cliente
        // KanbanBoard.tsx maps 'atendimento_ia' to columns if 'etapa_funil' is missing.
        // Mappings:
        // contacted: "Em Contato" (contains "contato")
        // scheduled: "Agendado" (contains "agendado")
        // done: "Concluído" (contains "concluído")
        // new: anything else

        let statusText = "Novo Lead";
        if (lead.stage === 'contacted') statusText = "Em Contato";
        if (lead.stage === 'scheduled') statusText = "Agendado";
        if (lead.stage === 'done') statusText = "Concluído";

        const { data: insertedLead, error: leadError } = await supabase
            .from('dados_cliente')
            .upsert({
                nomewpp: lead.nomewpp,
                telefone: lead.telefone,
                email: lead.email,
                // etapa_funil: lead.stage, // Column doesn't exist yet
                atendimento_ia: statusText,
                clinic_id: CLINIC_ID,
            }, { onConflict: 'telefone' })
            .select()
            .single();

        if (leadError) {
            console.error(`Error inserting lead ${lead.nomewpp}:`, leadError.message);
            continue;
        }
        console.log(`Lead upserted: ID ${insertedLead.id}`);

        // 2. Insert Chat History
        // First clean up old history for this dummy number to avoid duplicates piling up
        await supabase.from('n8n_chat_histories').delete().eq('session_id', lead.telefone);

        const chatInserts = lead.chat.map(msg => ({
            session_id: lead.telefone,
            clinic_id: CLINIC_ID,
            role: msg.role,
            content: msg.content,
            patient_name: lead.nomewpp
        }));

        const { error: chatError } = await supabase
            .from('n8n_chat_histories')
            .insert(chatInserts);

        if (chatError) {
            console.error(`Error inserting chats for ${lead.nomewpp}:`, chatError.message);
        } else {
            console.log(`inserted ${chatInserts.length} chat messages.`);
        }
    }
    console.log('--- Seeding Complete ---');
}

seedData();
