'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Users, SlidersHorizontal,
  ChevronDown, ChevronRight, Mail,
  ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from '@/lib/types'
import QuickCreateModal from '@/components/crm/QuickCreateModal'
import { LinkedInIcon } from '@/components/ui/linkedin-icon'

const PALETTE = [
  ['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],['#d1fae5','#065f46'],
  ['#fef3c7','#92400e'],['#ede9fe','#5b21b6'],['#fee2e2','#991b1b'],
  ['#e0e7ff','#3730a3'],['#fdf4ff','#7e22ce'],['#ecfdf5','#166534'],['#fff7ed','#9a3412'],
]
const avatarColor = (name: string) => {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  return PALETTE[h % PALETTE.length]
}

const SENIORITY_COLORS: Record<string, [string, string]> = {
  'Vp':       ['#EEF0FF','#4F46E5'],
  'Director': ['#FFF4E6','#C2410C'],
  'Head':     ['#DCFCE7','#166534'],
  'Manager':  ['#F0FDF4','#15803D'],
  'Owner':    ['#FEF3C7','#92400E'],
  'C Suite':  ['#FCE7F3','#9D174D'],
  'Partner':  ['#E0E7FF','#3730A3'],
}
const seniorityColor = (s: string | null): [string, string] =>
  s && SENIORITY_COLORS[s] ? SENIORITY_COLORS[s] : ['#F3F4F6','#6B7280']

function ColSec({ title, open, onToggle, children }: { title:string; open:boolean; onToggle:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ borderBottom:'1px solid #EBEBF0' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-green-50 transition-colors">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#6B7280' }}>{title}</span>
        {open ? <ChevronDown size={11} style={{ color:'#9CA3AF' }}/> : <ChevronRight size={11} style={{ color:'#9CA3AF' }}/>}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}
function FCheck({ label, count, checked, onChange }: { label:string; count?:number; checked:boolean; onChange:()=>void }) {
  return (
    <label className="flex items-center gap-2 py-1 px-1.5 rounded cursor-pointer hover:bg-green-50 transition-colors">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-green-600 w-3 h-3 flex-shrink-0"/>
      <span className="flex-1 text-xs truncate" style={{ color:'#374151' }}>{label}</span>
      {count !== undefined && <span className="text-xs px-1.5 rounded-full font-medium" style={{ background:'#F0FDF4', color:'#6B7280' }}>{count}</span>}
    </label>
  )
}

type SF = 'name'|'title'|'company'|'seniority'|'country'
interface Filters { seniorities:string[]; companies:string[]; countries:string[] }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [openSections, setOpenSections] = useState({ seniority:true, company:false, country:false })
  const [filters, setFilters] = useState<Filters>({ seniorities:[], companies:[], countries:[] })
  const [sort, setSort] = useState<{ field:SF; dir:'asc'|'desc' }>({ field:'name', dir:'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string|null>(null)
  const [page, setPage] = useState(1)
  const PER = 50
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*, company:companies(id,name,logo_url)')
      .order('created_at', { ascending:false })
    setContacts(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // Realtime: refresh when any teammate modifies a contact
  useEffect(() => {
    const channel = supabase
      .channel('contacts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const allSeniorities = [...new Set(contacts.map(c=>c.seniority).filter(Boolean) as string[])].sort()
  const allCompanies   = [...new Set(contacts.map(c=>(c as any).company?.name).filter(Boolean) as string[])].sort()
  const allCountries   = [...new Set(contacts.map(c=>c.country).filter(Boolean) as string[])].sort()
  const senCnt     = Object.fromEntries(allSeniorities.map(s=>[s, contacts.filter(c=>c.seniority===s).length]))
  const compCnt    = Object.fromEntries(allCompanies.map(n=>[n, contacts.filter(c=>(c as any).company?.name===n).length]))
  const countryCnt = Object.fromEntries(allCountries.map(n=>[n, contacts.filter(c=>c.country===n).length]))

  const filtered = contacts.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    const q = search.toLowerCase()
    if (q && !name.includes(q) && !(c.email??'').toLowerCase().includes(q) && !(c.job_title??'').toLowerCase().includes(q)) return false
    if (filters.seniorities.length && !filters.seniorities.includes(c.seniority??'')) return false
    if (filters.companies.length && !filters.companies.includes((c as any).company?.name)) return false
    if (filters.countries.length && !filters.countries.includes(c.country??'')) return false
    return true
  })
  const sorted = [...filtered].sort((a,b) => {
    const d = sort.dir==='asc'?1:-1
    if (sort.field==='name')      return d*(`${a.first_name} ${a.last_name}`).localeCompare(`${b.first_name} ${b.last_name}`)
    if (sort.field==='title')     return d*(a.job_title??'').localeCompare(b.job_title??'')
    if (sort.field==='company')   return d*((a as any).company?.name??'').localeCompare((b as any).company?.name??'')
    if (sort.field==='seniority') return d*(a.seniority??'').localeCompare(b.seniority??'')
    if (sort.field==='country')   return d*(a.country??'').localeCompare(b.country??'')
    return 0
  })
  const total = sorted.length
  const totalPages = Math.ceil(total/PER)
  const rows = sorted.slice((page-1)*PER, page*PER)

  const toggleSort    = (f:SF) => { setSort(s=>s.field===f?{field:f,dir:s.dir==='asc'?'desc':'asc'}:{field:f,dir:'asc'}); setPage(1) }
  const toggleSec     = (k:keyof typeof openSections) => setOpenSections(s=>({...s,[k]:!s[k]}))
  const toggleSen     = (v:string) => { setFilters(f=>({...f,seniorities:f.seniorities.includes(v)?f.seniorities.filter(x=>x!==v):[...f.seniorities,v]})); setPage(1) }
  const toggleComp    = (v:string) => { setFilters(f=>({...f,companies:f.companies.includes(v)?f.companies.filter(x=>x!==v):[...f.companies,v]})); setPage(1) }
  const toggleCountry = (v:string) => { setFilters(f=>({...f,countries:f.countries.includes(v)?f.countries.filter(x=>x!==v):[...f.countries,v]})); setPage(1) }
  const clearAll  = () => { setFilters({seniorities:[],companies:[],countries:[]}); setSearch(''); setPage(1) }
  const hasFilters = filters.seniorities.length||filters.companies.length||filters.countries.length

  const SIcon = ({f}:{f:SF}) => sort.field===f
    ? sort.dir==='asc' ? <ArrowUp size={10} style={{color:'#059669',marginLeft:2}}/> : <ArrowDown size={10} style={{color:'#059669',marginLeft:2}}/>
    : <ArrowUpDown size={10} style={{color:'#C8C8D8',marginLeft:2}}/>

  function CompanyChip({co}:{co:any}) {
    const [err,setErr] = useState(false)
    if (!co) return <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
    return (
      <button onClick={e=>{e.stopPropagation();router.push(`/companies/${co.id}`)}}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-green-50 transition-colors"
        style={{fontSize:12,color:'#059669',fontWeight:500,maxWidth:160}}>
        {co.logo_url && !err
          ? <img src={co.logo_url} alt="" onError={()=>setErr(true)} style={{width:16,height:16,borderRadius:3,objectFit:'contain',background:'#fff',border:'1px solid #E5E7EB',flexShrink:0}}/>
          : <Building2 size={11} style={{flexShrink:0}}/>
        }
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {co.name.length>22?co.name.slice(0,20)+'…':co.name}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col" style={{height:'100%',background:'#F9F9FB'}}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:'1px solid #EBEBF0',background:'#fff',flexShrink:0}}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold" style={{color:'#111118'}}>Contacts</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'#F0FDF4',color:'#059669',fontWeight:600}}>
            {contacts.length.toLocaleString()} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setFiltersOpen(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all"
            style={filtersOpen?{background:'#F0FDF4',color:'#059669',borderColor:'#D1FAE5'}:{background:'#fff',color:'#6B7280',borderColor:'#E4E4EB'}}>
            <SlidersHorizontal size={12}/> {filtersOpen?'Hide Filters':'Filters'}
          </button>
          <button onClick={()=>setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{background:'#059669',color:'#fff'}}>
            <Plus size={13}/> New Contact
          </button>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{flex:1}}>
        {/* Filter panel */}
        {filtersOpen && (
          <div style={{width:224,flexShrink:0,background:'#fff',borderRight:'1px solid #EBEBF0',overflowY:'auto'}}>
            <div className="p-3" style={{borderBottom:'1px solid #EBEBF0'}}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:'#9CA3AF'}}/>
                <input className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none"
                  style={{background:'#F9F9FB',border:'1px solid #E4E4EB',color:'#111118'}}
                  placeholder="Search contacts…" value={search}
                  onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
              </div>
              {!!hasFilters && <button onClick={clearAll} className="mt-2 w-full text-xs py-1 rounded" style={{color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca'}}>Reset all filters</button>}
            </div>
            <ColSec title="Seniority" open={openSections.seniority} onToggle={()=>toggleSec('seniority')}>
              <div style={{maxHeight:160,overflowY:'auto'}}>
                {allSeniorities.map(s=><FCheck key={s} label={s} count={senCnt[s]} checked={filters.seniorities.includes(s)} onChange={()=>toggleSen(s)}/>)}
              </div>
            </ColSec>
            <ColSec title="Company" open={openSections.company} onToggle={()=>toggleSec('company')}>
              <div style={{maxHeight:180,overflowY:'auto'}}>
                {allCompanies.slice(0,30).map(n=><FCheck key={n} label={n} count={compCnt[n]} checked={filters.companies.includes(n)} onChange={()=>toggleComp(n)}/>)}
              </div>
            </ColSec>
            <ColSec title="Country" open={openSections.country} onToggle={()=>toggleSec('country')}>
              <div style={{maxHeight:180,overflowY:'auto'}}>
                {allCountries.map(c=><FCheck key={c} label={c} count={countryCnt[c]} checked={filters.countries.includes(c)} onChange={()=>toggleCountry(c)}/>)}
              </div>
            </ColSec>
          </div>
        )}

        {/* Main table */}
        <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
          <div className="flex items-center justify-between px-4 py-2" style={{borderBottom:'1px solid #EBEBF0',background:'#F9F9FB',flexShrink:0}}>
            <span className="text-xs" style={{color:'#9CA3AF'}}>
              {total===0?'0':((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of <strong style={{color:'#374151'}}>{total.toLocaleString()}</strong>
            </span>
            <div style={{display:'flex',gap:4}}>
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{border:'1px solid #E4E4EB',color:'#6B7280'}}>‹</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{border:'1px solid #E4E4EB',color:'#6B7280'}}>›</button>
            </div>
          </div>

          <table style={{width:'100%',borderCollapse:'collapse',background:'#fff'}}>
            <thead>
              <tr style={{background:'#F4F4F8',borderBottom:'2px solid #E4E4EB'}}>
                <th style={{width:40,padding:'9px 8px 9px 16px'}}>
                  <input type="checkbox" className="accent-green-600 w-3.5 h-3.5"
                    checked={selected.size===rows.length&&rows.length>0}
                    onChange={()=>selected.size===rows.length?setSelected(new Set()):setSelected(new Set(rows.map(c=>c.id)))}/>
                </th>
                {([['name','Name','28%'],['title','Job Title','20%'],['company','Company','18%'],['seniority','Seniority','10%'],['country','Location','13%']] as const).map(([f,l,w])=>(
                  <th key={f} style={{width:w,padding:'9px 12px',textAlign:'left',cursor:'pointer',userSelect:'none'}} onClick={()=>toggleSort(f)}>
                    <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide" style={{color:sort.field===f?'#059669':'#9CA3AF'}}>
                      {l}<SIcon f={f}/>
                    </span>
                  </th>
                ))}
                <th style={{width:'8%',padding:'9px 12px'}}><span className="text-xs font-semibold uppercase tracking-wide" style={{color:'#9CA3AF'}}>Links</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F4F4F8'}}>
                  <td style={{padding:'12px 8px 12px 16px'}}><div className="w-3.5 h-3.5 rounded animate-pulse" style={{background:'#F0FDF4'}}/></td>
                  <td style={{padding:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:999,background:'#F0FDF4'}} className="animate-pulse flex-shrink-0"/>
                      <div><div style={{height:13,width:110,borderRadius:4,background:'#F0FDF4',marginBottom:4}} className="animate-pulse"/><div style={{height:10,width:80,borderRadius:4,background:'#F4F4F8'}} className="animate-pulse"/></div>
                    </div>
                  </td>
                  {[90,80,60,55,70].map((w,j)=><td key={j} style={{padding:'12px'}}><div style={{height:12,width:w,borderRadius:4,background:'#F4F4F8'}} className="animate-pulse"/></td>)}
                </tr>
              )) : rows.length===0 ? (
                <tr><td colSpan={7} style={{padding:'60px 16px',textAlign:'center'}}>
                  <Users size={32} style={{margin:'0 auto 12px',color:'#C8C8D8',opacity:0.6}}/>
                  <p style={{color:'#374151',fontWeight:500,fontSize:14,marginBottom:4}}>No contacts found</p>
                  <p style={{color:'#9CA3AF',fontSize:12,marginBottom:16}}>Try adjusting your search or filters</p>
                  {!hasFilters&&!search&&<button onClick={()=>setModalOpen(true)} style={{background:'#059669',color:'#fff',padding:'8px 20px',borderRadius:8,fontSize:13}}>Add first contact</button>}
                </td></tr>
              ) : rows.map(contact => {
                const [bgC,txC] = avatarColor(contact.first_name+contact.last_name)
                const [senBg,senTx] = seniorityColor(contact.seniority)
                const hov = hoveredId===contact.id
                const sel = selected.has(contact.id)
                const co = (contact as any).company
                return (
                  <tr key={contact.id} onMouseEnter={()=>setHoveredId(contact.id)} onMouseLeave={()=>setHoveredId(null)}
                    style={{borderBottom:'1px solid #F4F4F8',background:sel?'#F0FDF4':hov?'#FAFAFA':'#fff',transition:'background 0.1s',cursor:'pointer'}}>
                    <td style={{padding:'10px 8px 10px 16px',width:40}} onClick={e=>{e.stopPropagation();setSelected(s=>{const ns=new Set(s);ns.has(contact.id)?ns.delete(contact.id):ns.add(contact.id);return ns})}}>
                      <input type="checkbox" checked={sel} onChange={()=>{}} className="accent-green-600 w-3.5 h-3.5"/>
                    </td>
                    <td style={{padding:'10px 12px'}} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:34,height:34,borderRadius:999,background:bgC,color:txC,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0,letterSpacing:'-0.5px'}}>
                          {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                        </div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:'#111118',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.email
                            ? <div style={{fontSize:11,color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{contact.email}</div>
                            : <div style={{fontSize:11,color:'#D1D5DB'}}>No email</div>
                          }
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'10px 12px'}} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <span style={{fontSize:12,color:'#374151'}}>{contact.job_title??<span style={{color:'#D1D5DB'}}>—</span>}</span>
                    </td>
                    <td style={{padding:'10px 12px'}}><CompanyChip co={co}/></td>
                    <td style={{padding:'10px 12px'}} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      {contact.seniority
                        ? <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:600,background:senBg,color:senTx}}>{contact.seniority}</span>
                        : <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
                      }
                    </td>
                    <td style={{padding:'10px 12px'}} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      {contact.country
                        ? <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <MapPin size={10} style={{color:'#9CA3AF',flexShrink:0}}/>
                            <span style={{fontSize:12,color:'#6B7280',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                              {contact.city?`${contact.city}, `:''}{contact.country}
                            </span>
                          </div>
                        : <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
                      }
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:3,opacity:hov?1:0,transition:'opacity 0.15s'}}>
                        {contact.email&&<a href={`mailto:${contact.email}`} onClick={e=>e.stopPropagation()} style={{padding:5,borderRadius:6,display:'flex'}} className="hover:bg-gray-50" title="Email"><Mail size={13} style={{color:'#6B7280'}}/></a>}
                        {contact.linkedin_url&&<a href={contact.linkedin_url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{padding:5,borderRadius:6,display:'flex'}} className="hover:bg-blue-50" title="LinkedIn"><LinkedInIcon size={13} style={{color:'#0A66C2'}}/></a>}
                        <button onClick={e=>{e.stopPropagation();router.push(`/contacts/${contact.id}`)}} style={{padding:5,borderRadius:6,display:'flex'}} className="hover:bg-gray-50"><ExternalLink size={13} style={{color:'#6B7280'}}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!loading&&total>0&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderTop:'1px solid #EBEBF0',background:'#F9F9FB',flexShrink:0}}>
              <span style={{fontSize:12,color:'#9CA3AF'}}>{((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of {total.toLocaleString()} contacts</span>
              <div style={{display:'flex',gap:4}}>
                {([['«',1],['‹',page-1],['›',page+1],['»',totalPages]] as [string,number][]).map(([lbl,tgt])=>(
                  <button key={lbl} disabled={tgt<1||tgt>totalPages} onClick={()=>setPage(tgt)}
                    style={{padding:'3px 8px',borderRadius:6,fontSize:12,border:'1px solid #E4E4EB',color:'#6B7280',background:'#fff',opacity:(tgt<1||tgt>totalPages)?0.35:1}}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <QuickCreateModal type="contact" open={modalOpen} onClose={()=>setModalOpen(false)} onSuccess={load}/>
    </div>
  )
}
