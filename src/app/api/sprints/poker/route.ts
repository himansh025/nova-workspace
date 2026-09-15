import { NextResponse } from "next/server";
import { castPokerVote, getPokerVotes } from "@/server/sprintData";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }
    const votes = getPokerVotes(taskId);
    return NextResponse.json({ success: true, votes });
  } catch (error) {
    console.error("Error fetching poker votes:", error);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, voter, points } = body;

    if (!taskId || !voter || points === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = castPokerVote(taskId, voter, points);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error casting poker vote:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
