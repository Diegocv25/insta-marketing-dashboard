import fs from 'fs';

const htmlPath = process.argv[2];
if (!htmlPath) throw new Error('Usage: node export_rag_blocks.js <path-to-html>');
const html = fs.readFileSync(htmlPath, 'utf8');

function getTextarea(key) {
  const re = new RegExp(`<textarea[^>]*data-key="${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"[^>]*>([\\s\\S]*?)<\\/textarea>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function getInput(key) {
  const re = new RegExp(`<input[^>]*data-key="${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"[^>]*value="([^"]*)"[^>]*>`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

function parseJson(key, fallback) {
  const raw = getTextarea(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

const companyName = getInput('company.name') || 'Nexus Automação';
const whatsapp = getInput('company.whatsapp_support') || '+5548991015688';
const instagram = getInput('company.instagram') || 'https://www.instagram.com/nexus.automacao.saas/';
const landing = getInput('company.landing_url') || 'https://page.ias-nexus-automacao.com.br/';

const addressPolicy = getTextarea('product_facts.general.address_policy_md');
const systemSummary = getTextarea('product_facts.general.system_summary_md');
const supportMd = getTextarea('product_facts.general.support_md');

const trial = {
  duration_days: Number(getInput('product_facts.trial.duration_days') || 7),
  requires_card: false,
  default_plan: getInput('product_facts.trial.default_plan') || 'Profissional',
  after_signup: getTextarea('product_facts.trial.after_signup'),
  activation_sla: getInput('product_facts.trial.activation_sla') || 'Acesso imediato',
  after_trial: getTextarea('product_facts.trial.after_trial'),
  cancellation_policy: getTextarea('product_facts.trial.cancellation_policy'),
  signup_free_md: getTextarea('product_facts.trial.signup_free_md'),
  signup_paid_md: getTextarea('product_facts.trial.signup_paid_md'),
};

const plans = parseJson('product_facts.plans__json', []);
const support = parseJson('product_facts.support__json', { channels: ['WhatsApp'], whatsapp });
const niches = parseJson('product_facts.niches__json', { supported: ['Salão de Beleza','Barbearia','Spa','Estética'], is_multi_niche: true });
const features = parseJson('product_facts.features__json', {});

const faq = parseJson('sales_playbook.faq__json', []);
const objections = parseJson('sales_playbook.objections__json', []);
const oneLinersRaw = getTextarea('sales_playbook.one_liners');
const one_liners = oneLinersRaw ? oneLinersRaw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean) : [];

const blocks = [
  {
    name: 'Informações gerais',
    category: 'geral',
    type: 'info_geral',
    content: `Empresa: ${companyName}\nWhatsApp suporte: ${whatsapp}\nInstagram: ${instagram}\nLanding: ${landing}\n\n${addressPolicy}\n\n${supportMd}`.trim(),
  },
  {
    name: 'Resumo do sistema',
    category: 'geral',
    type: 'resumo_sistema',
    content: systemSummary.trim(),
  },
  {
    name: 'Funcionalidades — resumo',
    category: 'funcionalidades',
    type: 'resumo',
    content: (() => {
      const r = features?.resumo;
      if (!r) return '';
      const bullets = (r.bullets || []).map(x=>`- ${x}`).join('\n');
      return `### ${r.title || 'Resumo'}\n\n${bullets}\n\n${r.promise ? `Resultado: ${r.promise}`:''}`.trim();
    })(),
  },
  {
    name: '7 dias grátis — como funciona',
    category: 'trial',
    type: 'teste_gratis',
    content: `Teste grátis: ${trial.duration_days} dias (sem cartão).\n\n${trial.after_signup}\n\nApós o teste:\n${trial.after_trial}\n\nCancelamento:\n${trial.cancellation_policy}`.trim(),
  },
  {
    name: 'Cadastro — teste grátis (campos completos)',
    category: 'cadastro',
    type: 'cadastro_teste_gratis',
    content: trial.signup_free_md.trim(),
  },
  {
    name: 'Cadastro — plano pago (campos completos)',
    category: 'cadastro',
    type: 'cadastro_pago',
    content: trial.signup_paid_md.trim(),
  },
  {
    name: 'FAQ — perguntas frequentes',
    category: 'faq',
    type: 'faq',
    content: faq.map(x=>`Q: ${x.q}\nA: ${x.a}`).join('\n\n').trim(),
  },
];

// Add plan blocks
for (const p of plans) {
  const inc = (p.includes || []).map(x=>`- ${x}`).join('\n');
  const pay = (p.payment_methods || []).map(x=>`- ${x}`).join('\n');
  blocks.push({
    name: `Plano — ${p.name}`,
    category: 'planos',
    type: 'plano',
    content: `Plano: ${p.name}\nPreço: ${p.price?.monthly_regular || ''}${p.price?.first_month_promo ? ` (promo 1ª: ${p.price.first_month_promo})` : ''}\nIndicado: ${p.recommended_for || ''}\n\nInclui:\n${inc}\n\nPagamento:\n${pay}`.trim(),
  });
}

// Add individual feature blocks (excluding resumo)
for (const [k,v] of Object.entries(features || {})) {
  if (k === 'resumo') continue;
  const bullets = (v.bullets || []).map(x=>`- ${x}`).join('\n');
  const diff = v.differential ? `\n${v.differential}\n` : '';
  blocks.push({
    name: `Funcionalidade — ${v.title || k}`,
    category: 'funcionalidades',
    type: 'funcionalidade',
    content: `### ${v.title || k}${diff}\n${bullets}\n\nResultado: ${v.promise || ''}`.trim(),
  });
}

const doc = {
  schemaVersion: 'rag.funil.v2',
  source_ref: 'nexus_funil:rag',
  company: { name: companyName, whatsapp_support: whatsapp, instagram, landing_url: landing },
  generatedAt: new Date().toISOString(),
  source: 'painel-assinaturas/public/rag/nexus_rag_config_v2.html',
  product_facts: { trial, plans, support, niches, features },
  sales_playbook: { one_liners, objections, faq },
  blocks,
  qna_index: [],
};

process.stdout.write(JSON.stringify(doc, null, 2));
