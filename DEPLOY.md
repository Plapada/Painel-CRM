# Guia de Deploy - CRM Elegance

A maneira mais fácil e recomendada de fazer o deploy de uma aplicação Next.js é usando a **Vercel** (criadores do Next.js).

## Pré-requisitos

1.  Uma conta no [GitHub](https://github.com/), [GitLab](https://gitlab.com/) ou [Bitbucket](https://bitbucket.org/).
2.  Uma conta na [Vercel](https://vercel.com/signup).
3.  O projeto deve estar em um repositório Git remoto.

## Passo a Passo

### 1. Enviar o código para o GitHub (se ainda não fez)

Se você ainda não tem o código no GitHub:

1.  Crie um **novo repositório** no GitHub (pode ser privado).
2.  No terminal do seu projeto, execute:

```bash
# Se ainda não iniciou o git
git init

# Adicione os arquivos
git add .
git commit -m "Deploy inicial"

# Conecte ao repositório remoto (substitua URL_DO_SEU_REPO)
git branch -M main
git remote add origin URL_DO_SEU_REPO
git push -u origin main
```

### 2. Conectar na Vercel

1.  Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Selecione o seu provedor Git (ex: GitHub) e encontre o repositório `crm-elegance`.
4.  Clique em **"Import"**.

### 3. Configurar Variáveis de Ambiente

Na tela de configuração do projeto na Vercel ("Configure Project"):

1.  Abra a seção **"Environment Variables"**.
2.  Adicione as variáveis do seu arquivo `.env.local`:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (Sua URL do Supabase)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Sua chave anônima do Supabase)

> **Nota:** Não adicione chaves de serviço (service_role) aqui, apenas as públicas/anônimas necessárias para o frontend.

### 4. Deploy

1.  Clique em **"Deploy"**.
2.  Aguarde a construção (build) finalizar.
3.  Se tudo der certo, você receberá uma URL (ex: `crm-elegance.vercel.app`) onde seu site estará no ar!

## Atualizações Futuras

Sempre que você fizer um `git push` para a branch `main` no seu repositório, a Vercel detectará a mudança e fará um novo deploy automaticamente.
