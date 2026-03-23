import { CompanyStatus, ContactStatus, DealStage } from '@/lib/types'

const COMPANY_STATUS_STYLES: Record<CompanyStatus, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Active' },
  prospect: { bg: 'rgba(139,92,246,0.12)', color: '#2cc774', label: 'Prospect' },
  partner: { bg: 'rgba(99,102,241,0.12)', color: '#1aaa5e', label: 'Partner' },
  churned: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Churned' },
}

const CONTACT_STATUS_STYLES: Record<ContactStatus, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Active' },
  inactive: { bg: 'rgba(90,90,112,0.2)', color: '#638070', label: 'Inactive' },
  lead: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Lead' },
  customer: { bg: 'rgba(99,102,241,0.12)', color: '#1aaa5e', label: 'Customer' },
}

const DEAL_STAGE_STYLES: Record<DealStage, { bg: string; color: string; label: string }> = {
  prospecting: { bg: 'rgba(90,90,112,0.2)', color: '#638070', label: 'Prospecting' },
  qualification: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Qualification' },
  proposal: { bg: 'rgba(99,102,241,0.12)', color: '#1aaa5e', label: 'Proposal' },
  negotiation: { bg: 'rgba(139,92,246,0.12)', color: '#2cc774', label: 'Negotiation' },
  closed_won: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Won' },
  closed_lost: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Lost' },
}

interface Props {
  type: 'company' | 'contact' | 'deal'
  value: string
}

export default function StatusBadge({ type, value }: Props) {
  let style: { bg: string; color: string; label: string }
  if (type === 'company') style = COMPANY_STATUS_STYLES[value as CompanyStatus] ?? COMPANY_STATUS_STYLES.active
  else if (type === 'contact') style = CONTACT_STATUS_STYLES[value as ContactStatus] ?? CONTACT_STATUS_STYLES.active
  else style = DEAL_STAGE_STYLES[value as DealStage] ?? DEAL_STAGE_STYLES.prospecting

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}
