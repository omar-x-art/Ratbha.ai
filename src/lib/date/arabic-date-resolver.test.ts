import { describe, it, expect } from "vitest";
import { resolveArabicDate } from "./arabic-date-resolver";

const NOW = new Date(2026, 4, 4, 10, 0, 0); // 2026-05-04 (Mon)

describe("resolveArabicDate", () => {
  it("resolves اليوم", () => {
    const r = resolveArabicDate("اليوم", NOW);
    expect(r.confidence).toBe(1);
    expect(r.date?.toDateString()).toBe(NOW.toDateString());
  });

  it("resolves بكرة as tomorrow", () => {
    const r = resolveArabicDate("بكرة", NOW);
    expect(r.confidence).toBe(1);
    const expected = new Date(2026, 4, 5);
    expect(r.date?.toDateString()).toBe(expected.toDateString());
  });

  it("resolves الخميس as the next Thursday", () => {
    const r = resolveArabicDate("الخميس", NOW);
    expect(r.confidence).toBeGreaterThan(0.5);
    expect(r.date?.getDay()).toBe(4);
    expect(r.date!.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("resolves الأسبوع القادم with lower confidence", () => {
    const r = resolveArabicDate("الأسبوع القادم", NOW);
    expect(r.confidence).toBeLessThan(1);
    expect(r.date).toBeTruthy();
  });

  it("flags لما أفضى as flexible (no concrete date)", () => {
    const r = resolveArabicDate("لما أفضى", NOW);
    expect(r.date).toBeNull();
    expect(r.reason).toBe("flexible");
  });

  it("resolves بعد ساعة as +1 hour from now", () => {
    const r = resolveArabicDate("بعد ساعة", NOW);
    expect(r.confidence).toBeGreaterThan(0.9);
    expect(r.date?.getHours()).toBe(11);
  });

  it("resolves بعد ساعتين as +2 hours", () => {
    const r = resolveArabicDate("بعد ساعتين", NOW);
    expect(r.date?.getHours()).toBe(12);
  });

  it("resolves نهاية الأسبوع as upcoming Friday", () => {
    const r = resolveArabicDate("نهاية الأسبوع", NOW);
    expect(r.date?.getDay()).toBe(5);
  });

  it("resolves آخر الشهر as last day of month", () => {
    const r = resolveArabicDate("آخر الشهر", NOW);
    expect(r.date?.getMonth()).toBe(4); // May
    expect(r.date?.getDate()).toBe(31);
  });
});
