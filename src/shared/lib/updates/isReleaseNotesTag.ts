import { type ReleaseNotesTag, RELEASE_NOTES_TAGS } from '@/shared/config';

export const isReleaseNotesTag = (val: unknown): val is ReleaseNotesTag => {
  return (
    val === RELEASE_NOTES_TAGS.NEW ||
    val === RELEASE_NOTES_TAGS.IMPROVED ||
    val === RELEASE_NOTES_TAGS.FIXED
  );
};
