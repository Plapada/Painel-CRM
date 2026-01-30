-- Migration Schema for banco_de_dados_pacientes
-- Clinic ID: f7e27ec7-b43c-42dc-9fac-3122440b692b

CREATE TABLE IF NOT EXISTS public.banco_de_dados_pacientes (
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
);

CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_nome ON public.banco_de_dados_pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_cpf ON public.banco_de_dados_pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_banco_de_dados_pacientes_clinica_id ON public.banco_de_dados_pacientes(clinica_id);

