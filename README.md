# Insta Marketing Dashboard

Dashboard da Nexus para operar a revisão dos criativos e acompanhar a agenda operacional do Instagram.

## O que este app faz
- lista criativos do projeto
- mostra preview final ou estrutural
- permite curadoria Jarvis
- permite aprovação / reprovação com feedback
- mostra calendário operacional fixo
- mostra status operacional do dia

## Stack
- Next.js
- Supabase (Funil)
- Vercel

## Domínio alvo
- `insta-marketing.ias-nexus-automacao.com.br`

## Fonte de verdade atual
### Banco
- `marketing_projects`
- `marketing_creatives`
- `marketing_feedback`
- `marketing_week_plan`

### Arquivos operacionais
- `/root/.openclaw/workspace/marketing/operation-config.json`
- `/root/.openclaw/workspace/marketing/daily-output/*.json`
- `/root/.openclaw/workspace/marketing/cron-final.txt`

### Legado / fallback
- `/root/.openclaw/workspace/marketing/calendar-weekly.json` (fallback temporário; não é mais a fonte principal)

### Publicação
- scripts em `/root/.openclaw/workspace/scripts/`
- Publora como caminho de postagem do Instagram

## Fluxo atual
1. os criativos são registrados em `marketing_creatives`
2. o dashboard mostra a peça e o contexto
3. Jarvis registra curadoria
4. Diego aprova ou reprova
5. scripts montam o manifesto diário
6. a publicação acontece por slot via Publora

## Variáveis de ambiente
- `SUPABASE_FUNIL_URL`
- `SUPABASE_FUNIL_SERVICE_ROLE_KEY`

## Legado
Arquivos SQL antigos e seeds de rodada neste repo são históricos e não representam o fluxo operacional final.
A operação oficial deve ser tratada como:
- banco + assets + scripts + cron + Publora
