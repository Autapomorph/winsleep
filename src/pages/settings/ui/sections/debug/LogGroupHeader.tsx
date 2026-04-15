import { useTranslation } from 'react-i18next';

interface Props {
  dateStr: string | null;
}

export const LogGroupHeader = ({ dateStr }: Props) => {
  const { t } = useTranslation();

  const displayStr = dateStr ?? t($ => $.settings.sections.debug.groups.logs.title);

  return (
    <div className="flex justify-center py-2.5 text-[11px] leading-5">
      <span className="rounded-full border bg-background px-3 py-0.5 font-mono text-[10px] font-extrabold text-foreground/80 uppercase backdrop-blur-md">
        {displayStr}
      </span>
    </div>
  );
};
