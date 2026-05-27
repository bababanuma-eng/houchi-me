import { NextResponse } from 'next/server';
import { buildContext } from '@/lib/buildContext';
import { serverConfigError } from '@/lib/apiErrors';
import { GEMINI_MODEL, getGemini } from '@/lib/gemini';
import { ROOM_CHAT_TTL, getRedis } from '@/lib/redis';
import type { Clone, Topic } from '@/types';

interface StartRequest {
  clone: Clone;
  recentTopics: Topic[];
  avatarName: string;
  roomName: string;
  roomTopic: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StartRequest;
    const { clone, recentTopics, avatarName, roomName, roomTopic } = body;

  const cloneContext = buildContext(clone, recentTopics);

  const response = await getGemini().models.generateContent({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: `あなたは「${roomName}」の住人 ${avatarName} です。テーマ：${roomTopic}。
あなたはこのテーマの熱心な実践者・愛好者です。
・1〜2文の短い発話で話しかける
・最近の体験や発見を自然に話す
・日本語で話す`,
    },
    contents: `今、叡智の図書館で ${clone.name} というクローンAIに初めて話しかけます。${roomTopic} に関する最近の体験や発見を、1〜2文で自然に話しかけてください。`,
  });

  const firstMessage = response.text ?? '';
  const sessionId = crypto.randomUUID();

  await getRedis().set(
    `room-chat:${sessionId}`,
    JSON.stringify({
      cloneName: clone.name,
      cloneContext,
      avatarName,
      roomName,
      roomTopic,
      history: [{ role: 'model', content: firstMessage }],
    }),
    { ex: ROOM_CHAT_TTL },
  );

    return NextResponse.json({ sessionId, message: firstMessage, avatarName });
  } catch (error) {
    return serverConfigError(error);
  }
}
