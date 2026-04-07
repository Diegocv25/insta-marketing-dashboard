with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
), creatives as (
  insert into public.marketing_creatives (
    project_id, channel, creative_type, theme_mode, pillar, title, hook, caption, cta, approval_status, asset_status, delivery_date, source_path, notes
  )
  select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.caption, x.cta, 'pendente', 'render_pronto', date '2026-03-20', x.source_path, 'Rodada retry criada em 2026-03-20 após limpeza do dashboard.'
  from project p
  cross join (
    values
      ('instagram','carousel','product','rotina comercial','Retry — carrossel produto','Atendimento lento esfria venda.','Quando a resposta demora, o cliente perde o impulso e a rotina inteira sente.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-retry/carousel_01.md'),
      ('instagram','stories','product','dor','Retry — stories produto',null,'Rotina pesada normalmente é sintoma de fluxo confuso.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-retry/stories_01.md'),
      ('instagram','reels','product','processo','Retry — reels produto','Sua equipe trabalha muito. Mas a operação ainda trava?','Nem sempre falta esforço. Muitas vezes falta clareza no fluxo.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-retry/reels_01.md')
  ) as x(channel, creative_type, theme_mode, pillar, title, hook, caption, cta, source_path)
  returning id,title,creative_type
)
select * from creatives;
