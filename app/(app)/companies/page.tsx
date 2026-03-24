'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Building2, ChevronDown, ChevronRight,
  Globe, Mail, SlidersHorizontal, X,
  ArrowUpDown, ArrowUp, ArrowDown, Star, ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'
import QuickCreateModal from '@/components/crm/QuickCreateModal'
import { LinkedInIcon } from '@/components/ui/linkedin-icon'

const fmt = (n: number | null) => {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}
const fmtEmp = (n: number | null) => {
  if (!n) return '—'
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return String(n)
}
const COUNTRY_FLAGS: Record<string, string> = {
  'United States':'🇺🇸','United Kingdom':'🇬🇧','France':'🇫🇷','Germany':'🇩🇪','Italy':'🇮🇹',
  'Spain':'🇪🇸','Portugal':'🇵🇹','Australia':'🇦🇺','Canada':'🇨🇦','China':'🇨🇳',
  'Japan':'🇯🇵','India':'🇮🇳','Brazil':'🇧🇷','Netherlands':'🇳🇱','Sweden':'🇸🇪',
  'Denmark':'🇩🇰','Switzerland':'🇨🇭','Norway':'🇳🇴','Belgium':'🇧🇪','Poland':'🇵🇱',
  'Turkey':'🇹🇷','South Korea':'🇰🇷','Singapore':'🇸🇬','Hong Kong':'🇭🇰',
  'United Arab Emirates':'🇦🇪','Saudi Arabia':'🇸🇦','South Africa':'🇿🇦','Mexico':'🇲🇽',
  'Argentina':'🇦🇷','Indonesia':'🇮🇩','Bangladesh':'🇧🇩','Pakistan':'🇵🇰',
  'Vietnam':'🇻🇳','Thailand':'🇹🇭','Malaysia':'🇲🇾','Philippines':'🇵🇭',
  'Egypt':'🇪🇬','Morocco':'🇲🇦','Nigeria':'🇳🇬','Kenya':'🇰🇪','Israel':'🇮🇱',
  'Ireland':'🇮🇪','Finland':'🇫🇮','Austria':'🇦🇹','Czech Republic':'🇨🇿',
  'Romania':'🇷🇴','Greece':'🇬🇷','Hungary':'🇭🇺','Colombia':'🇨🇴','Chile':'🇨🇱',
  'New Zealand':'🇳🇿','Sri Lanka':'🇱🇰','Myanmar':'🇲🇲','Belarus':'🇧🇾',
}
const cflag = (c: string | null) => (c && COUNTRY_FLAGS[c]) ? `${COUNTRY_FLAGS[c]} ` : '🌐 '

const AVATAR_COLORS = [
  ['#d1fae5','#065f46'],['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],
  ['#fef3c7','#92400e'],['#ede9fe','#5b21b6'],['#fee2e2','#991b1b'],
  ['#e0e7ff','#3730a3'],['#fdf4ff','#7e22ce'],['#ecfdf5','#166534'],
  ['#fff7ed','#9a3412'],['#f0fdf4','#14532d'],['#fef9c3','#854d0e'],
]
const avatarColor = (name: string) => {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function CompanyAvatar({ name, logoUrl, size = 32 }: { name: string; logoUrl: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  const [bg, tx] = avatarColor(name)
  if (logoUrl && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 8, background: '#FFFFFF', border: '1px solid #E4E4EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        <img src={logoUrl} alt={name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: bg, color: tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.4), fontWeight: 700, flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function fitScore(c: Company) {
  let s = 0
  const hi = ['luxury goods','apparel','retail','fashion','textiles','jewelry']
  if (c.industry && hi.some(k => c.industry!.toLowerCase().includes(k))) s += 30
  const e = c.employee_count ?? 0
  s += e >= 20000 ? 25 : e >= 5000 ? 22 : e >= 1000 ? 18 : e >= 500 ? 12 : e > 0 ? 5 : 0
  const r = c.annual_revenue ?? 0
  s += r >= 1e9 ? 30 : r >= 1e8 ? 22 : r >= 1e7 ? 14 : r > 0 ? 6 : 0
  if (c.linkedin_url) s += 5; if (c.website) s += 5; if (c.description) s += 5
  if (s >= 70) return { label:'Excellent', score:s, color:'#065f46', bg:'#d1fae5' }
  if (s >= 45) return { label:'Good', score:s, color:'#059669', bg:'#F0FDF4' }
  if (s >= 25) return { label:'Fair', score:s, color:'#b45309', bg:'#fef3c7' }
  return { label:'Low', score:s, color:'#6b7280', bg:'#f9fafb' }
}

type SF = 'name'|'employees'|'revenue'|'country'|'industry'|'score'

interface Filters { industries: string[]; countries: string[]; empRange: string; revRange: string; statuses: string[] }

function ColSec({ title, open, onToggle, children }: { title:string; open:boolean; onToggle:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ borderBottom:'1px solid #EBEBF0' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#6B7280' }}>{title}</span>
        {open ? <ChevronDown size={11} style={{ color:'#9CA3AF' }}/> : <ChevronRight size={11} style={{ color:'#9CA3AF' }}/>}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

function FCheck({ label, count, checked, onChange }: { label:string; count?:number; checked:boolean; onChange:()=>void }) {
  return (
    <label className="flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-gray-50 transition-colors">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-green-600 w-3 h-3 flex-shrink-0"/>
      <span className="flex-1 text-xs truncate" style={{ color:'#374151' }}>{label}</span>
      {count !== undefined && <span className="text-xs px-1.5 rounded-full font-medium" style={{ background:'#F0FDF4', color:'#6B7280' }}>{count}</span>}
    </label>
  )
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [openSections, setOpenSections] = useState({ industry:true, country:false, employees:false, revenue:false, status:false })
  const [filters, setFilters] = useState<Filters>({ industries:[], countries:[], empRange:'', revRange:'', statuses:[] })
  const [activeTab, setActiveTab] = useState<'all'|'prospect'|'active'|'partner'>('all')
  const [sort, setSort] = useState<{ field:SF; dir:'asc'|'desc' }>({ field:'score', dir:'desc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string|null>(null)
  const [page, setPage] = useState(1)
  const PER = 50
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending:false })
    setCompanies(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const allInd = [...new Set(companies.map(c => c.industry).filter(Boolean) as string[])].sort()
  const allCo = [...new Set(companies.map(c => c.country).filter(Boolean) as string[])].sort()
  const indCnt = Object.fromEntries(allInd.map(i => [i, companies.filter(c => c.industry===i).length]))
  const coCnt = Object.fromEntries(allCo.map(c => [c, companies.filter(x => x.country===c).length]))

  const EMP_BUCKETS = [
    { l:'< 500', v:'lt500' }, { l:'500–1K', v:'500k' }, { l:'1K–5K', v:'1k5k' },
    { l:'5K–20K', v:'5k20k' }, { l:'20K+', v:'gt20k' }
  ]
  const REV_BUCKETS = [
    { l:'< $10M', v:'lt10m' }, { l:'$10M–$100M', v:'10m100m' },
    { l:'$100M–$1B', v:'100m1b' }, { l:'> $1B', v:'gt1b' }
  ]

  const matchEmp = (c:Company, v:string) => {
    const e = c.employee_count??0
    if (v==='lt500') return e<500; if (v==='500k') return e>=500&&e<1000
    if (v==='1k5k') return e>=1000&&e<5000; if (v==='5k20k') return e>=5000&&e<20000
    if (v==='gt20k') return e>=20000; return true
  }
  const matchRev = (c:Company, v:string) => {
    const r = c.annual_revenue??0
    if (v==='lt10m') return r<1e7; if (v==='10m100m') return r>=1e7&&r<1e8
    if (v==='100m1b') return r>=1e8&&r<1e9; if (v==='gt1b') return r>=1e9; return true
  }

  const filtered = companies.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !(c.domain??'').toLowerCase().includes(q) &&
        !(c.industry??'').toLowerCase().includes(q) && !(c.country??'').toLowerCase().includes(q)) return false
    if (activeTab==='prospect' && c.status!=='prospect') return false
    if (activeTab==='active' && c.status!=='active') return false
    if (activeTab==='partner' && c.status!=='partner') return false
    if (filters.industries.length && !filters.industries.includes(c.industry??'')) return false
    if (filters.countries.length && !filters.countries.includes(c.country??'')) return false
    if (filters.empRange && !matchEmp(c, filters.empRange)) return false
    if (filters.revRange && !matchRev(c, filters.revRange)) return false
    if (filters.statuses.length && !filters.statuses.includes(c.status)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const d = sort.dir==='asc' ? 1 : -1
    if (sort.field==='name') return d*a.name.localeCompare(b.name)
    if (sort.field==='employees') return d*((a.employee_count??0)-(b.employee_count??0))
    if (sort.field==='revenue') return d*((a.annual_revenue??0)-(b.annual_revenue??0))
    if (sort.field==='country') return d*(a.country??'').localeCompare(b.country??'')
    if (sort.field==='industry') return d*(a.industry??'').localeCompare(b.industry??'')
    if (sort.field==='score') return d*(fitScore(a).score-fitScore(b).score)
    return 0
  })

  const total = sorted.length
  const totalPages = Math.ceil(total/PER)
  const rows = sorted.slice((page-1)*PER, page*PER)

  const toggleSort = (f:SF) => { setSort(s => s.field===f ? { field:f, dir:s.dir==='asc'?'desc':'asc' } : { field:f, dir:'desc' }); setPage(1) }
  const toggleSec = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]:!s[k] }))
  const toggleInd = (v:string) => { setFilters(f => ({ ...f, industries: f.industries.includes(v)?f.industries.filter(x=>x!==v):[...f.industries,v] })); setPage(1) }
  const toggleCo = (v:string) => { setFilters(f => ({ ...f, countries: f.countries.includes(v)?f.countries.filter(x=>x!==v):[...f.countries,v] })); setPage(1) }
  const toggleSt = (v:string) => { setFilters(f => ({ ...f, statuses: f.statuses.includes(v)?f.statuses.filter(x=>x!==v):[...f.statuses,v] })); setPage(1) }
  const clearAll = () => { setFilters({ industries:[], countries:[], empRange:'', revRange:'', statuses:[] }); setSearch(''); setActiveTab('all'); setPage(1) }
  const hasFilters = filters.industries.length||filters.countries.length||filters.empRange||filters.revRange||filters.statuses.length

  const SIcon = ({ f }: { f:SF }) => sort.field===f
    ? sort.dir==='asc' ? <ArrowUp size={10} style={{ color:'#059669', marginLeft:2 }}/> : <ArrowDown size={10} style={{ color:'#059669', marginLeft:2 }}/>
    : <ArrowUpDown size={10} style={{ color:'#C8C8D8', marginLeft:2 }}/>

  const tabCount = { all:companies.length, prospect:companies.filter(c=>c.status==='prospect').length, active:companies.filter(c=>c.status==='active').length, partner:companies.filter(c=>c.status==='partner').length }

  return (
    <div className="flex flex-col" style={{ height:'100%', background:'#F9F9FB' }}>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:'1px solid #EBEBF0', background:'#fff', flexShrink:0 }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold" style={{ color:'#111118' }}>Find companies</h1>
          {/* Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background:'#F4F4F8' }}>
            {(['all','prospect','active','partner'] as const).map(t => (
              <button key={t} onClick={() => { setActiveTab(t); setPage(1) }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={activeTab===t ? { background:'#fff', color:'#111118', boxShadow:'0 1px 2px rgba(0,0,0,0.08)' } : { color:'#6B7280' }}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={activeTab===t ? { background:'#F0FDF4', color:'#059669' } : { background:'#EBEBF0', color:'#9CA3AF' }}>
                  {tabCount[t].toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all"
            style={filtersOpen ? { background:'#F0FDF4', color:'#059669', borderColor:'#D1FAE5' } : { background:'#fff', color:'#6B7280', borderColor:'#E4E4EB' }}>
            <SlidersHorizontal size={12}/>
            {filtersOpen ? 'Hide Filters' : 'Filters'}
            {!!hasFilters && <span className="ml-0.5 px-1 rounded-full text-xs" style={{ background:'#059669', color:'#fff' }}>
              {Number(filters.industries.length)+Number(filters.countries.length)+(filters.empRange?1:0)+(filters.revRange?1:0)+Number(filters.statuses.length)}
            </span>}
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background:'#059669', color:'#fff' }}>
            <Plus size={13}/> New Company
          </button>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ flex:1 }}>
        {/* ── Left filter panel ───────────────────────────────── */}
        {filtersOpen && (
          <div style={{ width:240, flexShrink:0, background:'#fff', borderRight:'1px solid #EBEBF0', overflowY:'auto' }}>
            {/* Search */}
            <div className="p-3" style={{ borderBottom:'1px solid #EBEBF0' }}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'#9CA3AF' }}/>
                <input className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none"
                  style={{ background:'#F9F9FB', border:'1px solid #E4E4EB', color:'#111118' }}
                  placeholder="Search companies..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}/>
              </div>
              {!!hasFilters && (
                <button onClick={clearAll} className="mt-2 w-full text-xs py-1 rounded"
                  style={{ color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca' }}>
                  Reset all · {Number(filters.industries.length)+Number(filters.countries.length)+(filters.empRange?1:0)+(filters.revRange?1:0)+Number(filters.statuses.length)} active
                </button>
              )}
            </div>

            {/* Filter chips */}
            {(filters.industries.length > 0 || filters.countries.length > 0) && (
              <div className="px-3 py-2 flex flex-wrap gap-1" style={{ borderBottom:'1px solid #EBEBF0' }}>
                {filters.industries.map(i => (
                  <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background:'#F0FDF4', color:'#059669' }}>
                    {i.length>14?i.slice(0,12)+'…':i}
                    <button onClick={() => toggleInd(i)}><X size={9}/></button>
                  </span>
                ))}
                {filters.countries.map(c => (
                  <span key={c} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background:'#F0FDF4', color:'#059669' }}>
                    {cflag(c)}{c.length>10?c.slice(0,8)+'…':c}
                    <button onClick={() => toggleCo(c)}><X size={9}/></button>
                  </span>
                ))}
              </div>
            )}

            <ColSec title="Industry" open={openSections.industry} onToggle={() => toggleSec('industry')}>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {allInd.map(i => <FCheck key={i} label={i} count={indCnt[i]} checked={filters.industries.includes(i)} onChange={() => toggleInd(i)}/>)}
              </div>
            </ColSec>
            <ColSec title="Country" open={openSections.country} onToggle={() => toggleSec('country')}>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {allCo.filter(c => (coCnt[c]??0)>=3).map(c => <FCheck key={c} label={`${cflag(c)}${c}`} count={coCnt[c]} checked={filters.countries.includes(c)} onChange={() => toggleCo(c)}/>)}
              </div>
            </ColSec>
            <ColSec title="Employee range" open={openSections.employees} onToggle={() => toggleSec('employees')}>
              {EMP_BUCKETS.map(b => (
                <label key={b.v} className="flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="emp" checked={filters.empRange===b.v} className="accent-green-600 w-3 h-3"
                    onChange={() => { setFilters(f => ({ ...f, empRange:f.empRange===b.v?'':b.v })); setPage(1) }}/>
                  <span className="text-xs" style={{ color:'#374151' }}>{b.l}</span>
                </label>
              ))}
            </ColSec>
            <ColSec title="Revenue" open={openSections.revenue} onToggle={() => toggleSec('revenue')}>
              {REV_BUCKETS.map(b => (
                <label key={b.v} className="flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="rev" checked={filters.revRange===b.v} className="accent-green-600 w-3 h-3"
                    onChange={() => { setFilters(f => ({ ...f, revRange:f.revRange===b.v?'':b.v })); setPage(1) }}/>
                  <span className="text-xs" style={{ color:'#374151' }}>{b.l}</span>
                </label>
              ))}
            </ColSec>
            <ColSec title="Status" open={openSections.status} onToggle={() => toggleSec('status')}>
              {(['prospect','active','partner','churned'] as const).map(s => (
                <FCheck key={s} label={s.charAt(0).toUpperCase()+s.slice(1)}
                  count={companies.filter(c=>c.status===s).length}
                  checked={filters.statuses.includes(s)} onChange={() => toggleSt(s)}/>
              ))}
            </ColSec>
          </div>
        )}

        {/* ── Main table ─────────────────────────────────────────── */}
        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
          {/* Sort/pagination bar */}
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom:'1px solid #EBEBF0', background:'#F9F9FB', flexShrink:0 }}>
            <div className="flex items-center gap-2">
              {sort.field!=='score' && (
                <span className="text-xs" style={{ color:'#9CA3AF' }}>
                  Sorted by <strong style={{ color:'#374151' }}>{sort.field}</strong> {sort.dir==='desc'?'↓':'↑'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color:'#9CA3AF' }}>
                {total===0?'0':((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of <strong style={{ color:'#374151' }}>{total.toLocaleString()}</strong>
              </span>
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{ border:'1px solid #E4E4EB', color:'#6B7280' }}>‹</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{ border:'1px solid #E4E4EB', color:'#6B7280' }}>›</button>
            </div>
          </div>

          {/* Bulk bar */}
          {selected.size>0 && (
            <div className="flex items-center gap-3 px-4 py-2" style={{ background:'#F0FDF4', borderBottom:'1px solid #D1FAE5', flexShrink:0 }}>
              <span className="text-xs font-semibold" style={{ color:'#059669' }}>{selected.size} selected</span>
              <button onClick={()=>setSelected(new Set())} className="text-xs" style={{ color:'#6B7280', textDecoration:'underline' }}>Deselect</button>
              <div style={{ flex:1 }}/>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ border:'1px solid #D1FAE5', color:'#374151', background:'#fff' }}>
                <Mail size={11}/> Email
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ border:'1px solid #D1FAE5', color:'#374151', background:'#fff' }}>
                <Star size={11}/> Tag
              </button>
            </div>
          )}

          {/* Table */}
          <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
            <thead>
              <tr style={{ background:'#F4F4F8', borderBottom:'2px solid #E4E4EB' }}>
                <th style={{ width:40, padding:'9px 8px 9px 16px' }}>
                  <input type="checkbox" className="accent-green-600 w-3.5 h-3.5"
                    checked={selected.size===rows.length&&rows.length>0} onChange={()=>selected.size===rows.length?setSelected(new Set()):setSelected(new Set(rows.map(c=>c.id)))}/>
                </th>
                {([['name','Company','left','33%'],['country','Country','left','11%'],['industry','Industry','left','13%'],['employees','Employees','right','9%'],['revenue','Revenue','right','10%'],['score','Fit Score','center','9%']] as const).map(([f,l,a,w])=>(
                  <th key={f} style={{ width:w, padding:'9px 12px', textAlign:a, cursor:'pointer', userSelect:'none' }} onClick={()=>toggleSort(f as SF)}>
                    <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide" style={{ color:sort.field===f?'#059669':'#9CA3AF', justifyContent:a==='right'?'flex-end':a==='center'?'center':'flex-start' }}>
                      {l}<SIcon f={f as SF}/>
                    </span>
                  </th>
                ))}
                <th style={{ width:'11%', padding:'9px 12px' }}><span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#9CA3AF' }}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:10}).map((_,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #F4F4F8' }}>
                  <td style={{ padding:'12px 8px 12px 16px' }}><div className="w-3.5 h-3.5 rounded animate-pulse" style={{ background:'#F0FDF4' }}/></td>
                  <td style={{ padding:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'#F0FDF4' }} className="animate-pulse flex-shrink-0"/>
                      <div><div style={{ height:13, width:120, borderRadius:4, background:'#F0FDF4', marginBottom:4 }} className="animate-pulse"/><div style={{ height:10, width:80, borderRadius:4, background:'#F4F4F8' }} className="animate-pulse"/></div>
                    </div>
                  </td>
                  {[80,90,50,60,55,80].map((w,j)=>(
                    <td key={j} style={{ padding:'12px', textAlign:j>=2?'right':j===4?'center':'left' }}>
                      <div style={{ height:12, width:w, borderRadius:4, background:'#F4F4F8', marginLeft:j>=2?'auto':0 }} className="animate-pulse"/>
                    </td>
                  ))}
                </tr>
              )) : rows.length===0 ? (
                <tr><td colSpan={8} style={{ padding:'60px 16px', textAlign:'center' }}>
                  <Building2 size={32} style={{ margin:'0 auto 12px', color:'#C8C8D8', opacity:0.6 }}/>
                  <p style={{ color:'#374151', fontWeight:500, fontSize:14, marginBottom:4 }}>No companies found</p>
                  <p style={{ color:'#9CA3AF', fontSize:12, marginBottom:16 }}>Try adjusting your filters</p>
                  <button onClick={clearAll} style={{ background:'#059669', color:'#fff', padding:'8px 20px', borderRadius:8, fontSize:13 }}>Clear filters</button>
                </td></tr>
              ) : rows.map(c => {
                const sc = fitScore(c)
                const hov = hoveredId===c.id
                const sel = selected.has(c.id)
                return (
                  <tr key={c.id} onMouseEnter={()=>setHoveredId(c.id)} onMouseLeave={()=>setHoveredId(null)}
                    style={{ borderBottom:'1px solid #F4F4F8', background: sel?'#F0FDF4':hov?'#FAFAFA':'#fff', transition:'background 0.1s', cursor:'pointer' }}>
                    {/* Checkbox */}
                    <td style={{ padding:'10px 8px 10px 16px', width:40 }} onClick={e=>{e.stopPropagation();setSelected(s=>{const ns=new Set(s);ns.has(c.id)?ns.delete(c.id):ns.add(c.id);return ns})}}>
                      <input type="checkbox" checked={sel} onChange={()=>{}} className="accent-green-600 w-3.5 h-3.5"/>
                    </td>
                    {/* Company */}
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <CompanyAvatar name={c.name} logoUrl={(c as any).logo_url ?? null} size={32} />
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:'#111118', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                          {c.domain && <div style={{ fontSize:11, color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.domain}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Country */}
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      <span style={{ fontSize:12, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
                        {c.country ? <><span>{cflag(c.country)}</span><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:90 }}>{c.country}</span></> : <span style={{ color:'#D1D5DB' }}>—</span>}
                      </span>
                    </td>
                    {/* Industry */}
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      {c.industry
                        ? <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:500, background:'#F0FDF4', color:'#059669', whiteSpace:'nowrap', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis' }}>
                            {c.industry}
                          </span>
                        : <span style={{ color:'#D1D5DB' }}>—</span>}
                    </td>
                    {/* Employees */}
                    <td style={{ padding:'10px 12px', textAlign:'right' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      <span style={{ fontSize:13, fontWeight:500, color:c.employee_count?'#374151':'#D1D5DB' }}>{fmtEmp(c.employee_count)}</span>
                    </td>
                    {/* Revenue */}
                    <td style={{ padding:'10px 12px', textAlign:'right' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      <span style={{ fontSize:12, color:c.annual_revenue?'#374151':'#D1D5DB' }}>{fmt(c.annual_revenue)}</span>
                    </td>
                    {/* Score */}
                    <td style={{ padding:'10px 12px', textAlign:'center' }} onClick={()=>router.push(`/companies/${c.id}`)}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600, background:sc.bg, color:sc.color }}>
                        {sc.label} <strong>{sc.score}</strong>
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding:'10px 12px', width:100 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, opacity:hov?1:0, transition:'opacity 0.15s' }}>
                        {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-blue-50" title="LinkedIn">
                          <LinkedInIcon size={13} style={{ color:'#0A66C2' }}/>
                        </a>}
                        {c.website && <a href={c.website} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-gray-50" title="Website">
                          <Globe size={13} style={{ color:'#6B7280' }}/>
                        </a>}
                        <button onClick={e=>{e.stopPropagation();router.push(`/companies/${c.id}`)}}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-gray-50" title="Open">
                          <ExternalLink size={13} style={{ color:'#6B7280' }}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer pagination */}
          {!loading && total>0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid #EBEBF0', background:'#F9F9FB', flexShrink:0 }}>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>
                {((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of {total.toLocaleString()} companies
              </span>
              <div style={{ display:'flex', gap:4 }}>
                {[['«',1],['‹',page-1],['›',page+1],['»',totalPages]].map(([lbl,tgt])=>(
                  <button key={lbl as string} disabled={Number(tgt)<1||Number(tgt)>totalPages} onClick={()=>setPage(Number(tgt))}
                    style={{ padding:'3px 8px', borderRadius:6, fontSize:12, border:'1px solid #E4E4EB', color:'#6B7280', background:'#fff', opacity:(Number(tgt)<1||Number(tgt)>totalPages)?0.35:1 }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <QuickCreateModal type="company" open={modalOpen} onClose={()=>setModalOpen(false)} onSuccess={load}/>
    </div>
  )
}
