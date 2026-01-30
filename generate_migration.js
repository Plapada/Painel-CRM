const fs = require('fs');
const path = require('path');

const CLINIC_ID = 'f7e27ec7-b43c-42dc-9fac-3122440b692b';
const INPUT_FILE = 'Relatório estatisticaMedica 2026-01-06 16-48-45.csv';
const OUTPUT_FILE = 'migration_pacientes.sql';

function escapeSql(val) {
    if (!val) return 'NULL';
    // Check for potentially huge strings or weird chars
    const clean = val.replace(/'/g, "''").trim();
    return clean ? `'${clean}'` : 'NULL';
}

function parseDate(val) {
    // Expected format: DD/MM/YYYY
    if (!val || val.length < 10) return 'NULL';
    const parts = val.trim().split('/');
    if (parts.length !== 3) return 'NULL';
    // Return YYYY-MM-DD
    return `'${parts[2]}-${parts[1]}-${parts[0]}'`;
}

try {
    const data = fs.readFileSync(INPUT_FILE, 'latin1');
    const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);

    // Header check
    const header = lines[0].split(';').map(h => h.trim().toLowerCase());

    // Helper to get value by column name case-insensitively
    const getVal = (rowArr, colName) => {
        const idx = header.indexOf(colName.toLowerCase());
        if (idx === -1) return '';
        return rowArr[idx] || '';
    };

    // Write Schema File
    let schemaSql = `-- Migration Schema for banco_de_dados_pacientes\n`;
    schemaSql += `-- Clinic ID: ${CLINIC_ID}\n\n`;
    schemaSql += `CREATE TABLE IF NOT EXISTS public.banco_de_dados_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL,
    prontuario TEXT,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    sexo TEXT,
    cpf TEXT,
    rg TEXT,
    telefone TEXT,
    email TEXT,
    endereco_logradouro TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_uf TEXT,
    endereco_cep TEXT,
    convenio TEXT,
    profissao TEXT,
    estado_civil TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);\n\n`;
    schemaSql += `CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_nome ON public.banco_de_dados_pacientes(nome);\n`;
    schemaSql += `CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_cpf ON public.banco_de_dados_pacientes(cpf);\n`;
    schemaSql += `CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_clinica_id ON public.banco_de_dados_pacientes(clinica_id);\n\n`;

    fs.writeFileSync('migration_schema.sql', schemaSql);
    console.log(`Generated migration_schema.sql`);

    // Write Data Files
    const ROWS_PER_FILE = 2000;
    const BATCH_SIZE = 500;

    let fileIndex = 1;
    let currentFileContent = '';
    let rowCountInFile = 0;
    let batch = [];

    // Start from 1 to skip header
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(';');

        // Extract and Transform Fields
        const prontuario = escapeSql(getVal(row, 'prontuario'));
        const nome = escapeSql(getVal(row, 'nome'));
        const data_nascimento = parseDate(getVal(row, 'datanascimento'));
        const sexo = escapeSql(getVal(row, 'sexo'));
        const cpf = escapeSql(getVal(row, 'cpf'));
        const rg = escapeSql(getVal(row, 'identidade'));
        const telefone = escapeSql(getVal(row, 'telefone_1'));
        const email = escapeSql(getVal(row, 'email'));

        const end_logr = escapeSql(getVal(row, 'r_logradouro'));
        const end_num = escapeSql(getVal(row, 'r_numero'));
        const end_comp = escapeSql(getVal(row, 'r_complemento'));
        const end_bairro = escapeSql(getVal(row, 'r_bairro'));
        const end_cidade = escapeSql(getVal(row, 'r_cidade'));
        const end_uf = escapeSql(getVal(row, 'r_uf'));
        const end_cep = escapeSql(getVal(row, 'r_cep'));

        const convenio = escapeSql(getVal(row, 'convenio_1'));
        const profissao = escapeSql(getVal(row, 'profissao'));
        const est_civil = escapeSql(getVal(row, 'estadocivil'));
        const obs = escapeSql(getVal(row, 'observacoes'));

        const values = `('${CLINIC_ID}', ${prontuario}, ${nome}, ${data_nascimento}, ${sexo}, ${cpf}, ${rg}, ${telefone}, ${email}, ${end_logr}, ${end_num}, ${end_comp}, ${end_bairro}, ${end_cidade}, ${end_uf}, ${end_cep}, ${convenio}, ${profissao}, ${est_civil}, ${obs})`;

        batch.push(values);

        if (batch.length >= BATCH_SIZE) {
            currentFileContent += `INSERT INTO public.banco_de_dados_pacientes (clinica_id, prontuario, nome, data_nascimento, sexo, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, convenio, profissao, estado_civil, observacoes) VALUES\n${batch.join(',\n')};\n\n`;
            batch = [];
        }

        rowCountInFile++;

        if (rowCountInFile >= ROWS_PER_FILE) {
            // Flush remaining batch for this file if any (though batch size is factor of 2000 usually)
            if (batch.length > 0) {
                currentFileContent += `INSERT INTO public.banco_de_dados_pacientes (clinica_id, prontuario, nome, data_nascimento, sexo, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, convenio, profissao, estado_civil, observacoes) VALUES\n${batch.join(',\n')};\n\n`;
                batch = [];
            }
            fs.writeFileSync(`migration_data_${fileIndex}.sql`, currentFileContent);
            console.log(`Generated migration_data_${fileIndex}.sql with ${rowCountInFile} rows`);
            fileIndex++;
            currentFileContent = '';
            rowCountInFile = 0;
        }
    }

    // Flush remaining
    if (batch.length > 0) {
        currentFileContent += `INSERT INTO public.banco_de_dados_pacientes (clinica_id, prontuario, nome, data_nascimento, sexo, cpf, rg, telefone, email, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, convenio, profissao, estado_civil, observacoes) VALUES\n${batch.join(',\n')};\n`;
    }
    if (currentFileContent.length > 0) {
        fs.writeFileSync(`migration_data_${fileIndex}.sql`, currentFileContent);
        console.log(`Generated migration_data_${fileIndex}.sql with remaining rows`);
    }

} catch (e) {
    console.error("Error generating migration:", e);
}
