'use client'
import { useState } from 'react'
import {
  Globe, TrendingUp, Building2, Users, Zap, ArrowRight,
  Leaf, Target, Clock, Star, AlertTriangle, MapPin, Award, ShieldCheck
} from 'lucide-react'

// ── Pocargil BD Intelligence ────────────────────────────────────────────────
// Insights reframed for Pocargil as a Portuguese textile manufacturer
// selling to global apparel, fashion, retail & luxury brands.

// ── Nearshoring pressure score by region ──────────────────────────────────
const SEGMENTS = [
  {
    tier: 1,
    label: 'Priority Nearshore',
    region: 'Western Europe',
    count: 149,
    flags: ['🇬🇧','🇫🇷','🇮🇹','🇪🇸'],
    countries: 'UK · France · Italy · Spain',
    avgRev: '$4.1B',
    why: 'Closest geographic proximity to Portugal. Post-Brexit UK brands actively seeking EU-based nearshore to sidestep tariffs. Italian & French luxury houses already source from Portugal. Spanish fast-fashion giants (Inditex adjacency) understand the model.',
    urgency: 'Now',
    nearshorePressure: 95,
    sustainPressure: 88,
    bdAngle: 'Lead time + EU origin + quality certifications',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    tier: 2,
    label: 'High Potential',
    region: 'North America',
    count: 316,
    flags: ['🇺🇸','🇨🇦'],
    countries: 'US (275) · Canada (26) · Mexico (15)',
    avgRev: '$5.5B',
    why: 'Largest revenue pool ($1.5T combined). US brands pursuing China+1 diversification strategies and needing EU-origin goods for European retail arms. Premium/luxury US brands (PVH, Tapestry, Capri Holdings) increasingly qualify European suppliers for their own EU market sourcing.',
    urgency: 'Q3 2026',
    nearshorePressure: 72,
    sustainPressure: 65,
    bdAngle: 'EU-origin compliance + premium positioning for EU distribution',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    tier: 3,
    label: 'Luxury Segment',
    region: 'EU Luxury Houses',
    count: 95,
    flags: ['🇮🇹','🇫🇷','🇨🇭'],
    countries: 'Italy (36) · France (33) · Switzerland (incl.)',
    avgRev: '$3.2B',
    why: 'Heritage luxury brands require provenance, traceability and premium quality — all Pocargil strengths. "Made in Portugal" has strong cachet in this segment (LVMH, Kering already source from PT). These clients have long relationships but high margins and low churn.',
    urgency: 'Q2 2026',
    nearshorePressure: 60,
    sustainPressure: 92,
    bdAngle: '"Made in Portugal" heritage + traceability + artisan quality',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    tier: 4,
    label: 'Emerging Play',
    region: 'Asia (Brands, not manufacturers)',
    count: 48,
    flags: ['🇯🇵','🇰🇷','🇸🇬'],
    countries: 'Japan · South Korea · Singapore',
    avgRev: '$2.8B',
    why: 'Japanese and Korean fashion brands (Uniqlo parent, Samsung C&T fashion arm, etc.) increasingly seek European manufacturing for premium lines and EU market expansion. Longer build but strategic for the future.',
    urgency: 'Q1 2027',
    nearshorePressure: 42,
    sustainPressure: 55,
    bdAngle: 'European manufacturing for premium/EU market positioning',
    color: '#D97706',
    bg: '#FFFBEB',
  },
]

// ── Sustainability compliance forcing functions ────────────────────────────
const SUSTAINABILITY_SIGNALS = [
  {
    regulation: 'EU CSRD',
    full: 'Corporate Sustainability Reporting Directive',
    scope: 'All large EU + listed companies (500+ employees phase 1)',
    live: '2024–2026',
    impact: 'Forces brands to disclose Scope 3 supply chain emissions. Portuguese manufacturing = shorter supply chain = lower emissions = better disclosure scores.',
    urgency: 'hot',
    affected: '~380 companies in your DB',
    icon: '📋',
  },
  {
    regulation: 'EU CS3D',
    full: 'Corporate Sustainability Due Diligence Directive',
    scope: 'EU companies + non-EU companies selling to EU',
    live: '2025–2027',
    impact: 'Mandates supply chain human rights & environmental due diligence. European certified suppliers (SA8000, BSCI) dramatically reduce compliance risk for buyers.',
    urgency: 'hot',
    affected: '~250 EU-selling companies',
    icon: '⚖️',
  },
  {
    regulation: 'EU Ecodesign Regulation',
    full: 'Extended Producer Responsibility for textiles',
    scope: 'All fashion brands selling in EU market',
    live: '2026–2030',
    impact: 'Brands must demonstrate circular design and repairability. Nearshore suppliers can co-develop sustainable materials (recycled, organic) much faster than Asian supply chains.',
    urgency: 'medium',
    affected: 'All EU-market brands',
    icon: '♻️',
  },
  {
    regulation: 'Scope 3 Net Zero Pledges',
    full: 'Science-Based Targets initiative (SBTi)',
    scope: 'Voluntary but rapidly becoming table stakes',
    live: 'NOW',
    impact: '80%+ of major fashion brands have SBTi commitments. Supply chain = 70–90% of their total emissions. Nearshoring to Portugal cuts ocean freight emissions by ~85% vs. Bangladesh/China.',
    urgency: 'hot',
    affected: '~600+ companies with public Net Zero pledges',
    icon: '🌍',
  },
]

// ── Certifications Pocargil should pursue/promote ─────────────────────────
const CERTIFICATIONS = [
  { cert: 'GOTS', full: 'Global Organic Textile Standard', demand: 95, tier: 'Essential', desc: 'Organic cotton/wool supply chain. Required by H&M, Patagonia, Inditex sustainable lines.' },
  { cert: 'OEKO-TEX 100', full: 'Standard 100 by OEKO-TEX', demand: 92, tier: 'Essential', desc: 'Chemical safety certification. Non-negotiable for children\'s wear and most premium brands.' },
  { cert: 'bluesign', full: 'bluesign System Partner', demand: 78, tier: 'High Value', desc: 'Chemical & resource management. Patagonia, Arc\'teryx, Nike require it from key suppliers.' },
  { cert: 'SA8000', full: 'Social Accountability 8000', demand: 65, tier: 'High Value', desc: 'Labour rights certification. US & UK brands require it post-Rana Plaza for supply chain audits.' },
  { cert: 'GRS', full: 'Global Recycled Standard', demand: 74, tier: 'Growing Fast', desc: 'Recycled content traceability. Mandatory for brands with recycled material targets by 2025.' },
  { cert: 'BCI', full: 'Better Cotton Initiative', demand: 60, tier: 'Table Stakes', desc: 'Responsible cotton sourcing. H&M, Zara, M&S all mandate BCI cotton from suppliers.' },
]

// ── Strategic insights for Pocargil BD ────────────────────────────────────
const BD_INSIGHTS = [
  {
    icon: '🔄',
    title: 'The Nearshoring Supercycle Is Here',
    type: 'megatrend',
    body: 'McKinsey\'s 2024 State of Fashion report found 63% of fashion executives plan to increase nearshore sourcing in the next 3 years. Post-COVID supply chain disruptions + Red Sea shipping crisis (2024) added 2–4 weeks to Asia routes and pushed freight costs up 400%. Portugal\'s 2–3 week lead time vs. 10–14 weeks from Asia is now a commercially decisive advantage, not just a nice-to-have.',
    action: 'Frame every outreach around "lead time ROI" — quantify the cash flow benefit of 8 fewer weeks of inventory in transit.',
  },
  {
    icon: '🇵🇹',
    title: '"Made in Portugal" Is a Selling Point in Luxury',
    type: 'positioning',
    body: 'Portugal is the 4th largest textile exporter in the EU. LVMH, Kering, and Richemont already source from Portuguese manufacturers for their premium lines. Hugo Boss has a production facility in Porto. Brands increasingly use "Made in Portugal" as a quality signal — especially for knitwear, technical fabrics, and seamless construction. This is an asset Pocargil should lead with in all luxury segment outreach.',
    action: 'Build a "Made in Portugal" portfolio page with brand logos (with permission) to establish social proof in BD decks.',
  },
  {
    icon: '🌱',
    title: 'Sustainability Compliance = Mandatory Supplier Qualification',
    type: 'opportunity',
    body: 'EU CSRD and CS3D are forcing brands to audit Tier 1 and Tier 2 suppliers by 2026. Brands without certified European suppliers will face regulatory exposure. A Pocargil with GOTS, OEKO-TEX and bluesign certifications becomes a compliance asset for buyers — not just a cost line. The sustainability certification stack is becoming a supplier selection filter, not a differentiator.',
    action: 'Audit current certifications and identify which to add in 2025. Lead qualification by asking "What are your scope 3 emission reduction targets?"',
  },
  {
    icon: '⚡',
    title: 'Fast Fashion Is Fracturing Into "Responsible Fast"',
    type: 'insight',
    body: 'The traditional fast fashion model (Zara, H&M, Shein) is bifurcating: a race to the bottom on price (increasingly won by Shein) and a "responsible fast" segment that wants 4–6 week turnaround but with European origin and sustainability credentials. Pocargil can win the second segment. Brands like Cos, & Other Stories, Arket, Mango, Reserved (Poland) are exactly in this sweet spot.',
    action: 'Target the "premium casualwear" segment specifically — Cos, Arket, Mango, Reserved. These brands pay more and move faster than luxury.',
  },
  {
    icon: '🔗',
    title: 'Your 40 Contacts Are Buying Directors — Use Them',
    type: 'bd_signal',
    body: 'The 40 imported contacts include VP-level Sourcing, Procurement Directors, and Head of Supply Chain roles at Adidas, H&M, Inditex, PVH Corp, Tapestry, and others. These are exactly the roles that approve supplier lists. The typical buying decision cycle in apparel sourcing is 6–9 months. Starting outreach now targeting SS27 collection would be ideal timing (brands are currently finalizing SS27 supplier panels).',
    action: 'Prioritize outreach to the 12 contacts in UK + France + Italy companies. Reference their sustainability commitments directly in opening messages.',
  },
  {
    icon: '🏭',
    title: 'The China+1 Opportunity in North America',
    type: 'strategy',
    body: 'US tariffs on Chinese goods (currently 145%+) are forcing US brands to urgently diversify supply chains. While most US brands first look to Vietnam, Mexico, or Bangladesh, EU-targeting US brands (PVH, Tapestry, Ralph Lauren) need EU-origin goods for their European retail operations. These brands cannot use Vietnam-origin goods for EU sales and avoid EU tariffs. Portugal = competitive advantage for their EU business unit.',
    action: 'For US accounts, identify which have significant European retail (check their annual reports). Pitch Pocargil as their EU-origin supplier solution.',
  },
]

// ── BD outreach roadmap ─────────────────────────────────────────────────────
const BD_ROADMAP = [
  { priority: 1, segment: 'UK Apparel & Retail', accounts: 57, contacts: 8, angle: 'Post-Brexit EU-origin + lead time', timing: 'Apr–Jun 2026', effort: 'Medium', signal: 'hot' },
  { priority: 2, segment: 'French & Italian Luxury/Fashion', accounts: 69, contacts: 6, angle: '"Made in Portugal" heritage + GOTS', timing: 'May–Jul 2026', effort: 'High', signal: 'hot' },
  { priority: 3, segment: 'Spanish Fast-Fashion (excl. Inditex)', accounts: 23, contacts: 4, angle: 'Speed-to-market + Iberian proximity', timing: 'Jun–Aug 2026', effort: 'Low', signal: 'medium' },
  { priority: 4, segment: 'US Enterprise (EU ops)', accounts: 45, contacts: 14, angle: 'EU-origin for EU retail + China+1', timing: 'Jul–Sep 2026', effort: 'High', signal: 'medium' },
  { priority: 5, segment: 'Scandinavian Sustainable Brands', accounts: 22, contacts: 2, angle: 'Scope 3 + bluesign + SA8000', timing: 'Q4 2026', effort: 'Medium', signal: 'growing' },
]

// ── Trade show calendar ─────────────────────────────────────────────────────
const TRADE_SHOWS = [
  { show: 'Première Vision', city: 'Paris', date: 'Feb & Sep', focus: 'Premium fabrics & materials', relevance: 'Top-tier', why: 'Where Chanel, Hermès, and their sourcing teams scout new fabric suppliers. Essential for luxury segment.' },
  { show: 'Texworld Paris', city: 'Paris', date: 'Feb & Sep', focus: 'Mid-market apparel fabrics', relevance: 'High', why: 'H&M, Inditex, PVH send sourcing teams. Best place to meet UK/EU buying directors in one trip.' },
  { show: 'Munich Fabric Start', city: 'Munich', date: 'Jan & Aug', focus: 'Performance & sustainable fabrics', relevance: 'High', why: 'Strong outdoor/sportswear attendance (Adidas, Puma, Jack Wolfskin). Growing sustainability focus.' },
  { show: 'Kingpins Amsterdam', city: 'Amsterdam', date: 'Apr & Oct', focus: 'Denim & responsible sourcing', relevance: 'Medium', why: 'Key for denim-focused brands. Levi\'s, G-Star, Nudie Jeans sourcing present.' },
  { show: 'Modtissimo', city: 'Porto', date: 'Feb & Sep', focus: 'Portuguese textiles showcase', relevance: 'BD Tool', why: 'Portugal\'s flagship textile fair. Buyers visit specifically looking for Portuguese suppliers — highest conversion.' },
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
      {/* Header */}
      <div className="px-8 pt-7 pb-6" style={{ borderBottom: '1px solid #EBEBF0', background: '#FFFFFF' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                <Target size={16} style={{ color: '#059669' }} />
              </div>
              <h1 className="text-lg font-bold" style={{ color: '#111118' }}>BD Intelligence</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ background: '#ECFDF5', color: '#059669' }}>
                Pocargil × 1,072 accounts
              </span>
            </div>
            <p className="text-sm ml-11" style={{ color: '#6B7280' }}>
              Supplier business development intelligence for Pocargil — identifying sourcing opportunities, regulatory tailwinds, and priority outreach targets across the global apparel & fashion database.
            </p>
          </div>
          <div className="text-xs text-right" style={{ color: '#9CA3AF' }}>
            <div>Enriched with industry data from</div>
            <div className="font-medium" style={{ color: '#6B7280' }}>McKinsey SoF · EU Regulatory · SBTi · OECD Textile</div>
          </div>
        </div>
      </div>

      <div className="px-8 py-7 space-y-8">

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total Target Accounts" value="1,072" sub="Apparel, retail & luxury brands" badge="your DB" />
          <StatCard icon={MapPin} label="Priority European Accounts" value="234" sub="UK, IT, FR, ES, DE, NL + Nordics" color="#2563EB" badge="tier 1-2" />
          <StatCard icon={Star} label="Luxury & Premium Segment" value="95" sub="Highest margin, \"Made in PT\" fit" color="#7C3AED" />
          <StatCard icon={Leaf} label="Under CSRD Obligation" value="~380" sub="Must disclose Scope 3 by 2026" color="#059669" badge="new" />
        </div>

        {/* Nearshoring opportunity segments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#111118' }}>Nearshoring Opportunity by Segment</h2>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Click a segment to expand</span>
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
                    Tier {seg.tier}
                  </span>
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#111118' }}>{seg.region}</div>
                <div className="text-xs mb-3" style={{ color: '#6B7280' }}>{seg.count} accounts · avg {seg.avgRev}</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Nearshore pressure</span>
                    </div>
                    <PressureBar value={seg.nearshorePressure} color={seg.color} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Sustainability urgency</span>
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

          {/* Segment detail */}
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
                    <Target size={11} /> BD angle: {selected.bdAngle}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-2">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: selected.color }}>{selected.count}</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>accounts</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#111118' }}>{selected.avgRev}</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>avg revenue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#111118' }}>Market Intelligence</h2>
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: '#F4F4F8' }}>
              {[
                { key: 'strategic', label: 'Strategic Insights' },
                { key: 'regulatory', label: 'Regulatory Tailwinds' },
                { key: 'certs', label: 'Certification Map' },
              ].map(t => (
                <button key={t.key} onClick={() => setInsightTab(t.key as any)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={insightTab === t.key ? { background: '#FFFFFF', color: '#111118', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#9CA3AF' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strategic Insights */}
          {insightTab === 'strategic' && (
            <div className="grid grid-cols-2 gap-4">
              {BD_INSIGHTS.map((ins, i) => (
                <div key={i} className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{ins.icon}</span>
                    <div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mr-2" style={{
                        background: ins.type === 'megatrend' ? '#ECFDF5' : ins.type === 'positioning' ? '#EFF6FF' : ins.type === 'opportunity' ? '#F0FDF4' : ins.type === 'bd_signal' ? '#FEF3C7' : '#F5F3FF',
                        color: ins.type === 'megatrend' ? '#059669' : ins.type === 'positioning' ? '#2563EB' : ins.type === 'opportunity' ? '#16A34A' : ins.type === 'bd_signal' ? '#D97706' : '#7C3AED',
                      }}>{ins.type.replace('_', ' ')}</span>
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

          {/* Regulatory Tailwinds */}
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: '#ECFDF5', color: '#059669' }}>Live Now</span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs mb-2" style={{ color: '#9CA3AF' }}>
                        <span>Scope: {reg.scope}</span>
                        <span>·</span>
                        <span>Timeline: {reg.live}</span>
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
                    <div className="text-sm font-bold mb-1" style={{ color: '#059669' }}>Pocargil's Regulatory Advantage</div>
                    <p className="text-sm leading-relaxed" style={{ color: '#065F46' }}>
                      As a Portuguese manufacturer — operating under EU labour law, environmental regulations, and with access to EU sustainability certification infrastructure — Pocargil can offer buyers genuine regulatory cover. Every client that sources from Pocargil immediately reduces their Scope 3 supply chain audit risk, shortens their traceability chain, and strengthens their CSRD disclosure. This isn't marketing: it's procurement risk management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certification Map */}
          {insightTab === 'certs' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {CERTIFICATIONS.map((cert, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: '#111118' }}>{cert.cert}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                        background: cert.tier === 'Essential' ? '#ECFDF5' : cert.tier === 'High Value' ? '#EFF6FF' : '#FFFBEB',
                        color: cert.tier === 'Essential' ? '#059669' : cert.tier === 'High Value' ? '#2563EB' : '#D97706',
                      }}>{cert.tier}</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{cert.full}</div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Buyer demand</span>
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
                  <strong style={{ color: '#111118' }}>Certification stack recommendation:</strong> Prioritize GOTS + OEKO-TEX 100 as table-stakes (required by ~90% of EU target accounts). Add GRS for recycled content by 2026 (EU Ecodesign mandate). Pursue bluesign for sportswear/outdoor segment entry (Adidas, Puma, Arc\'teryx). SA8000 opens US enterprise accounts requiring labour rights audits.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BD Outreach Roadmap */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111118' }}>
            BD Outreach Roadmap <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>— recommended sequencing for 2026</span>
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBEBF0' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9F9FB', borderBottom: '1px solid #EBEBF0' }}>
                  {['#', 'Segment', 'Accounts', 'Contacts in DB', 'Angle', 'Signal', 'Timing'].map(h => (
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
                    <td className="px-5 py-3 text-sm" style={{ color: '#374151' }}>{row.contacts} contacts</td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#6B7280', maxWidth: 200 }}>{row.angle}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase" style={{
                        background: row.signal === 'hot' ? '#ECFDF5' : row.signal === 'medium' ? '#FFFBEB' : '#EFF6FF',
                        color: row.signal === 'hot' ? '#059669' : row.signal === 'medium' ? '#D97706' : '#2563EB',
                      }}>{row.signal}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: '#111118' }}>{row.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade Show Calendar */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#111118' }}>
            Trade Show Calendar <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>— where your buyers scout suppliers</span>
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {TRADE_SHOWS.map((show, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: '#111118' }}>{show.show}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{
                    background: show.relevance === 'Top-tier' ? '#ECFDF5' : show.relevance === 'High' ? '#EFF6FF' : show.relevance === 'BD Tool' ? '#FEF3C7' : '#F4F4F8',
                    color: show.relevance === 'Top-tier' ? '#059669' : show.relevance === 'High' ? '#2563EB' : show.relevance === 'BD Tool' ? '#D97706' : '#6B7280',
                  }}>{show.relevance}</span>
                </div>
                <div className="text-[10px] mb-1" style={{ color: '#9CA3AF' }}>{show.city} · {show.date}</div>
                <div className="text-[10px] font-medium mb-2" style={{ color: '#6B7280' }}>{show.focus}</div>
                <p className="text-[10px] leading-relaxed" style={{ color: '#9CA3AF' }}>{show.why}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-xl p-6" style={{ background: '#111118', border: '1px solid #1E1E2A' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#059669' }}>
              <Zap size={18} style={{ color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold mb-1" style={{ color: '#F4F4F8' }}>Start With Your 40 Contacts</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B6B80' }}>
                You already have VP and Director-level sourcing contacts at Adidas, H&M, PVH, Tapestry, and Inditex-adjacent brands. These are the people who approve supplier lists. The next step is a personalized outreach campaign referencing each brand's published sustainability commitments, lead time pain points, or their European sourcing strategy. Revenue Precision can build and deploy that campaign.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors hover:opacity-90" style={{ background: '#059669', color: '#FFFFFF' }}>
              Go to Contacts <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
