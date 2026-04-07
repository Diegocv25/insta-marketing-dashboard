with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
), creatives as (
  insert into public.marketing_creatives (
    project_id, channel, creative_type, theme_mode, pillar, title, hook, caption, cta, approval_status, asset_status, delivery_date, source_path, notes, preview_path, preview_url
  )
  select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.caption, x.cta, 'pendente', x.asset_status, date '2026-03-20', x.source_path, 'Entrega nichada criada em 2026-03-20.', x.preview_path, x.preview_url
  from project p
  cross join (
    values
      ('instagram','carousel','product','salão','Entrega — carrossel salão','Seu salão cheio e o atendimento travando?','Quando a resposta demora, a agenda aperta e a venda esfria.','Fale com a Nexus','render_pronto','nexus-marketing-squad/output/2026-03-20-delivery-test/carousel_01.md','marketing/rendered/delivery-carousel-salao/slide_01.png','https://insta-marketing-dashboard.vercel.app/generated/rendered/delivery-carousel-salao/slide_01.png'),
      ('instagram','stories','product','salão','Entrega — stories salão','Seu salão lotado e o WhatsApp travando?','Cliente esperando também é agenda apertando.','Fale com a Nexus','render_pronto','nexus-marketing-squad/output/2026-03-20-delivery-test/stories_01.md','marketing/rendered/delivery-stories-salao/slide_01.png','https://insta-marketing-dashboard.vercel.app/generated/rendered/delivery-stories-salao/slide_01.png'),
      ('instagram','reels','product','salão','Entrega — reels salão','A equipe do seu salão trabalha muito. Mas o atendimento ainda trava?','O WhatsApp toca, a agenda aperta, a resposta atrasa e a rotina do salão sente o impacto.','Fale com a Nexus','video_pronto','nexus-marketing-squad/output/2026-03-20-delivery-test/reels_01.md','marketing/video/delivery-reels-storyboard/final.mp4','https://insta-marketing-dashboard.vercel.app/generated/video/delivery-reels-storyboard/final.mp4')
  ) as x(channel, creative_type, theme_mode, pillar, title, hook, caption, cta, asset_status, source_path, preview_path, preview_url)
  returning id,title,creative_type
)
select * from creatives;
