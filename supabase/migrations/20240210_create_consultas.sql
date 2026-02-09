CREATE TABLE IF NOT EXISTS public.consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    -- Matches payload in page.tsx
    nome_cliente TEXT NOT NULL,
    telefone_cliente TEXT,
    celular_cliente TEXT,
    email_cliente TEXT,
    tipo_consulta TEXT,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    convenio TEXT,
    prontuario TEXT,
    realizou_procedimento BOOLEAN DEFAULT false,
    codigo_procedimento TEXT,
    procedimento_id UUID REFERENCES public.procedimentos(id),
    valor NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultas_clinic_id ON public.consultas(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_inicio ON public.consultas(data_inicio);
-- RLS Policy (Matches permissive pattern for now)
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public operations on consultas" ON public.consultas FOR ALL USING (true) WITH CHECK (true);