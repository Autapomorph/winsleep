import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export const SettingsGroup = ({ title, children }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground/50 uppercase">{title}</h3>
      {children}
    </div>
  );
};
