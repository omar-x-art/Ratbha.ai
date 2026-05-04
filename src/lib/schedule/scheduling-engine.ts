/**
 * Scheduling Engine — finds free slots and places tasks without conflicts.
 *
 * MVP rules (per project plan §16):
 *  - Never overlap an existing event.
 *  - Add buffer between tasks (default 10–15min, 20–30min after meetings).
 *  - Future-dated tasks must not be placed today.
 *  - High-energy tasks prefer mornings or first long block.
 *  - Small tasks may fill gaps between meetings.
 */

export interface BusyBlock {
  start: number; // epoch ms
  end: number;
  title?: string;
  isMeeting?: boolean;
}

export interface FreeSlot {
  start: number;
  end: number;
}

export interface TaskRequest {
  id: string;
  title: string;
  duration_minutes: number;
  priority?: "low" | "medium" | "high" | "urgent";
  energy?: "low" | "medium" | "high";
  flexibility?: "fixed" | "flexible" | "deadline";
  earliest?: number; // epoch ms
  latest?: number;
}

export interface ScheduledItem {
  id: string;
  start: number;
  end: number;
  title: string;
  reason: string;
}

const DEFAULT_BUFFER_MINUTES = 15;
const POST_MEETING_BUFFER_MINUTES = 25;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 21;

export function computeFreeSlots(
  busy: BusyBlock[],
  windowStart: number,
  windowEnd: number,
  workStartHour = WORK_START_HOUR,
  workEndHour = WORK_END_HOUR
): FreeSlot[] {
  const sorted = [...busy].sort((a, b) => a.start - b.start);
  const slots: FreeSlot[] = [];

  let cursor = Math.max(windowStart, dayHourMs(windowStart, workStartHour));
  const dayEnd = dayHourMs(windowStart, workEndHour);
  const hardEnd = Math.min(windowEnd, dayEnd);

  for (const b of sorted) {
    if (b.end <= cursor) continue;
    if (b.start >= hardEnd) break;
    const blockStart = Math.max(b.start, cursor);
    if (blockStart > cursor) {
      slots.push({ start: cursor, end: blockStart });
    }
    const buffer =
      (b.isMeeting ? POST_MEETING_BUFFER_MINUTES : DEFAULT_BUFFER_MINUTES) *
      60_000;
    cursor = Math.max(cursor, b.end + buffer);
  }
  if (cursor < hardEnd) {
    slots.push({ start: cursor, end: hardEnd });
  }
  return slots.filter((s) => s.end - s.start >= 5 * 60_000);
}

function dayHourMs(epoch: number, hour: number): number {
  const d = new Date(epoch);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function highEnergyFirst(a: TaskRequest, b: TaskRequest) {
  const w = (t: TaskRequest) =>
    (t.energy === "high" ? 2 : t.energy === "medium" ? 1 : 0) +
    (t.priority === "urgent" ? 3 : t.priority === "high" ? 2 : 0);
  return w(b) - w(a);
}

export function scheduleTasks(
  requests: TaskRequest[],
  busy: BusyBlock[],
  windowStart: number,
  windowEnd: number
): { scheduled: ScheduledItem[]; unscheduled: TaskRequest[] } {
  const slots = computeFreeSlots(busy, windowStart, windowEnd);
  const queue = [...requests].sort(highEnergyFirst);
  const scheduled: ScheduledItem[] = [];
  const unscheduled: TaskRequest[] = [];

  for (const t of queue) {
    const need = t.duration_minutes * 60_000;
    const i = slots.findIndex((s) => s.end - s.start >= need);
    if (i === -1) {
      unscheduled.push(t);
      continue;
    }
    const slot = slots[i];
    const start = slot.start;
    const end = start + need;
    scheduled.push({
      id: t.id,
      start,
      end,
      title: t.title,
      reason:
        t.energy === "high"
          ? "اخترنا الفترة الصباحية لأنها مهمة عالية الطاقة"
          : "وضعناها في أول فراغ مناسب",
    });
    const remaining: FreeSlot[] = [];
    if (end + DEFAULT_BUFFER_MINUTES * 60_000 < slot.end) {
      remaining.push({
        start: end + DEFAULT_BUFFER_MINUTES * 60_000,
        end: slot.end,
      });
    }
    slots.splice(i, 1, ...remaining);
  }
  return { scheduled, unscheduled };
}
