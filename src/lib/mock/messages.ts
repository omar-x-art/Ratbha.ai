import type { ChatMessage } from "@/lib/types";

export const WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: "m-welcome",
    from: "ai",
    character: "siraj",
    text: "أهلًا، اكتب اللي في بالك وسأرتّبه لك.",
  },
];

export const SUGGESTION_CHIPS = [
  { id: "c-1", label: "رتّب يومي" },
  { id: "c-2", label: "عندي مهام لبكرة" },
  { id: "c-3", label: "خطط أسبوعي" },
  { id: "c-4", label: "أنا مشتت" },
];
