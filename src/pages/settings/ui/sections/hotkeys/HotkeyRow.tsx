import { Fragment } from 'react';
import { Kbd } from '@heroui/react';

interface Props {
  label: string;
  keys: string[] | string[][];
}

export const HotkeyRow = ({ label, keys }: Props) => {
  const hotkeyGroups = Array.isArray(keys[0]) ? (keys as string[][]) : [keys as string[]];

  const hotkeyGroupSeparator = <span className="px-0.5 text-xs text-foreground/40">/</span>;
  const hotkeyKeySeparator = <span>+</span>;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="min-w-0 text-sm wrap-break-word text-foreground/80">{label}</span>

      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1">
        {hotkeyGroups.map((group, groupIndex) => {
          const groupKey = group.join('+');

          return (
            <Fragment key={groupKey}>
              {groupIndex > 0 && hotkeyGroupSeparator}

              <div className="flex items-center gap-1">
                {group.map((key, keyIndex) => (
                  <Fragment key={`${groupKey}-${key}`}>
                    {keyIndex > 0 && hotkeyKeySeparator}
                    <Kbd>{key}</Kbd>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
