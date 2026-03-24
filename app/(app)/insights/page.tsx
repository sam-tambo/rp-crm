'use client'
import { useState } from 'react'
import {
  Globe, TrendingUp, Building2, Users, Zap, ArrowRight,
  Leaf, Target, Clock, Star, AlertTriangle, MapPin, Award, ShieldCheck
} from 'lucide-react'

// ── Pocargil BD Intelligence ────────────────────────────────────────────────
// Análise reorientada para a Pocargil enquanto fabricante têxtil portuguesa
// que fornece marcas globais de moda, vestuário, retalho e luxo.

// ── Pressão de nearshoring por região ─────────────────────────────────────
const SEGMENTS = [
  {
    tier: 1,
    label: 'Nearshore Prioritário',
    region: 'Europa Ocidental',
    count: 149,
    flags: ['🇬🇧','🇫🇷','🇮🇹','🇪🇸'],
    countries: 'Reino Unido · França · Itália · Espanha',
    avgRev: '$4,1B',
    why: 'Maior proximidade geográfica a Portugal. Marcas britânicas pós-Brexit procuram ativamente fornecedores europeus para contornar tarifas. Casas de luxo italianas e francesas já compram em Portugal. Os gigantes espanhóis da moda rápida (com ligação à Inditex) conhecem bem o modelo.',
    urgency: 'Agora',
    nearshorePressure: 95,
    sustainPressure: 88,
    bdAngle: 'Lead time + origem UE + certificações de qualidade',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    tier: 2,
    label: 'Alto Potencial',
    region: 'América do Norte',
    count: 316,
    flags: ['🇺🇸','🇨🇦'],
    countries: 'EUA (275) · Canadá (26) · México (15)',
    avgRev: '$5,5B',
    why: 'Maior conjunto de receitas ($1,5 biliões combinados). Marcas norte-americanas a executar estratégias de diversificação China+1, com necessidade de produtos de origem UE para as suas operações de retalho europeu. Marcas premium e de luxo dos EUA (PVH, Tapestry, Capri Holdings) qualificam cada vez mais fornecedores europeus para o seu mercado na UE.',
    urgency: 'Q3 2026',
    nearshorePressure: 72,
    sustainPressure: 65,
    bdAngle: 'Conformidade de origem UE + posicionamento premium para distribuição europeia',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    tier: 3,
    label: 'Segmento Luxo',
    region: 'Casas de Luxo Europeias',
    count: 95,
    flags: ['🇮🇹','🇫🇷','🇨🇭'],
    countries: 'Itália (36) · França (33) · Suíça (incl.)',
    avgRev: '$3,2B',
    why: 'As marcas de luxo de herança exigem proveniência, rastreabilidade e qualidade premium — todos pontos fortes da Pocargil. O "Made in Portugal" tem grande prestígio neste segmento (LVMH e Kering já compram em Portugal). Estes clientes têm relações duradouras, margens elevadas e baixa rotatividade.',
    urgency: 'Q2 2026',
    nearshorePressure: 60,
    sustainPressure: 92,
    bdAngle: 'Herança "Made in Portugal" + rastreabilidade + qualidade artesanal',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    tier: 4,
    label: 'Aposta Emergente',
    region: 'Ásia (Marcas, não fabricantes)',
    count: 48,
    flags: ['🇯🇵','🇰🇷','🇸🇬'],
    countries: 'Japão · Coreia do Sul · Singapura',
    avgRev: '$2,8B',
    why: 'Marcas de moda japonesas e coreanas (grupo Uniqlo, divisão de moda da Samsung C&T, entre outras) procuram cada vez mais produção europeia para linhas premium e expansão no mercado da UE. Ciclo de desenvolvimento mais longo, mas estratégico a médio prazo.',
    urgency: 'Q1 2027',
    nearshorePressure: 42,
    sustainPressure: 55,
    bdAngle: 'Produção europeia para posicionamento premium/mercado UE',
    color: '#D97706',
    bg: '#FFFBEB',
  },
]

// ── Regulação de sustentabilidade como força motriz ────────────────────────
const SUSTAINABILITY_SIGNALS = [
  {
    regulation: 'EU CSRD',
    full: 'Diretiva de Reporte de Sustentabilidade Empresarial',
    scope: 'Todas as grandes empresas da UE + cotadas (fase 1: +500 trabalhadores)',
    live: '2024–2026',
    impact: 'Obriga as marcas a divulgar emissões de Âmbito 3 na cadeia de abastecimento. Produção portuguesa = cadeia mais curta = menos emissões = melhores resultados de reporte.',
    urgency: 'hot',
    affected: '~380 empresas na sua base de dados',
    icon: '📋',
  },
  {
    regulation: 'EU CS3D',
    full: 'Diretiva de Due Diligence em Sustentabilidade Empresarial',
    scope: 'Empresas da UE + empresas não-UE a vender na UE',
    live: '2025–2027',
    impact: 'Obriga à due diligence em direitos humanos e ambiente na cadeia de abastecimento. Fornecedores europeus certificados (SA8000, BSCI) reduzem drasticamente o risco de conformidade para os compradores.',
    urgency: 'hot',
    affected: '~250 empresas a vender na UE',
    icon: '⚖️',
  },
  {
    regulation: 'Regulamento Ecodesign UE',
    full: 'Responsabilidade Alargada do Produtor para têxteis',
    scope: 'Todas as marcas de moda a vender no mercado europeu',
    live: '2026–2030',
    impact: 'As marcas têm de demonstrar design circular e reparabilidade. Fornecedores nearshore podem co-desenvolver materiais sustentáveis (reciclados, orgânicos) muito mais rapidamente do que as cadeias de abastecimento asiáticas.',
    urgency: 'medium',
    affected: 'Todas as marcas no mercado europeu',
    icon: '♻️',
  },
  {
    regulation: 'Compromissos Net Zero Âmbito 3',
    full: 'Science-Based Targets initiative (SBTi)',
    scope: 'Voluntário mas rapidamente a tornar-se requisito de mercado',
    live: 'AGORA',
    impact: 'Mais de 80% das grandes marcas de moda têm compromissos SBTi. A cadeia de abastecimento representa 70–90% das suas emissões totais. O nearshoring para Portugal reduz as emissões de frete marítimo em ~85% face ao Bangladesh/China.',
    urgency: 'hot',
    affected: '~600+ empresas com compromissos públicos de Net Zero',
    icon: '🌍',
  },
]

// ── Certificações a promover pela Pocargil ─────────────────────────────────
const CERTIFICATIONS = [
  { cert: 'GOTS', full: 'Global Organic Textile Standard', demand: 95, tier: 'Essencial', desc: 'Cadeia de abastecimento de algodão/lã orgânica. Exigido pela H&M, Patagonia e linhas sustentáveis da Inditex.' },
  { cert: 'OEKO-TEX 100', full: 'Standard 100 by OEKO-TEX', demand: 92, tier: 'Essencial', desc: "Certificação de segurança química. Imprescindível para roupa infantil e a maioria das marcas premium." },
  { cert: 'bluesign', full: 'bluesign System Partner', demand: 78, tier: 'Alto Valor', desc: "Gestão química e de recursos. Patagonia, Arc'teryx e Nike exigem-no aos seus fornecedores principais." },
  { cert: 'SA8000', full: 'Social Accountability 8000', demand: 65, tier: 'Alto Valor', desc: 'Certificação de direitos laborais. Exigido por marcas dos EUA e Reino Unido após Rana Plaza para auditorias à cadeia de abastecimento.' },
  { cert: 'GRS', full: 'Global Recycled Standard', demand: 74, tier: 'Em Crescimento', desc: 'Rastreabilidade de conteúdo reciclado. Obrigatório para marcas com metas de materiais reciclados em 2025.' },
  { cert: 'BCI', full: 'Better Cotton Initiative', demand: 60, tier: 'Requisito Base', desc: 'Sourcing responsável de algodão. H&M, Zara e M&S exigem algodão BCI aos seus fornecedores.' },
]

// ── Análise estratégica para o desenvolvimento de negócio da Pocargil ──────
const BD_INSIGHTS = [
  {
    icon: '🏆',
    title: 'A Credencial de Fornecedor Inditex É a Melhor Abertura',
    type: 'proof_point',
    body: "A Inditex tem um dos processos de qualificação de fornecedores mais exigentes da moda global — que abrange controlo de qualidade, taxas de entrega a tempo, normas laborais e conformidade ambiental. Ser um fornecedor aprovado da Inditex responde às três perguntas que qualquer novo comprador faz antes de trabalhar com um fabricante: conseguem entregar em escala? entregam a tempo? cumprem os nossos requisitos de conformidade? Quando a Pocargil lidera com esta referência, salta a fase de qualificação e abre diretamente a conversa comercial.",
    action: "Comece cada primeira abordagem com a referência Inditex. Não é fazer nome — é passar o filtro de qualificação antes de o comprador sequer o questionar.",
  },
  {
    icon: '🔄',
    title: "Os Prazos de Entrega da Pocargil São uma Vantagem Comercial Quantificável",
    type: 'megatrend',
    body: "O relatório McKinsey State of Fashion 2024 revelou que 63% dos executivos de moda planeiam aumentar o sourcing nearshore nos próximos 3 anos. A crise de navegação no Mar Vermelho (2024) acrescentou 2 a 4 semanas às rotas asiáticas e fez subir os custos de frete 400%. A Pocargil entrega em 2 a 3 semanas, face a 10 a 14 semanas da Ásia — ou seja, 8 a 12 semanas a menos de capital de trabalho imobilizado em stock por ciclo de encomenda. Para uma marca com €2M em encomendas, o nearshoring para a Pocargil pode libertar €300–500K em fluxo de caixa anualmente.",
    action: "Nas abordagens, quantifique o benefício em fluxo de caixa do lead time da Pocargil para o volume de encomendas específico do comprador. Os números convencem mais do que o posicionamento.",
  },
  {
    icon: '🇵🇹',
    title: '"Made in Portugal" Vale um Prémio de Preço no Segmento Luxo',
    type: 'positioning',
    body: "Portugal é o 4.º maior exportador têxtil da UE. LVMH, Kering e Richemont já compram a fabricantes portugueses para linhas premium. A Hugo Boss fabrica no Porto. As marcas usam o 'Made in Portugal' como sinal de qualidade — sobretudo em malha, tecidos técnicos e construção sem costuras. A origem portuguesa da Pocargil não é apenas um rótulo: é um argumento de margem. As marcas de luxo e premium pagam mais por origem europeia comprovada porque os seus clientes finais também o fazem.",
    action: "Nas abordagens ao segmento luxo, lidere com proveniência e qualidade — não com preço. A origem portuguesa sustenta um preço mais elevado desde a primeira reunião.",
  },
  {
    icon: '🌱',
    title: 'A Pocargil É uma Redução de Risco Regulatório para Cada Comprador',
    type: 'opportunity',
    body: "O CSRD e o CS3D da UE estão a obrigar as marcas a auditar fornecedores de Nível 1 e 2 até 2026. As marcas que compram na Ásia enfrentam meses de auditoria, lacunas de certificação e risco de divulgação. A Pocargil — a operar sob legislação laboral europeia, dentro da regulação ambiental da UE, com uma cadeia de abastecimento curta e rastreável — reduz drasticamente esse peso de conformidade. Cada cliente que compra à Pocargil encurta imediatamente a sua cadeia de auditoria de Âmbito 3 e reforça a sua pontuação de reporte CSRD. Isto é gestão de risco de procurement, não marketing.",
    action: "Pergunte a cada comprador qualificado: 'Qual é a sua cobertura atual de auditoria de fornecedores de Âmbito 3?' A Pocargil é a resposta à lacuna que provavelmente irão admitir.",
  },
  {
    icon: '⚡',
    title: "O Segmento 'Responsible Fast' É Onde a Pocargil Ganha Claramente",
    type: 'insight',
    body: "O mercado da moda rápida está a dividir-se em dois: uma corrida ao fundo no preço (ganha pela Shein) e um segmento 'responsible fast' que exige prazos de 4 a 6 semanas com origem europeia e credenciais de sustentabilidade. A Pocargil foi construída para o segundo segmento. Marcas como a Cos, Arket, Mango e Reserved não podem usar o modelo de sourcing da Shein — precisam de qualidade, rapidez e rastreabilidade. O pedigree Inditex da Pocargil + origem portuguesa + prazos curtos é a combinação que este segmento procura ativamente.",
    action: "Priorize o segmento casualwear premium — Cos, Arket, Mango, Reserved. Estas marcas pagam melhores margens e movem-se mais rapidamente do que o luxo.",
  },
  {
    icon: '🏭',
    title: "Marcas Norte-Americanas com Retalho na UE Precisam do que a Pocargil Já Oferece",
    type: 'strategy',
    body: "As tarifas norte-americanas sobre produtos chineses (atualmente +145%) estão a obrigar as marcas dos EUA a diversificar com urgência. Mas as marcas com operações significativas de retalho na UE enfrentam um problema adicional: produtos de origem vietnamita ou bangladeshiana continuam sujeitos a direitos de importação europeus. Precisam de um fabricante europeu para o seu negócio na UE — e a Pocargil é exatamente isso. A PVH (Calvin Klein, Tommy Hilfiger), a Tapestry (Coach) e a Capri Holdings têm todas um retalho europeu relevante. As suas equipas de sourcing para a UE estão ativamente a qualificar fornecedores europeus para evitar este duplo impacto tarifário.",
    action: "Para as contas norte-americanas na base de dados, identifique quais têm mais de 30% de receitas europeias nos relatórios anuais. São estas as que a Pocargil resolve um problema real, não apenas uma preferência.",
  },
]

// ── Roteiro de abordagem comercial ─────────────────────────────────────────
const BD_ROADMAP = [
  { priority: 1, segment: 'Vestuário e Retalho Reino Unido', accounts: 57, contacts: 8, angle: 'Origem UE pós-Brexit + lead time', timing: 'Abr–Jun 2026', effort: 'Médio', signal: 'quente' },
  { priority: 2, segment: 'Luxo/Moda Francesa e Italiana', accounts: 69, contacts: 6, angle: 'Herança "Made in Portugal" + GOTS', timing: 'Mai–Jul 2026', effort: 'Alto', signal: 'quente' },
  { priority: 3, segment: 'Moda Rápida Espanhola (exc. Inditex)', accounts: 23, contacts: 4, angle: 'Rapidez de mercado + proximidade ibérica', timing: 'Jun–Ago 2026', effort: 'Baixo', signal: 'médio' },
  { priority: 4, segment: 'Empresas EUA (operações UE)', accounts: 45, contacts: 14, angle: 'Origem UE para retalho europeu + China+1', timing: 'Jul–Set 2026', effort: 'Alto', signal: 'médio' },
  { priority: 5, segment: 'Marcas Sustentáveis Escandinavas', accounts: 22, contacts: 2, angle: 'Âmbito 3 + bluesign + SA8000', timing: 'Q4 2026', effort: 'Médio', signal: 'crescimento' },
]

// ── Calendário de feiras ────────────────────────────────────────────────────
const TRADE_SHOWS = [
  { show: 'Première Vision', city: 'Paris', date: 'Fev & Set', focus: 'Tecidos e materiais premium', relevance: 'Prioritária', why: 'Onde a Chanel, a Hermès e as suas equipas de sourcing procuram novos fornecedores de tecidos. Essencial para o segmento luxo.' },
  { show: 'Texworld Paris', city: 'Paris', date: 'Fev & Set', focus: 'Tecidos de vestuário mid-market', relevance: 'Alta', why: 'A H&M, a Inditex e a PVH enviam equipas de sourcing. O melhor sítio para encontrar diretores de compras do Reino Unido e da UE numa só deslocação.' },
  { show: 'Munich Fabric Start', city: 'Munique', date: 'Jan & Ago', focus: 'Tecidos técnicos e sustentáveis', relevance: 'Alta', why: 'Forte presença do segmento outdoor/desportivo (Adidas, Puma, Jack Wolfskin). Foco crescente em sustentabilidade.' },
  { show: 'Kingpins Amsterdam', city: 'Amesterdão', date: 'Abr & Out', focus: 'Denim e sourcing responsável', relevance: 'Média', why: "Essencial para marcas de denim. Presença das equipas de sourcing da Levi's, G-Star e Nudie Jeans." },
  { show: 'Modtissimo', city: 'Porto', date: 'Fev & Set', focus: 'Montra dos têxteis portugueses', relevance: 'Ferramenta BD', why: "A principal feira têxtil portuguesa. Os compradores visitam especificamente à procura de fornecedores portugueses — maior taxa de conversão." },
]

function StatCard({ icon: Icon, label, value, sub, color = '#059669', badge }: { icon: any; label: string; value: string; sub: string; color?: string; badge?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: '#ECFDF5', color: '#059669' }}>{badge}</span>}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: '#111118' }}>{value}</div>
      <div className="text-sm font-medium mb-1" style={{ color: '#111118' }}>{label}</div>
      <div className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</div>
    </div>
  )
}

function PressureBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#F4F4F8' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

export default function InsightsPage() {
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const [insightTab, setInsightTab] = useState<'regulatory' | 'certs' | 'strategic'>('strategic')

  const selected = activeSegment !== null ? SEGMENTS.find(s => s.tier === activeSegment) : null

  return (
    <div className="min-h-screen" style={{ background: '#F9F9FB' }}>
      {/* Cabeçalho */}
      <div className="px-8 pt-7 pb-6" style={{ borderBottom: '1px solid #EBEBF0', background: '#FFFFFF' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                <Target size={16} style={{ color: '#059669' }} />
              </div>
              <h1 className="text-lg font-bold" style={{ color: '#111118' }}>Inteligência Comercial</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ background: '#ECFDF5', color: '#059669' }}>
                Pocargil × 1.072 contas
              </span>
            </div>
            <p className="text-sm ml-11" style={{ color: '#6B7280' }}>
              Inteligência de desenvolvimento de negócio para a Pocargil — onde qualidade, entrega a tempo e a credencial de fornecedor Inditex abrem portas em 1.072 contas globais de moda e vestuário.
            </p>
          </div>
          <div className="text-xs text-right" style={{ color: '#9CA3AF' }}>
            <div>Enriquecido com dados da indústria de</div>
            <div className="font-medium" style={{ color: '#6B7280' }}>McKinsey SoF · Regulação UE · SBTi · OCDE Têxtil</div>
          </div>
        </div>
      </div>

      <div className="px-8 py-7 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total de Contas-Alvo" value="1.072" sub="Marcas de moda, retalho e luxo" badge="a sua BD" />
          <StatCard icon={MapPin} label="Contas Europeias Prioritárias" value="234" sub="UK, IT, FR, ES, DE, NL + Nórdicos" color="#2563EB" badge="nível 1-2" />
          <StatCard icon={Star} label="Segmento Luxo e Premium" value="95" sub='Maior margem, fit "Made in PT"' color="#7C3AED" />
          <StatCard icon={Leaf} label="Sob Obrigação CSRD" value="~380" sub="Obrigadas a reportar Âmbito 3 até 2026" color="#059669" badge="novo" />
        </div>

        {/* Segmentos de oportunidade nearshore */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#111118' }}>Oportunidade Nearshore por Segmento</h2>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Clique num segmento para expandir</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {SEGMENTS.map(seg => (
              <button
                key={seg.tier}
                onClick={() => setActiveSegment(activeSegment === seg.tier ? null : seg.tier)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: activeSegment === seg.tier ? seg.bg : '#FFFFFF',
                  border: `1px solid ${activeSegment === seg.tier ? seg.color : '#EBEBF0'}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {seg.flags.slice(0, 3).map((f, i) => <span key={i} className="text-sm">{f}</span>)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: `${seg.color}18`, color: seg.color }}>
                    Nível {seg.tier}
                  </span>
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#111118' }}>{seg.region}</div>
                <div className="text-xs mb-3" style={{ color: '#6B7280' }}>{seg.count} contas · média {seg.avgRev}</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Pressão nearshore</span>
                    </div>
                    <PressureBar value={seg.nearshorePressure} color={seg.color} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Urgência sustentabilidade</span>
                    </div>
                    <PressureBar value={seg.sustainPressure} color="#059669" />
                  </div>
                </div>
                <div className="mt-3 text-[10px] font-medium px-2 py-1 rounded" style={{ background: `${seg.color}12`, color: seg.color }}>
                  ⚡ {seg.urgency}
                </div>
              </button>
            ))}
          </div>

          {/* Detalhe do segmento */}
          {selected && (
            <div className="rounded-xl p-5 transition-all" style={{ background: selected.bg, border: `1px solid ${selected.color}40` }}>
              <div className="flex items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1 text-xl">
                      {selected.flags.map((f, i) => <span key={i}>{f}</span>)}
                    </div>
                    <span className="text-base font-bold" style={{ color: '#111118' }}>{selected.region}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${selected.color}20`, color: selected.color }}>{selected.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>{selected.why}</p>
                  <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg w-fit" style={{ background: '#FFFFFF', border: `1px solid ${selected.color}30`, color: selected.color }}>
                    <Target size={11} /> Abordagem BD: {selected.bdAngle}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-2">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: selected.color }}>{selected.count}</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>contas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#111118' }}>{selected.avgRev}</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>receita média</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separadores de análise */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#111118' }}>Análise de Mercado</h2>
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: '#F4F4F8' }}>
              {[
                { key: 'strategic', label: 'Análise Estratégica' },
                { key: 'regulatory', label: 'Regulação Favorável' },
                { key: 'certs', label: 'Mapa de Certificações' },
              ].map(t => (
                <button key={t.key} onClick={() => setInsightTab(t.key as any)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={insightTab === t.key ? { background: '#FFFFFF', color: '#111118', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#9CA3AF' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Análise Estratégica */}
          {insightTab === 'strategic' && (
            <div className="grid grid-cols-2 gap-4">
              {BD_INSIGHTS.map((ins, i) => (
                <div key={i} className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{ins.icon}</span>
                    <div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mr-2" style={{
                        background: ins.type === 'proof_point' ? '#FEF3C7' : ins.type === 'megatrend' ? '#ECFDF5' : ins.type === 'positioning' ? '#EFF6FF' : ins.type === 'opportunity' ? '#F0FDF4' : ins.type === 'insight' ? '#F5F3FF' : '#F4F4F8',
                        color: ins.type === 'proof_point' ? '#B45309' : ins.type === 'megatrend' ? '#059669' : ins.type === 'positioning' ? '#2563EB' : ins.type === 'opportunity' ? '#16A34A' : ins.type === 'insight' ? '#7C3AED' : '#6B7280',
                      }}>{ins.type === 'proof_point' ? 'prova concreta' : ins.type === 'megatrend' ? 'megatendência' : ins.type === 'positioning' ? 'posicionamento' : ins.type === 'opportunity' ? 'oportunidade' : ins.type === 'insight' ? 'análise' : ins.type}</span>
                      <span className="text-sm font-semibold" style={{ color: '#111118' }}>{ins.title}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>{ins.body}</p>
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#F4F4F8', color: '#374151' }}>
                    <ArrowRight size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#059669' }} />
                    <span>{ins.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regulação Favorável */}
          {insightTab === 'regulatory' && (
            <div className="space-y-3">
              {SUSTAINABILITY_SIGNALS.map((reg, i) => (
                <div key={i} className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{reg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold" style={{ color: '#111118' }}>{reg.regulation}</span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>{reg.full}</span>
                        {reg.urgency === 'hot' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: '#ECFDF5', color: '#059669' }}>Em Vigor</span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs mb-2" style={{ color: '#9CA3AF' }}>
                        <span>Âmbito: {reg.scope}</span>
                        <span>·</span>
                        <span>Calendário: {reg.live}</span>
                        <span>·</span>
                        <span className="font-medium" style={{ color: '#059669' }}>{reg.affected}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{reg.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl p-5" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="text-sm font-bold mb-1" style={{ color: '#059669' }}>Vantagem Regulatória da Pocargil</div>
                    <p className="text-sm leading-relaxed" style={{ color: '#065F46' }}>
                      Enquanto fabricante portuguesa — a operar sob legislação laboral europeia, regulação ambiental da UE e com acesso à infraestrutura de certificação de sustentabilidade europeia — a Pocargil oferece aos compradores uma cobertura regulatória genuína. Cada cliente que compra à Pocargil reduz imediatamente o seu risco de auditoria na cadeia de abastecimento de Âmbito 3, encurta a sua cadeia de rastreabilidade e reforça o seu reporte CSRD. Não é marketing: é gestão de risco de procurement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mapa de Certificações */}
          {insightTab === 'certs' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {CERTIFICATIONS.map((cert, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: '#111118' }}>{cert.cert}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        background: cert.tier === 'Essencial' ? '#ECFDF5' : cert.tier === 'Alto Valor' ? '#EFF6FF' : '#FFFBEB',
                        color: cert.tier === 'Essencial' ? '#059669' : cert.tier === 'Alto Valor' ? '#2563EB' : '#D97706',
                      }}>{cert.tier}</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{cert.full}</div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Procura dos compradores</span>
                        <span className="text-[10px] font-bold" style={{ color: cert.demand >= 85 ? '#059669' : '#D97706' }}>{cert.demand}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#F4F4F8' }}>
                        <div className="h-full rounded-full" style={{ width: `${cert.demand}%`, background: cert.demand >= 85 ? '#059669' : cert.demand >= 70 ? '#2563EB' : '#D97706' }} />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{cert.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ background: '#F4F4F8', border: '1px solid #EBEBF0' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  <strong style={{ color: '#111118' }}>Recomendação de certificações:</strong> Priorize GOTS + OEKO-TEX 100 como requisitos base (exigidos por ~90% das contas-alvo europeias). Adicione GRS para conteúdo reciclado até 2026 (exigência do Regulamento Ecodesign da UE). Avance com a bluesign para entrar no segmento desportivo/outdoor (Adidas, Puma, Arc'teryx). A SA8000 abre contas empresariais norte-americanas que exigem auditorias de direitos laborais.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Roteiro de Abordagem Comercial */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111118' }}>
            Roteiro de Abordagem Comercial <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>— sequência recomendada para 2026</span>
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBEBF0' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9F9FB', borderBottom: '1px solid #EBEBF0' }}>
                  {['#', 'Segmento', 'Contas', 'Contactos na BD', 'Abordagem', 'Sinal', 'Calendário'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BD_ROADMAP.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F4F4F8', background: '#FFFFFF' }}>
                    <td className="px-5 py-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i === 0 ? '#059669' : '#F4F4F8', color: i === 0 ? '#FFFFFF' : '#6B7280' }}>
                        {row.priority}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#111118' }}>{row.segment}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#059669' }}>{row.accounts}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#374151' }}>{row.contacts} contactos</td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#6B7280', maxWidth: 200 }}>{row.angle}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase" style={{
                        background: row.signal === 'quente' ? '#ECFDF5' : row.signal === 'médio' ? '#FFFBEB' : '#EFF6FF',
                        color: row.signal === 'quente' ? '#059669' : row.signal === 'médio' ? '#D97706' : '#2563EB',
                      }}>{row.signal}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: '#111118' }}>{row.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendário de Feiras */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111118' }}>
            Calendário de Feiras <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>— onde os seus compradores procuram fornecedores</span>
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {TRADE_SHOWS.map((show, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: '#111118' }}>{show.show}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{
                    background: show.relevance === 'Prioritária' ? '#ECFDF5' : show.relevance === 'Alta' ? '#EFF6FF' : show.relevance === 'Ferramenta BD' ? '#FEF3C7' : '#F4F4F8',
                    color: show.relevance === 'Prioritária' ? '#059669' : show.relevance === 'Alta' ? '#2563EB' : show.relevance === 'Ferramenta BD' ? '#D97706' : '#6B7280',
                  }}>{show.relevance}</span>
                </div>
                <div className="text-[10px] mb-1" style={{ color: '#9CA3AF' }}>{show.city} · {show.date}</div>
                <div className="text-[10px] font-medium mb-2" style={{ color: '#6B7280' }}>{show.focus}</div>
                <p className="text-[10px] leading-relaxed" style={{ color: '#9CA3AF' }}>{show.why}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="rounded-xl p-6" style={{ background: '#111118', border: '1px solid #1E1E2A' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#059669' }}>
              <Zap size={18} style={{ color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold mb-1" style={{ color: '#F4F4F8' }}>A Referência Inditex + 40 Contactos Qualificados = O Seu Pipeline</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B6B80' }}>
                A Pocargil já fornece o maior retalhista de moda do mundo — e tem contactos de nível VP e Diretor em sourcing na Adidas, H&M, PVH, Tapestry e outras. São estas as pessoas que aprovam as listas de fornecedores. A credencial Inditex é a abertura; a qualidade, os prazos e a conformidade europeia são o fecho. As marcas estão neste momento a fechar os painéis de fornecedores para SS27 — a altura certa para agir é agora.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors hover:opacity-90" style={{ background: '#059669', color: '#FFFFFF' }}>
              Ver Contactos <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
