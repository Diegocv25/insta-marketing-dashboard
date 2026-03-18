with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
)
insert into public.marketing_creatives (
  project_id,
  channel,
  creative_type,
  theme_mode,
  pillar,
  title,
  hook,
  cta,
  approval_status,
  asset_status,
  delivery_date,
  source_path,
  notes
)
select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.cta, x.approval_status, x.asset_status, x.delivery_date, x.source_path, x.notes
from project p
cross join (
  values
    ('instagram', 'carousel', 'product', 'dor real', 'Carrossel 01 — O caos do WhatsApp custa caro', 'O caos do WhatsApp custa caro no seu salão.', 'Quero testar', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/carousel_01.md', 'Draft herdado do pacote inicial 2026-03-17.'),
    ('instagram', 'carousel', 'product', 'mecanismo', 'Carrossel 02 — draft herdado', null, 'Quero testar', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/carousel_02.md', 'Draft herdado do pacote inicial 2026-03-17.'),
    ('instagram', 'reels', 'product', 'mecanismo', 'Reels 01 — O erro não é a agenda', 'Você acha que o problema é agenda… mas não é.', 'Quero testar', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/reels_01.md', 'Draft herdado do pacote inicial 2026-03-17.'),
    ('instagram', 'reels', 'product', 'objeções', 'Reels 02 — draft herdado', null, 'Quero testar', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/reels_02.md', 'Draft herdado do pacote inicial 2026-03-17.'),
    ('instagram', 'stories', 'brand', 'bastidor', 'Stories 01 — draft herdado', null, 'Responder story', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/stories_01.md', 'Draft herdado do pacote inicial 2026-03-17.'),
    ('instagram', 'stories', 'brand', 'objeções', 'Stories 02 — draft herdado', null, 'Responder story', 'pendente', 'copy_pronta', date '2026-03-17', 'nexus-marketing-squad/output/2026-03-17/stories_02.md', 'Draft herdado do pacote inicial 2026-03-17.')
) as x(channel, creative_type, theme_mode, pillar, title, hook, cta, approval_status, asset_status, delivery_date, source_path, notes)
where not exists (
  select 1 from public.marketing_creatives mc
  where mc.project_id = p.id and mc.source_path = x.source_path
);
