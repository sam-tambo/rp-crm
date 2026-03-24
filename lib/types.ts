export type CompanyStatus = 'active' | 'churned' | 'prospect' | 'partner'
export type ContactStatus = 'active' | 'inactive' | 'lead' | 'customer'
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
export type ActivityType = 'note' | 'email' | 'call' | 'meeting' | 'status_change' | 'field_update'
export type EntityType = 'company' | 'contact' | 'deal'

export interface Company {
  id: string
  name: string
  domain: string | null
  industry: string | null
  employee_count: number | null
  annual_revenue: number | null
  country: string | null
  website: string | null
  linkedin_url: string | null
  description: string | null
  logo_url: string | null
  status: CompanyStatus
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  linkedin_url: string | null
  company_id: string | null
  owner_id: string | null
  status: ContactStatus
  notes: string | null
  created_at: string
  updated_at: string
  company?: Company
}

export interface Deal {
  id: string
  name: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  close_date: string | null
  company_id: string | null
  contact_id: string | null
  owner_id: string | null
  description: string | null
  created_at: string
  updated_at: string
  company?: Company
  contact?: Contact
}

export interface Activity {
  id: string
  type: ActivityType
  content: string | null
  entity_type: EntityType
  entity_id: string
  user_id: string | null
  created_at: string
}
