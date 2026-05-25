'use client';

import { useAppStore } from '@/lib/store';

const panelStyle = {
  background: 'rgba(12, 10, 26, 0.82)',
  backdropFilter: 'blur(20px) saturate(170%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
} as const;

export default function CameraFollowButton() {
  const controlMode = useAppStore((s) => s.controlMode);
  const cameraFollowAgent = useAppStore((s) => s.cameraFollowAgent);
  const setCameraFollowAgent = useAppStore((s) => s.setCameraFollowAgent);

  if (controlMode !== 'auto' || cameraFollowAgent) return null;

  return (
    <button
      type="button"
      onClick={() => setCameraFollowAgent(true)}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#caa85e]/35 bg-[#201a12]/90 px-4 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-colors hover:border-[#caa85e]/55 hover:bg-[#201a12]"
      style={panelStyle}
      aria-label="エージェント追跡に戻す"
    >
      <span className="text-[#f3dfb0]" aria-hidden>
        ⟲
      </span>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#f3dfb0]">
        エージェントを追跡
      </span>
    </button>
  );
}
