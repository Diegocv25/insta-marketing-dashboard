# Insta Marketing Dashboard

Dashboard simples da Nexus para operar o marketing do Instagram com fluxo claro de:

- entrega dos criativos
- aprovação / reprovação
- feedback textual
- acompanhamento das pendências do Jarvis
- planejamento do que já foi feito e do que ainda falta

## Stack
- Next.js
- Supabase (Funil + Jarvis)
- Vercel

## Domínio alvo
- `insta-marketing.ias-nexus-automacao.com.br`

## Banco usado
- Supabase do funil (`cfmlztcnrnopupdiqbwu`)
- Tabelas criadas para o dashboard:
  - `marketing_deliveries`
  - `marketing_assets`
  - `marketing_planning`

## Objetivo operacional
1. agentes geram materiais
2. Jarvis faz curadoria interna
3. dashboard mostra entrega visual + contexto
4. Diego aprova ou reprova com feedback
5. se aprovado, segue para postagem
6. se reprovado, feedback volta para a próxima rodada

## Variáveis de ambiente
- `SUPABASE_FUNIL_URL`
- `SUPABASE_FUNIL_SERVICE_ROLE_KEY`
- `SUPABASE_JARVIS_URL`
- `SUPABASE_JARVIS_SERVICE_ROLE_KEY`

## SQL inicial
Script:
- `scripts/init_marketing_dashboard.sql`

## Status atual
- base inicial criada
- tabelas criadas no Supabase
- primeira pendência registrada
- integração com pendências do Jarvis ativa
