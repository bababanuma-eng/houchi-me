'use client';

import type { ReactNode } from 'react';

interface StateAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface StateProps {
  title: string;
  description?: string;
  action?: StateAction;
  compact?: boolean;
}

function StateFrame({
  eyebrow,
  title,
  description,
  action,
  compact = false,
  tone = 'neutral',
  children,
}: StateProps & {
  eyebrow: string;
  tone?: 'neutral' | 'danger';
  children?: ReactNode;
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-[var(--color-neon-pink)]/30 bg-[var(--color-neon-pink)]/10'
      : 'border-white/[0.06] bg-white/[0.02]';

  return (
    <div
      className={`rounded-2xl border ${toneClass} ${
        compact ? 'px-3 py-4' : 'px-5 py-8'
      } text-center`}
    >
      <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center">
        {children}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
        {eyebrow}
      </div>
      <div className="mt-2 text-[13px] font-medium text-white/85">{title}</div>
      {description && (
        <div className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-white/50">
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] text-white/75 transition-colors hover:bg-white/[0.08] disabled:opacity-45"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingState({
  title,
  description,
  compact,
}: Omit<StateProps, 'action'>) {
  return (
    <StateFrame
      eyebrow="Loading"
      title={title}
      description={description}
      compact={compact}
    >
      <div className="h-7 w-7 animate-spin rounded-full border border-white/10 border-t-[var(--color-neon-cyan)]" />
    </StateFrame>
  );
}

export function EmptyState({ title, description, action, compact }: StateProps) {
  return (
    <StateFrame
      eyebrow="Empty"
      title={title}
      description={description}
      action={action}
      compact={compact}
    >
      <div className="h-2 w-2 rounded-full bg-white/35 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />
    </StateFrame>
  );
}

export function ErrorState({ title, description, action, compact }: StateProps) {
  return (
    <StateFrame
      eyebrow="Error"
      title={title}
      description={description}
      action={action}
      compact={compact}
      tone="danger"
    >
      <div className="h-7 w-7 rounded-full border border-[var(--color-neon-pink)]/35 text-[18px] leading-[1.55] text-[var(--color-neon-pink)]">
        !
      </div>
    </StateFrame>
  );
}
