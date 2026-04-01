-- LEGACY: este script representa a arquitetura antiga do dashboard
-- (marketing_deliveries / marketing_assets / marketing_planning).
-- Não use como base do fluxo operacional atual.
-- Arquitetura atual: marketing_projects / marketing_creatives / marketing_feedback.

begin;

create table if not exists public.marketing_deliveries (
  id bigserial primary key,
  tema text not null,
  tipo text not null default 'product', -- product | brand
  canal text not null default 'instagram',
  status text not null default 'draft', -- draft | review | approved | rejected | posted
  resumo text,
  cron_entrega timestamptz,
  prazo_aprovacao timestamptz,
  aprovado_em timestamptz,
  rejeitado_em timestamptz,
  postado_em timestamptz,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_assets (
  id bigserial primary key,
  delivery_id bigint not null references public.marketing_deliveries(id) on delete cascade,
  etapa text not null, -- research | strategy | copy | design | review
  titulo text not null,
  conteudo text,
  preview_url text,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_planning (
  id bigserial primary key,
  titulo text not null,
  status text not null default 'active',
  o_que_ja_tem text,
  o_que_falta text,
  proximo_passo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_deliveries_status on public.marketing_deliveries(status);
create index if not exists idx_marketing_assets_delivery on public.marketing_assets(delivery_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_marketing_deliveries_updated_at on public.marketing_deliveries;
create trigger trg_marketing_deliveries_updated_at
before update on public.marketing_deliveries
for each row execute function public.set_updated_at();

drop trigger if exists trg_marketing_assets_updated_at on public.marketing_assets;
create trigger trg_marketing_assets_updated_at
before update on public.marketing_assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_marketing_planning_updated_at on public.marketing_planning;
create trigger trg_marketing_planning_updated_at
before update on public.marketing_planning
for each row execute function public.set_updated_at();

insert into public.marketing_planning (titulo, o_que_ja_tem, o_que_falta, proximo_passo)
select
  'Instagram Marketing Nexus',
  'Já existe squad de marketing, drafts em nexus-marketing-squad/output/2026-03-17, regra de separação entre produto e marca, landing ativa, CRM/funil ativo, e definição visual institucional neon/cyber para a marca.',
  'Falta fechar dashboard operacional de aprovação, revisar a paleta final dentro do fluxo, validar cron de entrega/aprovação, apresentar criativos visualmente, e ligar aprovação -> postagem.',
  'Subir dashboard insta-marketing, registrar entregas e feedbacks, aprovar primeira rodada e então automatizar postagem.'
where not exists (select 1 from public.marketing_planning where titulo = 'Instagram Marketing Nexus');

insert into public.marketing_deliveries (tema, tipo, canal, status, resumo, cron_entrega, prazo_aprovacao)
select
  'Estruturar operação do marketing Instagram com aprovação via dashboard',
  'brand',
  'instagram',
  'review',
  'Base inicial do projeto: organizar visualização dos criativos, aprovação/reprovação com feedback e fluxo até postagem.',
  now(),
  now() + interval '6 hours'
where not exists (select 1 from public.marketing_deliveries where tema = 'Estruturar operação do marketing Instagram com aprovação via dashboard');

commit;
