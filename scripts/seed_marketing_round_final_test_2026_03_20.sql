with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
), creatives as (
  insert into public.marketing_creatives (
    project_id, channel, creative_type, theme_mode, pillar, title, hook, caption, cta, approval_status, asset_status, delivery_date, source_path, notes
  )
  select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.caption, x.cta, 'pendente', 'render_pronto', date '2026-03-20', x.source_path, 'Teste final endurecido criado em 2026-03-20.'
  from project p
  cross join (
    values
      ('instagram','carousel','product','rotina comercial','Teste final — carrossel produto','Atendimento lento esfria venda.','Quando tudo depende de resposta manual, a operação pesa e a venda esfria. A Nexus Automação entra para trazer mais clareza, mais ritmo e uma rotina comercial melhor organizada.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-final-test/carousel_01.md'),
      ('instagram','stories','product','dor','Teste final — stories produto',null,'Rotina pesada normalmente é sintoma de fluxo confuso. A Nexus entra para organizar melhor o jogo.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-final-test/stories_01.md'),
      ('instagram','reels','product','processo','Teste final — reels produto','Sua equipe trabalha muito. Mas a operação ainda trava?','Nem sempre falta esforço. Muitas vezes falta clareza no fluxo. A Nexus Automação foi pensada para negócios que querem mais ritmo, menos ruído e uma rotina comercial melhor organizada.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-20-final-test/reels_01.md')
  ) as x(channel, creative_type, theme_mode, pillar, title, hook, caption, cta, source_path)
  returning id,title,creative_type
)
select * from creatives;
