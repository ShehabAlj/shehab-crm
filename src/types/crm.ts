export interface DbLead {
  id: string;
  created_at: string;
  client_name: string;
  project_type: string;
  heat_level: 'Cold' | 'Warm' | 'Hot';
  status: 'New' | 'In Talk' | 'Working' | 'Testing' | 'Done';
  project_value: number;
  whatsapp?: string;
  notes?: string;
  last_synced_at?: string;
  user_id?: string;
}

export interface Milestone {
    id: string;
    title: string;
    status: 'Pending' | 'In Progress' | 'Done';
}

export interface ProjectDetails {
    id?: string;
    lead_id: string; // Foreign Key matches leads.id
    chat_logs?: string;
    milestones?: Milestone[]; // JSONB
    ai_summary?: any; // JSONB (Used for structured technical specs)
    proposal_draft?: string;
    user_id?: string;
}

export interface ProjectAnalysis {
  id?: string;
  project_id: string; // References leads.id
  proposal_content?: string;
  technical_summary?: string;
  last_updated?: string;
}
