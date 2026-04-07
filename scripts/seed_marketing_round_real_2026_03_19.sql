with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
), creatives as (
  insert into public.marketing_creatives (
    project_id, channel, creative_type, theme_mode, pillar, title, hook, caption, cta, approval_status, asset_status, delivery_date, source_path, notes
  )
  select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.caption, x.cta, 'pendente', 'copy_pronta', date '2026-03-19', x.source_path, 'Rodada real criada em 2026-03-19.'
  from project p
  cross join (
    values
      ('instagram','carousel','product','rotina comercial','Carrossel 01 — atendimento lento esfria venda','Atendimento lento esfria venda.','Nem sempre o problema está no esforço da equipe. Quando o atendimento depende demais do improviso, a rotina pesa e a venda esfria. A Nexus Automação entra para trazer mais clareza, mais ritmo e uma operação comercial mais organizada.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-19-real/carousel_01.md'),
      ('instagram','carousel','brand','posicionamento','Carrossel 02 — sua marca também vende no visual','Sua marca também vende no visual.','Toda marca passa uma mensagem antes da primeira conversa. A Nexus quer construir presença forte, identidade clara e percepção de valor em cada ponto de contato.','Acompanhe a Nexus','nexus-marketing-squad/output/2026-03-19-real/carousel_02.md'),
      ('instagram','reels','product','processo','Reels 01 — o problema não é falta de esforço','Sua equipe trabalha muito. Mas a operação ainda trava?','Nem sempre falta esforço. Muitas vezes falta clareza no fluxo. A Nexus Automação foi pensada para negócios que querem mais ritmo, menos ruído e uma rotina comercial melhor organizada.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-19-real/reels_01.md'),
      ('instagram','reels','brand','presença','Reels 02 — presença não é exagero','Presença não é exagero. É percepção.','Marca forte não depende só de discurso. Depende de presença, identidade e consistência visual. É isso que estamos construindo na Nexus.','Siga a Nexus','nexus-marketing-squad/output/2026-03-19-real/reels_02.md'),
      ('instagram','stories','product','dor','Stories 01 — rotina comercial pesada',null,'Rotina pesada normalmente é sintoma de fluxo confuso. A Nexus entra para organizar melhor o jogo.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-19-real/stories_01.md'),
      ('instagram','stories','brand','identidade','Stories 02 — presença de marca',null,'Presença de marca não é detalhe. É parte da percepção de valor.','Acompanhe a Nexus','nexus-marketing-squad/output/2026-03-19-real/stories_02.md')
  ) as x(channel, creative_type, theme_mode, pillar, title, hook, caption, cta, source_path)
  returning id,title,source_path
)
select * from creatives;
