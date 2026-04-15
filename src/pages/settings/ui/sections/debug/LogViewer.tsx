import { useDeferredValue, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { cn, Spinner } from '@heroui/react';
import { GroupedVirtuoso } from 'react-virtuoso';

import { groupLogEntries, useDebugLogsStore } from '@/entities/log';
import { LogFilters } from './LogFilters';
import { LogGroupHeader } from './LogGroupHeader';
import { LogItemRow } from './LogItemRow';
import { LogSearch } from './LogSearch';

export const LogViewer = () => {
  const { t, i18n } = useTranslation();

  const { isLoading, error, searchQuery, selectedLevel, parsedEntries } = useDebugLogsStore(
    useShallow(state => ({
      parsedEntries: state.parsedEntries,
      isLoading: state.isLoading,
      error: state.error,
      searchQuery: state.searchQuery,
      selectedLevel: state.selectedLevel,
    })),
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredLevel = useDeferredValue(selectedLevel);
  const isPending = searchQuery !== deferredSearchQuery || selectedLevel !== deferredLevel;

  const filteredEntries = useMemo(() => {
    return parsedEntries.filter(entry => {
      const matchesSearch = deferredSearchQuery
        ? entry.message.toLowerCase().includes(deferredSearchQuery.toLowerCase())
        : true;
      const matchesLevel = deferredLevel === 'ALL' ? true : entry.level === deferredLevel;

      return matchesSearch && matchesLevel;
    });
  }, [parsedEntries, deferredSearchQuery, deferredLevel]);

  const { flatEntries, groupCounts, groups } = useMemo(() => {
    return groupLogEntries(filteredEntries, i18n.language);
  }, [filteredEntries, i18n.language]);

  const hasFilteredEntries = flatEntries.length > 0;

  const renderConsoleContent = () => {
    if (isLoading && !hasFilteredEntries) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" />
        </div>
      );
    }

    if (error && !hasFilteredEntries) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-danger-soft-foreground">
          <span>{t($ => $.settings.sections.debug.groups.logs.error)}</span>
        </div>
      );
    }

    if (!hasFilteredEntries) {
      return (
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-xs">
          {t($ => $.settings.sections.debug.groups.logs.empty)}
        </div>
      );
    }

    return (
      <GroupedVirtuoso
        groupCounts={groupCounts}
        groupContent={groupIndex => <LogGroupHeader dateStr={groups[groupIndex].dateStr} />}
        itemContent={index => <LogItemRow entry={flatEntries[index]} />}
        computeItemKey={index => flatEntries[index]?.id ?? index}
        initialTopMostItemIndex={flatEntries.length - 1}
        followOutput={isAtBottom => (isAtBottom ? 'auto' : false)}
        style={{ flex: 1 }}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Controls Bar: Search & Filter */}
      <div className="flex flex-col gap-3">
        <LogSearch />
        <LogFilters />
      </div>

      {/* Console Output Screen */}
      <div
        className={cn(
          'flex h-100 flex-col overflow-hidden px-4 py-2',
          'rounded-xl bg-surface-secondary font-mono',
          'transition-opacity duration-300',
          isPending && 'opacity-60',
        )}
      >
        {renderConsoleContent()}
      </div>
    </div>
  );
};
