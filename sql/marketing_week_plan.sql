-- Persistent weekly plan (single active plan per project)
create table if not exists public.marketing_week_plan (
  id bigserial primary key,
  project_slug text not null,
  day_of_week text not null,
  feed_format text,
  feed_time text,
  feed_topic text,
  feed_hashtags jsonb not null default '[]'::jsonb,
  story_1_time text,
  story_1_topic text,
  story_1_hashtags jsonb not null default '[]'::jsonb,
  story_2_time text,
  story_2_topic text,
  story_2_hashtags jsonb not null default '[]'::jsonb,
  story_3_time text,
  story_3_topic text,
  story_3_hashtags jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (project_slug, day_of_week)
);

alter table public.marketing_week_plan add column if not exists feed_hashtags jsonb not null default '[]'::jsonb;
alter table public.marketing_week_plan add column if not exists story_1_hashtags jsonb not null default '[]'::jsonb;
alter table public.marketing_week_plan add column if not exists story_2_hashtags jsonb not null default '[]'::jsonb;
alter table public.marketing_week_plan add column if not exists story_3_hashtags jsonb not null default '[]'::jsonb;

create or replace function public.set_marketing_week_plan_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_marketing_week_plan_updated_at on public.marketing_week_plan;
create trigger trg_marketing_week_plan_updated_at
before update on public.marketing_week_plan
for each row execute function public.set_marketing_week_plan_updated_at();

-- Seed base week (safe upsert)
insert into public.marketing_week_plan
(project_slug, day_of_week, feed_format, feed_time, feed_topic, feed_hashtags, story_1_time, story_1_topic, story_1_hashtags, story_2_time, story_2_topic, story_2_hashtags, story_3_time, story_3_topic, story_3_hashtags)
values
('nexus-instagram-marketing','monday','carousel','12:00',null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','tuesday','reels','12:00',null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','wednesday','post','12:00',null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','thursday','reels','12:00',null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','friday','carousel','12:00',null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','saturday',null,null,null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb),
('nexus-instagram-marketing','sunday',null,null,null,'[]'::jsonb,'07:30',null,'[]'::jsonb,'12:00',null,'[]'::jsonb,'18:00',null,'[]'::jsonb)
on conflict (project_slug, day_of_week) do update set
  feed_format = excluded.feed_format,
  feed_time = excluded.feed_time,
  feed_hashtags = excluded.feed_hashtags,
  story_1_time = excluded.story_1_time,
  story_1_hashtags = excluded.story_1_hashtags,
  story_2_time = excluded.story_2_time,
  story_2_hashtags = excluded.story_2_hashtags,
  story_3_time = excluded.story_3_time,
  story_3_hashtags = excluded.story_3_hashtags;
