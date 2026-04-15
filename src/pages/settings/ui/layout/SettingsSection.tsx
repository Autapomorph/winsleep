import type { ReactNode } from 'react';
import { Surface } from '@heroui/react';

interface Props {
  id: string;
  children: ReactNode;
}

export const SettingsSection = ({ id, children }: Props) => {
  return (
    <section id={id} tabIndex={-1} className="scroll-mt-4 outline-none">
      <Surface className="rounded-2xl p-6">{children}</Surface>
    </section>
  );
};
