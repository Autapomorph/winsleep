import { type ChangelogTag, CHANGELOG_TAGS } from '@/shared/config';

export const isChangelogTag = (val: unknown): val is ChangelogTag => {
  return (
    val === CHANGELOG_TAGS.NEW || val === CHANGELOG_TAGS.IMPROVED || val === CHANGELOG_TAGS.FIXED
  );
};
