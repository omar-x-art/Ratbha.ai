import type { Task } from "@/lib/types";

export const MOCK_INBOX_TASKS: Task[] = [
  {
    id: "task-inbox-1",
    title: "مراجعة الفواتير",
    status: "inbox",
    source_text: "راجع الفواتير لما أفضى",
    duration_minutes: 30,
    priority: "medium",
    energy: "medium",
    flexibility: "flexible",
    reason: "قلت «لما أفضى» — متى يناسبك؟",
  },
];
