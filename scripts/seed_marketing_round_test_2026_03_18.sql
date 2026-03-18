with project as (
  select id from public.marketing_projects where slug = 'nexus-instagram-marketing'
), creatives as (
  insert into public.marketing_creatives (
    project_id,
    channel,
    creative_type,
    theme_mode,
    pillar,
    title,
    hook,
    caption,
    cta,
    approval_status,
    asset_status,
    delivery_date,
    source_path,
    notes
  )
  select p.id, x.channel, x.creative_type, x.theme_mode, x.pillar, x.title, x.hook, x.caption, x.cta, 'pendente', 'copy_pronta', date '2026-03-18', x.source_path, x.notes
  from project p
  cross join (
    values
      ('instagram','carousel','product','rotina comercial','Carrossel 01 — atendimento manual trava a rotina','Sua empresa ainda perde tempo com atendimento manual?','Atendimento, organização e rotina comercial não precisam virar um peso no dia a dia. A Nexus Automação foi pensada para empresas que querem mais agilidade e mais clareza na operação, sem complicação.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-18-test/carousel_01.md','Rodada teste criada pelos agentes em 2026-03-18.'),
      ('instagram','carousel','brand','posicionamento','Carrossel 02 — automação é posicionamento','Automação não é só tecnologia. É posicionamento.','Toda marca passa uma mensagem antes mesmo da primeira conversa. A Nexus Automação quer ser percebida como moderna, firme e preparada para um novo momento dos negócios.','Siga a Nexus','nexus-marketing-squad/output/2026-03-18-test/carousel_02.md','Rodada teste criada pelos agentes em 2026-03-18.'),
      ('instagram','reels','product','rotina comercial','Reels 01 — atendimento trava a equipe','Sua equipe trabalha muito, mas ainda sente que o atendimento trava?','Nem sempre o problema é falta de esforço da equipe. Muitas vezes, o que pesa é um processo confuso. A Nexus Automação entra para trazer mais clareza, mais ritmo e uma operação mais organizada.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-18-test/reels_01.md','Rodada teste criada pelos agentes em 2026-03-18.'),
      ('instagram','reels','brand','presença','Reels 02 — presença de marca Nexus','Algumas marcas parecem comuns. Outras já chegam com presença.','Existe tecnologia. E existe tecnologia com identidade. A Nexus Automação quer construir uma presença forte, atual e marcante.','Siga a Nexus','nexus-marketing-squad/output/2026-03-18-test/reels_02.md','Rodada teste criada pelos agentes em 2026-03-18.'),
      ('instagram','stories','product','dor','Stories 01 — rotina pesada no atendimento',null,'Sequência simples, direta e com visual marrom quente, próximo da landing page.','Fale com a Nexus','nexus-marketing-squad/output/2026-03-18-test/stories_01.md','Rodada teste criada pelos agentes em 2026-03-18.'),
      ('instagram','stories','brand','identidade','Stories 02 — presença visual Nexus',null,'Story de marca com fundo escuro, ciano/roxo neon e tipografia moderna.','Acompanhe os próximos conteúdos','nexus-marketing-squad/output/2026-03-18-test/stories_02.md','Rodada teste criada pelos agentes em 2026-03-18.')
  ) as x(channel, creative_type, theme_mode, pillar, title, hook, caption, cta, source_path, notes)
  where not exists (
    select 1 from public.marketing_creatives mc
    where mc.project_id = p.id and mc.source_path = x.source_path
  )
  returning id, source_path, title
)
select * from creatives;
