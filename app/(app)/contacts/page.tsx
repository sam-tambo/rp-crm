'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Users, SlidersHorizontal, X,
  ChevronDown, ChevronRight, Linkedin, Mail,
  ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from '@/lib/types'
import QuickCreateModal from '@/components/crm/QuickCreateModal'

const AVATAR_COLORS = [
  ['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],['#d1fae5','#065f46'],
  ['#fef3c7','#92400e'],['#ede9fe','#5b21b6'],['#fee2e2','#991b1b'],
  ['#e0e7ff','#3730a3'],['#fdf4ff','#7e22ce'],['#ecfdf5','#166534'],
  ['#fff7ed','#9a3412'],
]
const avatarColor = (name: string) => {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

type SF = 'name'|'title'|'company'|'department'|'status'
interface Filters { departments: string[]; companies: string[]; statuses: string[] }

function ColSec({ title, open, onToggle, children }: { title:string; open:boolean; onToggle:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ borderBottom:'1px solid #E9F2ED' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-green-50 transition-colors">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#638070' }}>{title}</span>
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
      {count !== undefined && <span className="text-xs px-1.5 rounded-full font-medium" style={{ background:'#EEF7F2', color:'#638070' }}>{count}</span>}
    </label>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [openSections, setOpenSections] = useState({ department:true, company:false, status:false })
  const [filters, setFilters] = useState<Filters>({ departments:[], companies:[], statuses:[] })
  const [sort, setSort] = useState<{ field:SF; dir:'asc'|'desc' }>({ field:'name', dir:'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string|null>(null)
  const [page, setPage] = useState(1)
  const PER = 50
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('contacts').select('*, company:companies(id,name)').order('created_at', { ascending:false })
    setContacts(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const allDepts = [...new Set(contacts.map(c => c.department).filter(Boolean) as string[])].sort()
  const allCompanies = [...new Set(contacts.map(c => (c as any).company?.name).filter(Boolean) as string[])].sort()
  const deptCnt = Object.fromEntries(allDepts.map(d => [d, contacts.filter(c => c.department===d).length]))
  const compCnt = Object.fromEntries(allCompanies.map(n => [n, contacts.filter(c => (c as any).company?.name===n).length]))

  const filtered = contacts.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    const q = search.toLowerCase()
    if (q && !name.includes(q) && !(c.email??'').toLowerCase().includes(q) && !(c.job_title??'').toLowerCase().includes(q)) return false
    if (filters.departments.length && !filters.departments.includes(c.department??'')) return false
    if (filters.companies.length && !(c as any).company?.name || (filters.companies.length && !filters.companies.includes((c as any).company?.name))) return false
    if (filters.statuses.length && !filters.statuses.includes(c.status)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const d = sort.dir==='asc'?1:-1
    if (sort.field==='name') return d*(`${a.first_name} ${a.last_name}`).localeCompare(`${b.first_name} ${b.last_name}`)
    if (sort.field==='title') return d*(a.job_title??'').localeCompare(b.job_title??'')
    if (sort.field==='company') return d*((a as any).company?.name??'').localeCompare((b as any).company?.name??'')
    if (sort.field==='department') return d*(a.department??'').localeCompare(b.department??'')
    if (sort.field==='status') return d*a.status.localeCompare(b.status)
    return 0
  })

  const total = sorted.length
  const totalPages = Math.ceil(total/PER)
  const rows = sorted.slice((page-1)*PER, page*PER)

  const toggleSort = (f:SF) => { setSort(s => s.field===f ? { field:f, dir:s.dir==='asc'?'desc':'asc' } : { field:f, dir:'asc' }); setPage(1) }
  const toggleSec = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]:!s[k] }))
  const toggleDept = (v:string) => { setFilters(f => ({ ...f, departments: f.departments.includes(v)?f.departments.filter(x=>x!==v):[...f.departments,v] })); setPage(1) }
  const toggleComp = (v:string) => { setFilters(f => ({ ...f, companies: f.companies.includes(v)?f.companies.filter(x=>x!==v):[...f.companies,v] })); setPage(1) }
  const toggleSt = (v:string) => { setFilters(f => ({ ...f, statuses: f.statuses.includes(v)?f.statuses.filter(x=>x!==v):[...f.statuses,v] })); setPage(1) }
  const clearAll = () => { setFilters({ departments:[], companies:[], statuses:[] }); setSearch(''); setPage(1) }
  const hasFilters = filters.departments.length||filters.companies.length||filters.statuses.length

  const SIcon = ({ f }: { f:SF }) => sort.field===f
    ? sort.dir==='asc' ? <ArrowUp size={10} style={{ color:'#1aaa5e', marginLeft:2 }}/> : <ArrowDown size={10} style={{ color:'#1aaa5e', marginLeft:2 }}/>
    : <ArrowUpDown size={10} style={{ color:'#C1D9CB', marginLeft:2 }}/>

  return (
    <div className="flex flex-col" style={{ height:'100%', background:'#F9FBFA' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:'1px solid #E0EDE6', background:'#fff', flexShrink:0 }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold" style={{ color:'#111827' }}>Contacts</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'#EEF7F2', color:'#1aaa5e', fontWeight:600 }}>
            {contacts.length.toLocaleString()} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all"
            style={filtersOpen ? { background:'#EEF7F2', color:'#1aaa5e', borderColor:'#B8DEC9' } : { background:'#fff', color:'#638070', borderColor:'#D4E8DC' }}>
            <SlidersHorizontal size={12}/> {filtersOpen ? 'Hide Filters' : 'Filters'}
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background:'#1aaa5e', color:'#fff' }}>
            <Plus size={13}/> New Contact
          </button>
        </div>
      </div>

      <div className="flex overflow-hidden" style={{ flex:1 }}>
        {/* Filter panel */}
        {filtersOpen && (
          <div style={{ width:240, flexShrink:0, background:'#fff', borderRight:'1px solid #E0EDE6', overflowY:'auto' }}>
            <div className="p-3" style={{ borderBottom:'1px solid #E9F2ED' }}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'#9CA3AF' }}/>
                <input className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md outline-none"
                  style={{ background:'#F8FBF9', border:'1px solid #D4E8DC', color:'#191D25' }}
                  placeholder="Search contacts..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}/>
              </div>
              {!!hasFilters && <button onClick={clearAll} className="mt-2 w-full text-xs py-1 rounded" style={{ color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca' }}>Reset all filters</button>}
            </div>
            <ColSec title="Department" open={openSections.department} onToggle={() => toggleSec('department')}>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {allDepts.map(d => <FCheck key={d} label={d} count={deptCnt[d]} checked={filters.departments.includes(d)} onChange={() => toggleDept(d)}/>)}
              </div>
            </ColSec>
            <ColSec title="Company" open={openSections.company} onToggle={() => toggleSec('company')}>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {allCompanies.slice(0,20).map(n => <FCheck key={n} label={n} count={compCnt[n]} checked={filters.companies.includes(n)} onChange={() => toggleComp(n)}/>)}
              </div>
            </ColSec>
            <ColSec title="Status" open={openSections.status} onToggle={() => toggleSec('status')}>
              {(['lead','active','inactive','customer'] as const).map(s => (
                <FCheck key={s} label={s.charAt(0).toUpperCase()+s.slice(1)} count={contacts.filter(c=>c.status===s).length} checked={filters.statuses.includes(s)} onChange={() => toggleSt(s)}/>
              ))}
            </ColSec>
          </div>
        )}

        {/* Main table */}
        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
          {/* Pagination bar */}
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom:'1px solid #E9F2ED', background:'#F8FBF9', flexShrink:0 }}>
            <span className="text-xs" style={{ color:'#9CA3AF' }}>
              {total===0?'0':((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of <strong style={{ color:'#374151' }}>{total.toLocaleString()}</strong>
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{ border:'1px solid #D4E8DC', color:'#638070' }}>‹</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-2 py-0.5 rounded text-xs disabled:opacity-30" style={{ border:'1px solid #D4E8DC', color:'#638070' }}>›</button>
            </div>
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
            <thead>
              <tr style={{ background:'#F3F9F5', borderBottom:'2px solid #D4E8DC' }}>
                <th style={{ width:40, padding:'9px 8px 9px 16px' }}>
                  <input type="checkbox" className="accent-green-600 w-3.5 h-3.5"
                    checked={selected.size===rows.length&&rows.length>0} onChange={()=>selected.size===rows.length?setSelected(new Set()):setSelected(new Set(rows.map(c=>c.id)))}/>
                </th>
                {([['name','Name','left','30%'],['title','Job Title','left','18%'],['company','Company','left','18%'],['department','Department','left','14%'],['status','Status','left','10%']] as const).map(([f,l,a,w])=>(
                  <th key={f} style={{ width:w, padding:'9px 12px', textAlign:a, cursor:'pointer', userSelect:'none' }} onClick={()=>toggleSort(f as SF)}>
                    <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide" style={{ color:sort.field===f?'#1aaa5e':'#8aaa98' }}>
                      {l}<SIcon f={f as SF}/>
                    </span>
                  </th>
                ))}
                <th style={{ width:'10%', padding:'9px 12px' }}><span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'#8aaa98' }}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0F7F3' }}>
                  <td style={{ padding:'12px 8px 12px 16px' }}><div className="w-3.5 h-3.5 rounded animate-pulse" style={{ background:'#EEF7F2' }}/></td>
                  <td style={{ padding:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:999, background:'#EEF7F2' }} className="animate-pulse flex-shrink-0"/>
                      <div><div style={{ height:13, width:100, borderRadius:4, background:'#EEF7F2', marginBottom:4 }} className="animate-pulse"/><div style={{ height:10, width:70, borderRadius:4, background:'#F3F9F5' }} className="animate-pulse"/></div>
                    </div>
                  </td>
                  {[80,90,70,55,60].map((w,j)=><td key={j} style={{ padding:'12px' }}><div style={{ height:12, width:w, borderRadius:4, background:'#F3F9F5' }} className="animate-pulse"/></td>)}
                </tr>
              )) : rows.length===0 ? (
                <tr><td colSpan={7} style={{ padding:'60px 16px', textAlign:'center' }}>
                  <Users size={32} style={{ margin:'0 auto 12px', color:'#C1D9CB', opacity:0.6 }}/>
                  <p style={{ color:'#374151', fontWeight:500, fontSize:14, marginBottom:4 }}>No contacts found</p>
                  <p style={{ color:'#9CA3AF', fontSize:12, marginBottom:16 }}>Try adjusting your search or filters</p>
                  {!hasFilters && !search && <button onClick={()=>setModalOpen(true)} style={{ background:'#1aaa5e', color:'#fff', padding:'8px 20px', borderRadius:8, fontSize:13 }}>Add first contact</button>}
                </td></tr>
              ) : rows.map(contact => {
                const [bgC, txC] = avatarColor(contact.first_name+contact.last_name)
                const hov = hoveredId===contact.id
                const sel = selected.has(contact.id)
                const co = (contact as any).company
                const statusColors: Record<string, [string,string]> = {
                  lead:['#ede9fe','#7c3aed'], active:['#d1fae5','#065f46'],
                  inactive:['#f3f4f6','#6b7280'], customer:['#dbeafe','#1e40af']
                }
                const [sBg, sTx] = statusColors[contact.status] ?? ['#f3f4f6','#6b7280']
                return (
                  <tr key={contact.id} onMouseEnter={()=>setHoveredId(contact.id)} onMouseLeave={()=>setHoveredId(null)}
                    style={{ borderBottom:'1px solid #F0F7F3', background:sel?'#F0FDF4':hov?'#FAFCFB':'#fff', transition:'background 0.1s', cursor:'pointer' }}>
                    <td style={{ padding:'10px 8px 10px 16px', width:40 }} onClick={e=>{e.stopPropagation();setSelected(s=>{const ns=new Set(s);ns.has(contact.id)?ns.delete(contact.id):ns.add(contact.id);return ns})}}>
                      <input type="checkbox" checked={sel} onChange={()=>{}} className="accent-green-600 w-3.5 h-3.5"/>
                    </td>
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:999, background:bgC, color:txC, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                          {contact.first_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.email && <div style={{ fontSize:11, color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{contact.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <span style={{ fontSize:12, color:'#374151' }}>{contact.job_title ?? <span style={{ color:'#D1D5DB' }}>—</span>}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      {co ? (
                        <button onClick={e=>{e.stopPropagation();router.push(`/companies/${co.id}`)}}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-green-50 transition-colors"
                          style={{ fontSize:12, color:'#1aaa5e', fontWeight:500 }}>
                          <Building2 size={11}/> {co.name.length>20?co.name.slice(0,18)+'…':co.name}
                        </button>
                      ) : <span style={{ color:'#D1D5DB', fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <span style={{ fontSize:12, color:'#374151' }}>{contact.department ?? <span style={{ color:'#D1D5DB' }}>—</span>}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }} onClick={()=>router.push(`/contacts/${contact.id}`)}>
                      <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600, background:sBg, color:sTx }}>
                        {contact.status.charAt(0).toUpperCase()+contact.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, opacity:hov?1:0, transition:'opacity 0.15s' }}>
                        {contact.email && <a href={`mailto:${contact.email}`} onClick={e=>e.stopPropagation()}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-gray-50" title="Email">
                          <Mail size={13} style={{ color:'#6B7280' }}/>
                        </a>}
                        {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-blue-50" title="LinkedIn">
                          <Linkedin size={13} style={{ color:'#0A66C2' }}/>
                        </a>}
                        <button onClick={e=>{e.stopPropagation();router.push(`/contacts/${contact.id}`)}}
                          style={{ padding:5, borderRadius:6, display:'flex' }} className="hover:bg-gray-50">
                          <ExternalLink size={13} style={{ color:'#6B7280' }}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!loading && total>0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid #E9F2ED', background:'#F8FBF9', flexShrink:0 }}>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>{((page-1)*PER+1).toLocaleString()}–{Math.min(page*PER,total).toLocaleString()} of {total.toLocaleString()} contacts</span>
              <div style={{ display:'flex', gap:4 }}>
                {[['«',1],['‹',page-1],['›',page+1],['»',totalPages]].map(([lbl,tgt])=>(
                  <button key={lbl as string} disabled={Number(tgt)<1||Number(tgt)>totalPages} onClick={()=>setPage(Number(tgt))}
                    style={{ padding:'3px 8px', borderRadius:6, fontSize:12, border:'1px solid #D4E8DC', color:'#638070', background:'#fff', opacity:(Number(tgt)<1||Number(tgt)>totalPages)?0.35:1 }}>
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
