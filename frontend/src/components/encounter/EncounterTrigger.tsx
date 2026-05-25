'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

const WILD_AVATARS = [
  { name: 'Sage', color: '#f0a030' },
  { name: 'Echo', color: '#4ff5e7' },
];

export default function EncounterTrigger({ embedded = false }: { embedded?: boolean }) {
  const encounter = useAppStore((s) => s.encounter);
  const clone = useAppStore((s) => s.clone);
  const topics = useAppStore((s) => s.topics);
  const startEncounter = useAppStore((s) => s.startEncounter);
  const [loading, setLoading] = useState(false);

  if (encounter || !clone) return null;

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    const avatar = WILD_AVATARS[Math.floor(Math.random() * WILD_AVATARS.length)];
    const recentTopics = topics.slice(0, 7);

    try {
      const res = await fetch('/api/encounter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clone,
          recentTopics,
          avatarName: avatar.name,
        }),
      });

      if (!res.ok) return;

      const { sessionId, message, avatarName } = (await res.json()) as {
        sessionId: string;
        message: string;
        avatarName: string;
      };

      startEncounter(sessionId, avatarName, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className={`flex w-full flex-col items-center gap-0.5 rounded-xl border border-white/[0.08] px-3 py-2.5 text-center transition-colors hover:border-[var(--color-neon-pink)]/35 hover:bg-[var(--color-neon-pink)]/8 disabled:opacity-60 ${
        embedded
          ? 'pointer-events-auto'
          : 'pointer-events-auto rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.38)]'
      }`}
      style={
        embedded
          ? undefined
          : {
              background: 'rgba(12, 10, 26, 0.72)',
              backdropFilter: 'blur(20px) saturate(170%)',
              WebkitBackdropFilter: 'blur(20px) saturate(170%)',
            }
      }
      aria-label="クローンを他のエージェントのもとへ送る"
    >
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--color-neon-pink)]">
        Clone → Others
      </span>
      <span className="text-[13px] font-medium text-white/92">
        {loading ? '遭遇を準備中…' : '他クローンと出会わせる'}
      </span>
      <span className="text-[10px] text-white/45">
        Sage・Echo などと話し始める
      </span>
    </button>
  );
}
