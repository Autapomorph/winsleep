import { Chip, cn } from '@heroui/react';

import { type LogEntry } from '@/shared/lib';

const formatTimestamp = (isoString?: string) => {
  if (!isoString) {
    return '';
  }

  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour12: false });
  } catch {
    return isoString;
  }
};

interface Props {
  entry: LogEntry;
}

export const LogItemRow = ({ entry }: Props) => {
  return (
    <div className="flex items-start gap-2 px-1 py-0.5 text-[11px] leading-5 break-all whitespace-pre-wrap select-text">
      {/* Timestamp */}
      {entry.timestamp && <span className="shrink-0">{formatTimestamp(entry.timestamp)}</span>}

      {/* Level badge */}
      {entry.level && (
        <span className="shrink-0">
          <Chip
            className={cn(
              'h-4 border px-1.5 text-[8px] font-extrabold tracking-widest uppercase',
              entry.level === 'ERROR' && 'bg-danger-soft text-danger-soft-foreground',
              entry.level === 'WARN' && 'bg-warning-soft text-warning-soft-foreground',
              entry.level === 'INFO' && 'bg-success-soft text-success-soft-foreground',
            )}
          >
            {entry.level}
          </Chip>
        </span>
      )}

      {/* Message content */}
      <span
        className={cn(
          entry.level === 'ERROR' && 'text-danger-soft-foreground',
          entry.level === 'WARN' && 'text-warning-soft-foreground',
        )}
      >
        {entry.message}
      </span>
    </div>
  );
};
