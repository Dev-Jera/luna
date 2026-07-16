export type User = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  is_staff?: boolean;
};
export type Profile = {
  id: number;
  user: User;
  display_name: string;
  bio: string;
  location: string;
  phone_number: string|null;
  phone_verified: boolean;
  sms_match_notifications: boolean;
  sms_unread_reminders: boolean;
  sms_safety_alerts: boolean;
  connection_goal: "friendship" | "romance" | "networking";
  values: string[];
  interests: string[];
  communication_style: string;
  life_goals: string[];
  lifestyle: string[];
  deal_breakers: string[];
  is_discoverable: boolean;
  is_18_or_older: boolean;
  terms_version: string;
  terms_accepted_at: string|null;
  guidelines_accepted_at: string|null;
  ai_profile_consent: boolean;
  ai_summary: string;
  ai_traits: string[];
  ai_analysis_status:
    "not_requested" | "queued" | "processing" | "complete" | "failed";
  onboarding_complete: boolean;
};
export type Match = {
  id: number;
  profile: Profile;
  score: number;
  reasons: string[];
  ai_explanation: string;
  status: "suggested" | "accepted" | "passed";
  conversation_id?: number;
};
export type Message = {
  id: number;
  sender: User | null;
  body: string;
  is_ai: boolean;
  metadata: Record<string,any>;
  created_at: string;
};
export type Conversation = {
  id: number;
  title: string;
  participants: Profile[];
  is_luna: boolean;
  luna_stage: string;
  ai_enabled: boolean;
  my_ai_consent: boolean;
  unread_count: number;
  is_contact_sharing_allowed: boolean;
  messages: Message[];
};
export type IntroductionDraft = {
  id: number;
  conversation: number;
  body: string;
  status: "generating" | "draft" | "sent" | "discarded" | "failed";
  created_at: string;
};
export type Notification={id:number;conversation:number|null;kind:string;title:string;body:string;read_at:string|null;created_at:string};
