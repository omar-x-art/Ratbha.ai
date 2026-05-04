export type CharacterId = "siraj" | "omar";
export type CharacterState =
  | "neutral"
  | "happy"
  | "thinking"
  | "encouraging"
  | "explaining";

export type BubbleFrom = "user" | "ai" | "system";

export interface ChatMessage {
  id: string;
  from: BubbleFrom;
  character?: CharacterId;
  text: string;
  createdAt?: string;
}

export type TaskStatus =
  | "inbox"
  | "planned"
  | "scheduled"
  | "done"
  | "deleted";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Energy = "low" | "medium" | "high";
export type Flexibility = "fixed" | "flexible" | "deadline";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  source_text?: string;
  due_date?: string | null;
  preferred_start?: string | null;
  preferred_end?: string | null;
  duration_minutes: number;
  priority: Priority;
  energy: Energy;
  flexibility: Flexibility;
  reason?: string;
}

export type ItemType = "existing_event" | "proposed_task" | "break";

export interface PlanItem {
  id: string;
  task_id?: string;
  title: string;
  start_time: string; // ISO
  end_time: string; // ISO
  item_type: ItemType;
  google_event_id?: string | null;
  is_locked?: boolean;
  reason?: string;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  label: "today" | "tomorrow" | "later" | "needs_clarification" | string;
  arabicLabel: string;
  items: PlanItem[];
}

export interface Plan {
  id: string;
  title: string;
  status: "draft" | "approved" | "saved" | "cancelled";
  ai_model?: string;
  input_text?: string;
  buckets: DayBucket[];
  inbox: Task[]; // ambiguous tasks
}
