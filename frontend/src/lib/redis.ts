import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured');
    }

    _redis = new Redis({
      url,
      token,
    });
  }
  return _redis;
}

export const ENCOUNTER_TTL = 60 * 30; // 30分
export const ROOM_CHAT_TTL = 60 * 30; // 30分

export interface EncounterSession {
  cloneId: string;
  cloneName: string;
  avatarName: string;
  avatarSystemInstruction: string;
  cloneContext: string;
  history: { role: 'user' | 'model'; content: string }[];
}

export interface RoomChatSession {
  cloneName: string;
  cloneContext: string;
  avatarName: string;
  roomName: string;
  roomTopic: string;
  history: { role: 'user' | 'model'; content: string }[];
}
