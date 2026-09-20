import { NextResponse } from "next/server";
import { DEMO_SURVEY } from "@/lib/survey/demo";
import { runSurvey } from "@/lib/survey/orchestrator";
import type { Survey } from "@/lib/survey/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { survey?: Survey };
  const survey = body.survey ?? DEMO_SURVEY;
  if (!survey.questions?.length) {
    return NextResponse.json({ error: "調査に設問がありません" }, { status: 400 });
  }
  const result = runSurvey({
    ...survey,
    sampleSize: Math.min(1000, Math.max(50, survey.sampleSize || 1000)),
  });
  return NextResponse.json(result);
}

export async function GET() {
  const result = runSurvey(DEMO_SURVEY);
  return NextResponse.json(result);
}
