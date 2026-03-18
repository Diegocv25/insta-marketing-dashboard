create extension if not exists pgcrypto;

create table if not exists public.marketing_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  logo_url text,
  delivery_timezone text default 'America/Sao_Paulo',
  delivery_hour time default '10:00',
  review_hour time default '12:00',
  auto_post boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_tasks (
  id bigserial primary key,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  title text not null,
  status text not null default 'pendente',
  details text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_creatives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  channel text not null default 'instagram',
  creative_type text not null,
  theme_mode text not null default 'product',
  pillar text,
  title text not null,
  hook text,
  caption text,
  cta text,
  approval_status text not null default 'pendente',
  asset_status text not null default 'rascunho',
  delivery_date date,
  due_at timestamptz,
  preview_path text,
  preview_url text,
  source_path text,
  notes text,
  feedback_latest text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_feedback (
  id bigserial primary key,
  creative_id uuid not null references public.marketing_creatives(id) on delete cascade,
  reviewer text not null default 'Diego',
  status text not null,
  feedback text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_projects_updated_at on public.marketing_projects;
create trigger trg_marketing_projects_updated_at
before update on public.marketing_projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_marketing_tasks_updated_at on public.marketing_tasks;
create trigger trg_marketing_tasks_updated_at
before update on public.marketing_tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_marketing_creatives_updated_at on public.marketing_creatives;
create trigger trg_marketing_creatives_updated_at
before update on public.marketing_creatives
for each row execute function public.set_updated_at();

insert into public.marketing_projects (
  slug,
  name,
  description,
  logo_url,
  delivery_timezone,
  delivery_hour,
  review_hour,
  auto_post
)
values (
  'nexus-instagram-marketing',
  'Nexus Instagram Marketing',
  'Operação de marketing do Instagram com curadoria, aprovação via dashboard, feedback e publicação.',
  '/nexus-logo.jpg',
  'America/Sao_Paulo',
  '10:00',
  '12:00',
  false
)
on conflict (slug) do update set
  description = excluded.description,
  logo_url = excluded.logo_url,
  delivery_timezone = excluded.delivery_timezone,
  delivery_hour = excluded.delivery_hour,
  review_hour = excluded.review_hour;

with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
)
insert into public.marketing_tasks (project_id, title, status, details, sort_order)
select p.id, t.title, t.status, t.details, t.sort_order
from project p
cross join (
  values
    ('Regra de marca vs produto definida', 'em_andamento', 'Produto usa identidade da landing. Marca Nexus usa paleta cyber neon validada pelo HTML enviado pelo Diego.', 10),
    ('Dashboard de aprovação visual', 'em_andamento', 'Criar painel simples para visualizar criativos, aprovar/reprovar e registrar feedback.', 20),
    ('Planejamento operacional e cron', 'pendente', 'Definir horário de entrega, horário de revisão e fluxo automático após aprovação.', 30),
    ('Importar histórico inicial do marketing', 'em_andamento', 'Aproveitar materiais já criados em marketing/ e nexus-marketing-squad/output/2026-03-17.', 40),
    ('Publicação automática no Instagram', 'pendente', 'Publicar direto após aprovação no dashboard, usando acesso oficial quando estiver estável.', 50),
    ('Agente de resposta para leads no direct', 'pendente', 'Etapa futura com RAG forte no nível da Emily e guardrails de atendimento.', 60)
) as t(title, status, details, sort_order)
where not exists (
  select 1 from public.marketing_tasks mt
  where mt.project_id = p.id and mt.title = t.title
);
