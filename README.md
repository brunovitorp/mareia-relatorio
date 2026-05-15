# mareIA — Formulário de Relatório Mensal

Aplicação web para preenchimento e envio automático do Relatório Mensal de Acompanhamento de Atividades.

## Estrutura

```
mareia-relatorio/
├── api/
│   ├── submit.js          # Serverless function (gera .docx + envia email)
│   └── template_b64.txt   # Template .docx codificado em base64
├── public/
│   └── index.html         # Formulário
├── package.json
├── vercel.json
└── README.md
```

## Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta Google com **senha de app** configurada (ver abaixo)
- [Git](https://git-scm.com) instalado

### 1. Criar senha de app no Gmail

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas** (obrigatório)
3. Em "Como você faz login no Google", clique em **Senhas de app**
4. Crie uma nova senha para "Mail" / "Outro" → nomeie como "Vercel mareIA"
5. Copie a senha gerada (16 caracteres)

### 2. Subir para o GitHub

```bash
cd mareia-relatorio
git init
git add .
git commit -m "inicial"
# Crie um repositório no GitHub e conecte:
git remote add origin https://github.com/SEU_USUARIO/mareia-relatorio.git
git push -u origin main
```

### 3. Deploy no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório criado
3. Clique em **Deploy** (sem alterar nada)

### 4. Configurar variáveis de ambiente

No painel do projeto no Vercel → **Settings → Environment Variables**:

| Nome | Valor |
|------|-------|
| `GMAIL_USER` | gestao@nutes.ufpe.br |
| `GMAIL_APP_PASSWORD` | (senha de app gerada no passo 1) |

Após adicionar as variáveis: **Deployments → Redeploy** para aplicar.

### 5. Pronto

A URL gerada pelo Vercel (ex: `mareia-relatorio.vercel.app`) já está funcional.  
Cada submissão gera o `.docx` preenchido com a formatação original e envia para `gestao@nutes.ufpe.br`.

## Domínio personalizado (opcional)

No painel do projeto → **Settings → Domains** → adicione `relatorio.nutes.ufpe.br` (requer acesso ao DNS do domínio).
