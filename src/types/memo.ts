export interface MemoVersion {
  id: string;
  version: number;
  content: any;
  created_at: string;
  created_by: string;
  description?: string;
}

export interface ICVotingDecision {
  id: string;
  title: string;
  description?: string;
  voting_deadline: string;
  status: string;
  memo_id?: string;
  vote_summary?: any;
}

export interface ICSession {
  id: string;
  fund_id: string;
  name: string;
  title: string;
  scheduled_date: string;
  session_date: string;
  status: string;
  agenda?: string;
  participants?: string[];
  notes?: string;
}

export interface ICCommitteeMember {
  id: string;
  user_id: string;
  role: string;
  voting_weight: number;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}