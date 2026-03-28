export type CompanyStatus = 'active' | 'churned' | 'prospect' | 'partner'
export type ContactStatus = 'active' | 'inactive' | 'lead' | 'customer'
export type DealStage =
  | 'identified'
  | 'in_sequence'
  | 'scorecard_sent'
  | 'discovery_call'
  | 'pilot_proposed'
  | 'slot_confirmed'
  | 'in_production'
  | 'closed_won'
  | 'closed_lost'
export type ActivityType = 'note' | 'email' | 'call' | 'meeting' | 'status_change' | 'field_update'
export type EntityType = 'company' | 'contact' | 'deal'
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TouchStatus = 'Not started' | 'Touch 1 sent' | 'Touch 2 sent' | 'Touch 3 sent' | 'Replied' | 'Unresponsive'
export type ReplySentiment = 'Positive' | 'Neutral' | 'Not now' | 'No'
export type SlotStatus = 'available' | 'reserved' | 'confirmed' | 'in_production'

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: MemberRole
  invited_by: string | null
  joined_at: string
  profile?: UserProfile
}

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
  logo_url: string | null
  description: string | null
  status: CompanyStatus
  owner_id: string | null
  workspace_id: string | null
  created_at: string
  updated_at: string
  // Supply Chain Intelligence
  asia_dependency_pct: number | null
  primary_source_countries: string[] | null
  annual_units_produced: string | null
  avg_order_size_units: string | null
  has_nearshore_supplier: boolean | null
  nearshore_supplier_names: string | null
  // CSRD / Regulatory
  csrd_obligation: string | null
  scope3_reporting_status: string | null
  sustainability_report_url: string | null
  has_sustainability_team: boolean | null
  // Scoring
  supply_chain_risk_score: number | null
  csrd_urgency_score: number | null
  composite_priority_score: number | null
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  seniority: string | null
  linkedin_url: string | null
  city: string | null
  country: string | null
  apollo_id: string | null
  company_id: string | null
  owner_id: string | null
  workspace_id: string | null
  status: ContactStatus
  notes: string | null
  created_at: string
  updated_at: string
  company?: Company
  // Outreach tracking
  outreach_persona: string | null
  scorecard_submitted: boolean | null
  scorecard_score: number | null
  scorecard_submitted_at: string | null
  touch_1_sent_at: string | null
  touch_2_sent_at: string | null
  touch_3_sent_at: string | null
  touch_status: TouchStatus | null
  reply_sentiment: ReplySentiment | null
  preferred_contact_channel: string | null
  outreach_notes: string | null
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
  workspace_id: string | null
  description: string | null
  created_at: string
  updated_at: string
  last_activity_at: string | null
  loss_reason: string | null
  slot_interest_confirmed: boolean | null
  reorder_probability: number | null
  production_slot_id: string | null
  company?: Company
  contact?: Contact
  production_slot?: ProductionSlot
}

export interface ProductionSlot {
  id: string
  slot_code: string
  quarter: string
  status: SlotStatus
  deal_id: string | null
  reserved_at: string | null
  confirmed_at: string | null
  production_start_date: string | null
  production_end_date: string | null
  sample_ship_date: string | null
  notes: string | null
  created_at: string
  deal?: Deal
}

export interface Activity {
  id: string
  type: ActivityType
  content: string | null
  entity_type: EntityType
  entity_id: string
  user_id: string | null
  workspace_id: string | null
  created_at: string
}
