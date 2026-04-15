import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, InputGroup } from '@heroui/react';
import { FaXmark } from 'react-icons/fa6';

import { useDebugLogsStore } from '@/entities/log';

export const LogSearch = () => {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery } = useDebugLogsStore(
    useShallow(state => ({
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
    })),
  );

  const handleSearchChange = (searchTerm: string) => {
    setSearchQuery(searchTerm);
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <InputGroup variant="secondary" className="w-full">
      <InputGroup.Input
        type="text"
        placeholder={t($ => $.settings.sections.debug.groups.logs.searchPlaceholder)}
        value={searchQuery}
        onChange={e => handleSearchChange(e.target.value)}
      />

      {searchQuery && (
        <InputGroup.Suffix className="pr-1">
          <Button
            isIconOnly
            variant="ghost"
            className="text-muted hover:text-foreground"
            onPress={handleClear}
            aria-label={t($ => $.settings.sections.debug.groups.logs.clearSearchBtn.aria.label)}
          >
            <FaXmark />
          </Button>
        </InputGroup.Suffix>
      )}
    </InputGroup>
  );
};
