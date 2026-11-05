# 🚀 Deploy: Connect Barber → Supabase + Railway + Vercel

## Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Railway](https://railway.app) (gratuita — 500h/mês)
- Conta na [Vercel](https://vercel.com) (gratuita)
- Repositório no GitHub com o código

---

## Passo 1 — Supabase: Criar o projeto e banco

1. Acesse https://supabase.com → **New Project**
2. Escolha organização, nome (`connect-barber`), senha do banco e região (South America - São Paulo)
3. Aguarde o projeto criar (~2 min)
4. Vá em **Settings → Database** e copie:
   - **Connection string → URI** (porta `5432`) → esta é a `DIRECT_URL`
   - **Connection string → URI com Pooler** (porta `6543`, Transaction mode) → esta é a `DATABASE_URL`
5. Vá em **Settings → API** e copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret key) → `SUPABASE_SERVICE_ROLE_KEY`

### 1.1 — Criar bucket de Storage

No SQL Editor do Supabase, execute o conteúdo de `supabase-storage-setup.sql` (arquivo na raiz do projeto).

Ou manualmente:
- **Storage → Create bucket** → nome: `media`, **Public bucket**: ✅

---

## Passo 2 — Rodar as migrations no Supabase

No seu terminal local, com as variáveis configuradas:

```bash
# 1. Configure temporariamente as variáveis locais
cd apps/backend
cp .env.example .env

# 2. Edite .env e preencha DATABASE_URL e DIRECT_URL com os valores do Supabase
# DATABASE_URL = URL com pooler (porta 6543)
# DIRECT_URL   = URL direta (porta 5432)

# 3. Rode as migrations (usa DIRECT_URL automaticamente)
npx prisma migrate deploy

# 4. Crie o superadmin (seed)
npx ts-node prisma/seed.ts
```

> ⚠️ Se quiser a barbearia de demonstração, defina `SEED_DEMO=true` antes de rodar o seed.

---

## Passo 3 — Subir o código no GitHub

```bash
# Na raiz do projeto
git remote add origin https://github.com/SEU_USUARIO/connect-barber.git
git branch -M main
git push -u origin main
```

---

## Passo 4 — Deploy do Backend no Railway

1. Acesse https://railway.app → **New Project → Deploy from GitHub repo**
2. Selecione o repositório `connect-barber`
3. Railway detectará o projeto automaticamente
4. Vá em **Settings → Service** e configure:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/main`
5. Em **Variables**, adicione todas as variáveis do `.env.example`:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=<string aleatória longa>
JWT_EXPIRES_IN=12h
FRONTEND_URL=https://seu-app.vercel.app
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=<senha forte>
SEED_DEMO=false
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_STORAGE_BUCKET=media
```

6. Clique em **Deploy** e aguarde
7. Copie a URL gerada (ex: `https://connect-barber-api.up.railway.app`)
8. Teste: acesse `https://SUA-URL-RAILWAY.app/api/health`

---

## Passo 5 — Deploy do Frontend na Vercel

1. Acesse https://vercel.com → **Add New → Project**
2. Importe o repositório `connect-barber` do GitHub
3. Configure:
   - **Root Directory**: `apps/frontend`
   - **Framework Preset**: Vite (detectado automático)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Em **Environment Variables**, adicione:
   ```
   VITE_API_URL=https://SUA-URL-RAILWAY.app/api
   ```
5. Clique em **Deploy**

---

## Passo 6 — Ajuste final de CORS

Após obter a URL da Vercel (ex: `https://connect-barber.vercel.app`):

1. No Railway, atualize a variável:
   ```
   FRONTEND_URL=https://connect-barber.vercel.app
   ```
2. O Railway fará redeploy automaticamente

---

## ✅ Verificações

| Teste | URL |
|-------|-----|
| API Health | `https://SUA-API.railway.app/api/health` |
| Swagger Docs | `https://SUA-API.railway.app/api/docs` |
| Frontend | `https://seu-app.vercel.app` |
| Login admin | `https://seu-app.vercel.app/app` |
| Site demo | `https://seu-app.vercel.app/b/barbearia-demo` |

---

## 🔑 Credenciais padrão do seed

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Super Admin | `admin@connectbarber.app` | `admin123` |
| Dono (demo) | `dono@barbeariademo.com` | `123456` |
| Profissional | `barbeiro@barbeariademo.com` | `123456` |
| Cliente | `cliente@example.com` | `123456` |

> ⚠️ **Troque as senhas em produção!**
