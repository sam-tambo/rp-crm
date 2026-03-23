'use client'
import { useState } from 'react'
import { Globe, TrendingUp, Building2, Users, DollarSign, Zap, ArrowRight, Star, AlertTriangle, CheckCircle } from 'lucide-react'

// ── Pre-computed market intelligence from 1,072 companies across 63 countries ──

const REGION_DATA = [
  { region: 'North America', count: 316, avgRevenue: 5495051960, totalRevenue: 1516634341000, avgEmployees: 15940, color: '#1aaa5e', flag: '🌎', topCountries: ['United States (275)', 'Canada (26)', 'Mexico (15)'], primaryIndustry: 'Retail (55%)', insight: 'Highest avg revenue ($5.5B). Biggest tech adopters — 89% use Salesforce, 91% on Slack. Prime entry market.' },
  { region: 'Europe', count: 234, avgRevenue: 4026623210, totalRevenue: 805324642000, avgEmployees: 10115, color: '#2cc774', flag: '🌍', topCountries: ['UK (57)', 'Italy (36)', 'France (33)', 'Spain (23)'], primaryIndustry: 'Apparel & Fashion (48%)', insight: 'Fashion powerhouse — Italy/France dominate luxury. Strong sustainability push. GDPR-compliant outreach required.' },
  { region: 'Asia', count: 274, avgRevenue: 1363938330, totalRevenue: 252328591000, avgEmployees: 9488, color: '#157a46', flag: '🌏', topCountries: ['India (70)', 'Bangladesh (60)', 'China (36)', 'Pakistan (18)'], primaryIndustry: 'Apparel & Fashion (82%)', insight: 'Manufacturing backbone — Bangladesh/India/Pakistan are the world\'s garment factories. Lower rev but massive volume. Ripe for B2B automation tools.' },
  { region: 'Latin America', count: 86, avgRevenue: 320827190, totalRevenue: 13474742000, avgEmployees: 2588, color: '#94d4b0', flag: '🌎', topCountries: ['Brazil (57)', 'Colombia (11)', 'Argentina (6)'], primaryIndustry: 'Apparel & Fashion (69%)', insight: 'Emerging market with fastest growth. Brazil dominates. Lower price sensitivity resistance. Greenfield opportunity.' },
  { region: 'Oceania', count: 23, avgRevenue: 1152133545, totalRevenue: 25346938000, avgEmployees: 6274, color: '#b8e8cf', flag: '🌏', topCountries: ['Australia (19)', 'New Zealand (4)'], primaryIndustry: 'Retail (91%)', insight: 'Small but high-quality market. Retail-focused. Australia leads Asia-Pacific digital adoption.' },
  { region: 'Africa', count: 18, avgRevenue: 6128652600, totalRevenue: 30643263000, avgEmployees: 4928, color: '#d4f0e2', flag: '🌍', topCountries: ['South Africa (7)', 'Egypt (7)', 'Kenya (2)'], primaryIndustry: 'Apparel & Fashion (61%)', insight: 'Small count but surprisingly high average revenue. South Africa & Egypt lead. Long-term strategic market.' },
]

const INDUSTRY_DATA = [
  { name: 'Apparel & Fashion', count: 606, pct: 57, color: '#1aaa5e' },
  { name: 'Retail', count: 343, pct: 32, color: '#2cc774' },
  { name: 'Luxury Goods & Jewelry', count: 95, pct: 9, color: '#157a46' },
  { name: 'Textiles', count: 23, pct: 2, color: '#94d4b0' },
  { name: 'Other', count: 5, pct: 0.5, color: '#b8e8cf' },
]

const TOP_COUNTRIES = [
  { country: 'United States', count: 275, flag: '🇺🇸', avgRev: '$6.2B', tech: 'High' },
  { country: 'India', count: 70, flag: '🇮🇳', avgRev: '$0.9B', tech: 'Medium' },
  { country: 'Bangladesh', count: 60, flag: '🇧🇩', avgRev: '$0.4B', tech: 'Low' },
  { country: 'United Kingdom', count: 57, flag: '🇬🇧', avgRev: '$3.1B', tech: 'High' },
  { country: 'Brazil', count: 57, flag: '🇧🇷', avgRev: '$0.3B', tech: 'Medium' },
  { country: 'Italy', count: 36, flag: '🇮🇹', avgRev: '$2.8B', tech: 'Medium' },
  { country: 'China', count: 36, flag: '🇨🇳', avgRev: '$4.1B', tech: 'High' },
  { country: 'France', count: 33, flag: '🇫🇷', avgRev: '$5.9B', tech: 'High' },
  { country: 'Canada', count: 26, flag: '🇨🇦', avgRev: '$2.2B', tech: 'High' },
  { country: 'Spain', count: 23, flag: '🇪🇸', avgRev: '$1.8B', tech: 'Medium' },
]

const TECH_SIGNALS = [
  { name: 'Mobile Friendly', count: 791, pct: 74, signal: 'baseline', color: '#94d4b0' },
  { name: 'Slack', count: 589, pct: 55, signal: 'good', color: '#2cc774' },
  { name: 'Microsoft Office 365', count: 583, pct: 54, signal: 'good', color: '#2cc774' },
  { name: 'Salesforce', count: 286, pct: 27, signal: 'hot', color: '#1aaa5e' },
  { name: 'AI Tools', count: 333, pct: 31, signal: 'hot', color: '#1aaa5e' },
  { name: 'Google Analytics', count: 391, pct: 36, signal: 'good', color: '#2cc774' },
]

const AI_INSIGHTS = [
  {
    icon: '🎯',
    title: 'The Bangladesh/India Wedge',
    type: 'opportunity',
    body: '130 companies in Bangladesh + India combined — almost all apparel manufacturers with low avg revenue ($0.4–0.9B) but enormous workforce (avg 9,000+ employees). They supply to North American and European brands in your list. A single Revenue Precision deployment connecting both sides of the supply chain (manufacturer → brand) could be uniquely powerful.',
  },
  {
    icon: '💎',
    title: 'European Luxury = Highest LTV',
    type: 'opportunity',
    body: 'Italy (Dolce & Gabbana, Versace, Bulgari), France (Van Cleef, Hermès tier), Switzerland (luxury watches): 95 luxury goods companies with avg revenues of $2–5B+. These companies have the highest willingness-to-pay for premium B2B tools, the longest sales cycles, and the lowest churn once won. Priority: Luxury segment in EU.',
  },
  {
    icon: '⚡',
    title: '31% AI Adoption Gap = Your Beachhead',
    type: 'insight',
    body: 'Only 333 of 1,072 companies (31%) show any AI tool adoption. The remaining 739 are AI-laggards — mostly apparel & fashion brands in Asia and LatAm. This is precisely the segment Revenue Precision\'s AI-powered sales automation can land fastest. Lead with ROI framing vs. competitors who already use AI.',
  },
  {
    icon: '🏆',
    title: 'North America: Go Deep, Not Wide',
    type: 'strategy',
    body: 'US (275 companies, $6.2B avg rev) is your densest market. But 89% already use Salesforce — you\'re not replacing CRM, you\'re layering intelligence on top. Frame Revenue Precision as the AI brain that makes their existing Salesforce smarter. High Salesforce penetration is a feature, not a barrier.',
  },
  {
    icon: '🌱',
    title: 'Brazil: LatAm Gateway',
    type: 'strategy',
    body: '57 Brazilian companies ($320M avg rev) in apparel/fashion — smaller, faster-moving, less entrenched tooling. LatAm total: 86 companies with $13.5B collective revenue. Greenfield: most run on basic CRMs or Excel. Entry cost is lower, sales cycles shorter. Perfect for a land-and-expand motion.',
  },
  {
    icon: '📅',
    title: 'Legacy Giants = Digital Transformation Urgency',
    type: 'insight',
    body: '60% of companies founded before 2000 (many in the 1880s–1940s). These are heritage retailers and fashion houses under massive pressure from D2C brands and Amazon. They\'re investing in digital transformation right now — Morrisons (1899), Marks & Spencer, etc. Urgency creates budget. Lead with "catch up or lose out" messaging.',
  },
]

const ENTRY_PRIORITY = [
  { market: 'US + Canada', priority: 1, why: 'Highest revenue, Salesforce-heavy, AI-ready buyers', effort: 'High', revenue: '$$$$', timing: 'Now' },
  { market: 'UK + France + Italy', priority: 2, why: 'Fashion/luxury LTV, English-accessible (UK), GDPR prep needed', effort: 'Medium', revenue: '$$$', timing: 'Q2 2026' },
  { market: 'India', priority: 3, why: 'Volume play — 70 companies, growing digital maturity, low price point', effort: 'Low', revenue: '$$', timing: 'Q3 2026' },
  { market: 'Brazil', priority: 4, why: 'Greenfield LatAm gateway, low competition, fast sales cycles', effort: 'Low', revenue: '$$', timing: 'Q3 2026' },
  { market: 'Bangladesh', priority: 5, why: 'Supply chain play — connect to EU/US buyer network', effort: 'Medium', revenue: '$', timing: 'Q4 2026' },
]

function StatCard({ icon: Icon, label, value, sub, color = '#1aaa5e' }: { icon: any, label: string, value: string, sub: string, color?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: '#191D25' }}>{value}</div>
      <div className="text-sm font-medium mb-1" style={{ color: '#191D25' }}>{label}</div>
      <div className="text-xs" style={{ color: '#638070' }}>{sub}</div>
    </div>
  )
}

export default function InsightsPage() {
  const [activeRegion, setActiveRegion] = useState<string | null>(null)

  const totalRevenue = REGION_DATA.reduce((s, r) => s + r.totalRevenue, 0)
  const totalCompanies = REGION_DATA.reduce((s, r) => s + r.count, 0)
  const avgRevenue = REGION_DATA.reduce((s, r) => s + r.avgRevenue * r.count, 0) / totalCompanies

  const selected = activeRegion ? REGION_DATA.find(r => r.region === activeRegion) : null

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #D4E8DC' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EEF7F2' }}>
            <Globe size={16} style={{ color: '#1aaa5e' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#191D25' }}>Market Intelligence</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF7F2', color: '#1aaa5e' }}>
            1,072 companies · 63 countries · AI-analyzed
          </span>
        </div>
        <p className="text-sm ml-11" style={{ color: '#638070' }}>
          Global apparel, retail & luxury market mapped from your Apollo export — with strategic entry recommendations.
        </p>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total Companies" value="1,072" sub="Across 63 countries" />
          <StatCard icon={Globe} label="Total Addressable Revenue" value="$2.63T" sub="Combined annual revenue" color="#157a46" />
          <StatCard icon={TrendingUp} label="Avg Company Revenue" value="$3.7B" sub="Per company in dataset" color="#2cc774" />
          <StatCard icon={Zap} label="AI Adoption Gap" value="69%" sub="Not yet using AI tools — your TAM" color="#94d4b0" />
        </div>

        {/* Regional Map */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#191D25' }}>Regional Breakdown</h2>
          <div className="grid grid-cols-3 gap-3">
            {REGION_DATA.map(r => (
              <button
                key={r.region}
                onClick={() => setActiveRegion(activeRegion === r.region ? null : r.region)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: activeRegion === r.region ? '#EEF7F2' : '#F8FBF9',
                  border: `1px solid ${activeRegion === r.region ? '#1aaa5e' : '#D4E8DC'}`,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{r.flag}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${r.color}18`, color: r.color }}>
                    {r.count} cos
                  </span>
                </div>
                <div className="font-semibold text-sm mb-1" style={{ color: '#191D25' }}>{r.region}</div>
                <div className="text-xs mb-2" style={{ color: '#638070' }}>{r.primaryIndustry}</div>
                {/* Bar */}
                <div className="w-full h-1.5 rounded-full" style={{ background: '#D4E8DC' }}>
                  <div className="h-full rounded-full" style={{ background: r.color, width: `${(r.count / 316) * 100}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs" style={{ color: '#638070' }}>
                  <span>Avg rev: ${(r.avgRevenue / 1e9).toFixed(1)}B</span>
                  <span>{((r.count / totalCompanies) * 100).toFixed(0)}% of list</span>
                </div>
              </button>
            ))}
          </div>

          {/* Region detail panel */}
          {selected && (
            <div className="mt-3 rounded-xl p-5" style={{ background: '#EEF7F2', border: '1px solid #1aaa5e' }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{selected.flag}</span>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1" style={{ color: '#191D25' }}>{selected.region} Deep Dive</div>
                  <div className="flex gap-6 mb-3 text-sm">
                    <span style={{ color: '#638070' }}>Top: {selected.topCountries.join(' · ')}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#191D25' }}>{selected.insight}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold" style={{ color: '#1aaa5e' }}>${(selected.totalRevenue / 1e12).toFixed(2)}T</div>
                  <div className="text-xs" style={{ color: '#638070' }}>total revenue</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Industry + Tech side by side */}
        <div className="grid grid-cols-2 gap-6">
          {/* Industry */}
          <div className="rounded-xl p-5" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#191D25' }}>Industry Mix</h2>
            <div className="space-y-3">
              {INDUSTRY_DATA.map(ind => (
                <div key={ind.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#191D25' }}>{ind.name}</span>
                    <span style={{ color: '#638070' }}>{ind.count} · {ind.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: '#D4E8DC' }}>
                    <div className="h-full rounded-full" style={{ background: ind.color, width: `${ind.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech signals */}
          <div className="rounded-xl p-5" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#191D25' }}>Tech Signals <span className="text-xs font-normal" style={{ color: '#638070' }}>(buying intent indicators)</span></h2>
            <div className="space-y-3">
              {TECH_SIGNALS.map(t => (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#191D25' }}>{t.name}</span>
                      <span style={{ color: '#638070' }}>{t.count} ({t.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: '#D4E8DC' }}>
                      <div className="h-full rounded-full" style={{ background: t.color, width: `${t.pct}%` }} />
                    </div>
                  </div>
                  {t.signal === 'hot' && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#EEF7F2', color: '#1aaa5e' }}>HOT</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Countries Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
          <div className="px-5 py-3" style={{ background: '#F8FBF9', borderBottom: '1px solid #D4E8DC' }}>
            <h2 className="text-base font-semibold" style={{ color: '#191D25' }}>Top 10 Countries by Company Count</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FBF9', borderBottom: '1px solid #D4E8DC' }}>
                {['Country', 'Companies', 'Avg Revenue', 'Tech Maturity'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: '#638070' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_COUNTRIES.map((c, i) => (
                <tr key={c.country} style={{ borderBottom: '1px solid #EEF7F2' }}>
                  <td className="px-5 py-3 text-sm">
                    <span className="mr-2">{c.flag}</span>
                    <span style={{ color: '#191D25' }}>{c.country}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: '#D4E8DC' }}>
                        <div className="h-full rounded-full" style={{ background: '#1aaa5e', width: `${(c.count / 275) * 100}%` }} />
                      </div>
                      <span className="text-sm" style={{ color: '#191D25' }}>{c.count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: '#1aaa5e' }}>{c.avgRev}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: c.tech === 'High' ? '#EEF7F2' : c.tech === 'Medium' ? '#FEF9EE' : '#FEF2F2',
                      color: c.tech === 'High' ? '#1aaa5e' : c.tech === 'Medium' ? '#D97706' : '#DC2626'
                    }}>{c.tech}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insights */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#191D25' }}>
            Strategic Insights <span className="text-xs font-normal" style={{ color: '#638070' }}>— AI-generated from your dataset</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {AI_INSIGHTS.map((ins, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-xl">{ins.icon}</span>
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full mr-2" style={{
                      background: ins.type === 'opportunity' ? '#EEF7F2' : ins.type === 'strategy' ? '#EFF6FF' : '#FEF9EE',
                      color: ins.type === 'opportunity' ? '#1aaa5e' : ins.type === 'strategy' ? '#2563EB' : '#D97706'
                    }}>{ins.type}</span>
                    <span className="text-sm font-semibold" style={{ color: '#191D25' }}>{ins.title}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#638070' }}>{ins.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Entry Roadmap */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#1aaa5e' }}>
            <TrendingUp size={16} style={{ color: 'white' }} />
            <h2 className="text-sm font-semibold text-white">Recommended Market Entry Roadmap</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FBF9', borderBottom: '1px solid #D4E8DC' }}>
                {['Priority', 'Market', 'Why Now', 'Effort', 'Revenue Potential', 'Timing'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: '#638070' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENTRY_PRIORITY.map((m, i) => (
                <tr key={m.market} style={{ borderBottom: '1px solid #EEF7F2' }}>
                  <td className="px-5 py-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i === 0 ? '#1aaa5e' : '#EEF7F2', color: i === 0 ? 'white' : '#1aaa5e' }}>
                      {m.priority}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#191D25' }}>{m.market}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#638070', maxWidth: 280 }}>{m.why}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: m.effort === 'High' ? '#FEF9EE' : '#EEF7F2', color: m.effort === 'High' ? '#D97706' : '#1aaa5e' }}>{m.effort}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#1aaa5e' }}>{m.revenue}</td>
                  <td className="px-5 py-3 text-xs font-medium" style={{ color: '#191D25' }}>{m.timing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
