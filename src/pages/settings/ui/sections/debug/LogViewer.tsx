import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { cn, Spinner } from '@heroui/react';
import { GroupedVirtuoso } from 'react-virtuoso';

import { groupLogEntries, useDebugLogsStore } from '@/entities/log';
import { LogFilters } from './LogFilters';
import { LogGroupHeader } from './LogGroupHeader';
import { LogItemRow } from './LogItemRow';
import { LogSearch } from './LogSearch';
import { LogViewerHeader } from './LogViewerHeader';

const START_INDEX = 100_000;

const virtuosoComponents = {
  Header: LogViewerHeader,
};

export const LogViewer = () => {
  const { t, i18n } = useTranslation();
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);

  const {
    error,
    hasMore,
    isLoading,
    isLoadingOlder,
    loadOlderLogs,
    parsedEntries,
    searchQuery,
    selectedLevel,
  } = useDebugLogsStore(
    useShallow(state => ({
      error: state.error,
      hasMore: state.hasMore,
      isLoading: state.isLoading,
      isLoadingOlder: state.isLoadingOlder,
      loadOlderLogs: state.loadOlderLogs,
      parsedEntries: state.parsedEntries,
      searchQuery: state.searchQuery,
      selectedLevel: state.selectedLevel,
    })),
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredLevel = useDeferredValue(selectedLevel);
  const deferredEntries = useDeferredValue(parsedEntries);
  const isPending =
    searchQuery !== deferredSearchQuery ||
    selectedLevel !== deferredLevel ||
    parsedEntries !== deferredEntries;

  const filteredEntries = useMemo(() => {
    return deferredEntries.filter(entry => {
      const matchesSearch = deferredSearchQuery
        ? entry.message.toLowerCase().includes(deferredSearchQuery.toLowerCase())
        : true;
      const matchesLevel = deferredLevel === 'ALL' ? true : entry.level === deferredLevel;

      return matchesSearch && matchesLevel;
    });
  }, [deferredEntries, deferredSearchQuery, deferredLevel]);

  const { flatEntries, groupCounts, groups } = useMemo(() => {
    return groupLogEntries(filteredEntries, i18n.language);
  }, [filteredEntries, i18n.language]);

  const hasFilteredEntries = flatEntries.length > 0;

  const handleStartReached = useCallback(async () => {
    if (isLoadingOlder || !hasMore) {
      return;
    }

    const addedCount = await loadOlderLogs();
    if (addedCount > 0) {
      setFirstItemIndex(prev => prev - addedCount);
    }
  }, [isLoadingOlder, hasMore, loadOlderLogs]);

  const virtuosoContext = useMemo(
    () => ({
      isLoadingOlder,
    }),
    [isLoadingOlder],
  );

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
        components={virtuosoComponents}
        context={virtuosoContext}
        firstItemIndex={firstItemIndex}
        followOutput={isAtBottom => (isAtBottom ? 'auto' : false)}
        groupContent={groupIndex => <LogGroupHeader dateStr={groups[groupIndex].dateStr} />}
        groupCounts={groupCounts}
        initialTopMostItemIndex={flatEntries.length > 0 ? flatEntries.length - 1 : undefined}
        itemContent={index => {
          const entry = flatEntries[index - firstItemIndex];

          if (!entry) {
            return null;
          }

          return <LogItemRow entry={entry} />;
        }}
        startReached={handleStartReached}
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
