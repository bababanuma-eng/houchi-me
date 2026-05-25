import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/redis';
import type { EncounterSession } from '@/lib/redis';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface EndRequest {
  sessionId: string;
}

async function generateSummary(session: EncounterSession): Promise<object | null> {
  if (session.history.length <= 1) return null;

  const dialogueText = session.history
    .map((h) => `${h.role === 'user' ? session.cloneName : session.avatarName}: ${h.content}`)
    .join('\n\n');

  const prompt = `以下のプロフィールを持つクローンAI「${session.cloneName}」が行った会話を分析してください。

${session.cloneContext}

会話内容:
${dialogueText}

このクローンの視点から、この会話で何を感じ・気づいたかを分析してください。
クローンのプロフィール（好み・MBTIなど）を踏まえて、何が印象に残りやすいかを考慮すること。

以下のJSON形式のみで出力してください:
{
  "resonated": ["印象に残ったこと（最大3つ）"],
  "newInterests": ["新たに興味を持ったキーワードや概念（最大3つ）"],
  "selfDiscovery": "この会話を通じて浮かび上がった自分の傾向（1文）"
}`;

  try {
    const res = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt,
    });
    return JSON.parse(res.text ?? 'null');
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as EndRequest;

  const raw = await getRedis().get<string>(`encounter:${sessionId}`);
  if (!raw) {
    return NextResponse.json({ ok: true });
  }

  const session: EncounterSession =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let dbError: string | null = null;
  if (supabaseUrl && serviceRoleKey && session.history.length > 1) {
    const summary = await generateSummary(session);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from('encounter_logs').insert({
      clone_id: session.cloneId,
      dialogue: session.history,
      summary,
    });
    if (error) dbError = `${error.code}: ${error.message}`;
  }

  await getRedis().del(`encounter:${sessionId}`);

  return NextResponse.json({ ok: true, dbError, cloneId: session.cloneId });
}
