import { NextResponse } from "next/server";

// MVP stub: returns a fixed busy set for the next 7 days.
export async function GET() {
  const now = new Date();
  const today14 = new Date(now);
  today14.setHours(14, 0, 0, 0);
  const today15 = new Date(now);
  today15.setHours(15, 0, 0, 0);

  return NextResponse.json({
    events: [
      {
        id: "ev-1",
        title: "اجتماع",
        start: today14.toISOString(),
        end: today15.toISOString(),
        isMeeting: true,
      },
    ],
  });
}
