# Sócio Torcedor — Taquaralto Futsal

Sistema web de sócio-torcedor do **Taquaralto Futsal** (Palmas/TO), com landing pública, planos, autenticação, área do sócio e painel administrativo.

Pagamentos iniciais via **PIX manual** (BR Code + comprovante → admin confirma), com camada pronta para **Mercado Pago**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + **PostgreSQL**
- NextAuth (credentials)

## Desenvolvimento local

### 1. Postgres

```bash
docker compose up -d
```

### 2. Ambiente

Copie `.env.example` para `.env` e ajuste se necessário:

```env
DATABASE_URL="postgresql://socio:socio@localhost:5433/sociotorcedor?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="uma-chave-longa-aleatoria"
PAYMENT_PROVIDER="PIX_MANUAL"
```

### 3. Instalar, migrar e rodar

```bash
npm install
npm run db:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run db:setup` | Aplica migrations + seed |
| `npm run db:deploy` | Só migrations (produção) |
| `npm run db:seed` | Seed (não apaga se já houver planos) |
| `npm run build` | Build de produção |
| `npm run start:migrate` | Migrate + start |

## Deploy no Railway

1. Crie um projeto e adicione o plugin **PostgreSQL**.
2. Conecte o repositório (Docker via `railway.toml` / `Dockerfile`).
3. Monte um **Volume** em `/data` (uploads em `/data/uploads`).
4. Variáveis obrigatórias:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URL do Postgres Railway (referência do plugin) |
| `NEXTAUTH_URL` | `https://seu-dominio.up.railway.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `UPLOAD_DIR` | `/data/uploads` (já é o default no Dockerfile) |
| `PAYMENT_PROVIDER` | `PIX_MANUAL` |

5. Após o primeiro deploy, rode o seed **uma vez** (Railway shell / one-off):

```bash
ADMIN_PASSWORD='sua-senha-forte' npm run db:seed
```

Opcional: `ADMIN_EMAIL`, `DEMO_MEMBER_PASSWORD`, `FORCE_SEED=true` (recria tudo).

6. Mercado Pago (opcional): `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`. Webhook: `https://seu-dominio/api/webhooks/mercadopago`.

## Contas locais (seed padrão)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@taquaraltofutsal.com.br` | `admin123` (ou `ADMIN_PASSWORD`) |
| Sócio | `socio@demo.com` | `socio123` |

## Pagamentos

### PIX
1. Sistema gera **BR Code** (copia-e-cola / QR) com chave, valor e recebedor.
2. Sócio paga, envia comprovante e marca como pago.
3. Admin confirma em **Admin → Pagamentos**.

### Cartão (Mercado Pago Checkout Pro)
Requer token + `NEXTAUTH_URL` HTTPS público para `back_urls` e webhook.

## Rotas principais

- `/` — Landing
- `/planos` — Comparativo de planos
- `/cadastro` / `/login` — Autenticação
- `/area` — Dashboard do sócio
- `/admin` — Painel

## Contato do clube

- Instagram / YouTube: `taquaraltofutsal`
- E-mail: `taquaraltofutsal@gmail.com`
