export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type RiskLevel = 'low' | 'medium' | 'high'
export type CddStatus = 'pending' | 'complete' | 'overdue'
export type MatterType = 'conveyancing' | 'corporate' | 'probate' | 'trusts' | 'commercial' | 'other'

export interface Database {
  public: {
    Tables: {
      firms: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string }
      }
      profiles: {
        Row: {
          id: string
          firm_id: string | null
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          firm_id?: string | null
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          firm_id?: string | null
          full_name?: string | null
          role?: string
        }
      }
      clients: {
        Row: {
          id: string
          firm_id: string
          full_name: string
          email: string | null
          matter_type: MatterType
          matter_description: string | null
          risk_level: RiskLevel
          cdd_status: CddStatus
          cdd_completed_at: string | null
          cdd_expires_at: string | null
          is_company: boolean
          pep: boolean
          source_of_funds: string | null
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          firm_id: string
          full_name: string
          email?: string | null
          matter_type: MatterType
          matter_description?: string | null
          risk_level?: RiskLevel
          cdd_status?: CddStatus
          cdd_completed_at?: string | null
          cdd_expires_at?: string | null
          is_company?: boolean
          pep?: boolean
          source_of_funds?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          full_name?: string
          email?: string | null
          matter_type?: MatterType
          matter_description?: string | null
          risk_level?: RiskLevel
          cdd_status?: CddStatus
          cdd_completed_at?: string | null
          cdd_expires_at?: string | null
          is_company?: boolean
          pep?: boolean
          source_of_funds?: string | null
          notes?: string | null
        }
      }
      business_risk_assessments: {
        Row: {
          id: string
          firm_id: string
          content: Json
          last_reviewed_at: string | null
          next_review_at: string | null
          status: 'draft' | 'complete'
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          content?: Json
          last_reviewed_at?: string | null
          next_review_at?: string | null
          status?: 'draft' | 'complete'
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          last_reviewed_at?: string | null
          next_review_at?: string | null
          status?: 'draft' | 'complete'
          updated_by?: string | null
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          firm_id: string | null
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          firm_id?: string | null
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: never
      }
    }
  }
}

export type Firm = Database['public']['Tables']['firms']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type BusinessRiskAssessment = Database['public']['Tables']['business_risk_assessments']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
