-- SQL para adicionar a coluna etapa_funil na tabela dados_cliente

ALTER TABLE public.dados_cliente 
ADD COLUMN IF NOT EXISTS etapa_funil text NULL;

-- Criar índice para melhor performance nas consultas do Kanban
CREATE INDEX IF NOT EXISTS idx_dados_cliente_etapa_funil 
ON public.dados_cliente USING btree (etapa_funil) 
TABLESPACE pg_default;

-- Opcional: Definir valores padrão para clientes existentes
UPDATE public.dados_cliente 
SET etapa_funil = 'new' 
WHERE etapa_funil IS NULL;
