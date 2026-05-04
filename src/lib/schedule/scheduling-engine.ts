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
    const pick = pickPlacement(slots, t, need);
    if (!pick) {
      unscheduled.push(t);
      continue;
    }
    const { slotIndex, start } = pick;
    const slot = slots[slotIndex];
    const end = start + need;
    scheduled.push({
      id: t.id,
      start,
      end,
      title: t.title,
      reason: reasonFor(t, start),
    });
    const remaining: FreeSlot[] = [];
    if (start - DEFAULT_BUFFER_MINUTES * 60_000 > slot.start) {
      remaining.push({
        start: slot.start,
        end: start - DEFAULT_BUFFER_MINUTES * 60_000,
      });
    }
    if (end + DEFAULT_BUFFER_MINUTES * 60_000 < slot.end) {
      remaining.push({
        start: end + DEFAULT_BUFFER_MINUTES * 60_000,
        end: slot.end,
      });
    }
    slots.splice(slotIndex, 1, ...remaining);
  }
  return { scheduled, unscheduled };
}

function hourOf(ts: number): number {
  return new Date(ts).getHours();
}

function dayHourFromSlot(slot: FreeSlot, hour: number): number {
  const d = new Date(slot.start);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/**
 * Picks the best placement for a task given its energy:
 *  - high energy → first slot whose first portion falls before noon
 *  - low energy → first slot whose tail extends past 17:00 (placed at 17:00)
 *  - otherwise → first-fit at slot.start
 *
 * Falls back to first-fit when nothing in the preferred range fits.
 */
function pickPlacement(
  slots: FreeSlot[],
  task: TaskRequest,
  need: number
): { slotIndex: number; start: number } | null {
  if (task.energy === "high") {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (hourOf(s.start) < 12 && s.end - s.start >= need) {
        return { slotIndex: i, start: s.start };
      }
    }
  }
  if (task.energy === "low") {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const eveningStart = Math.max(s.start, dayHourFromSlot(s, 17));
      if (eveningStart + need <= s.end) {
        return { slotIndex: i, start: eveningStart };
      }
    }
  }
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.end - s.start >= need) {
      return { slotIndex: i, start: s.start };
    }
  }
  return null;
}

function reasonFor(task: TaskRequest, start: number): string {
  const h = hourOf(start);
  if (task.energy === "high" && h < 12) {
    return "اخترنا الصباح لأنها مهمة عالية الطاقة.";
  }
  if (task.energy === "low" && h >= 17) {
    return "وضعناها في المساء لأنها مهمة خفيفة.";
  }
  if (task.priority === "urgent") {
    return "أولوية عاجلة، حجزنا أقرب فراغ.";
  }
  return "وضعناها في أول فراغ مناسب.";
}
