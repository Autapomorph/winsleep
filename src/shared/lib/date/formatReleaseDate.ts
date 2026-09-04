/**
 * Formats a release date string into localized human-readable text using toLocaleDateString.
 * Handles pure date strings ("YYYY-MM-DD") without UTC timezone shifts, as well as full ISO-8601 strings.
 */
export const formatReleaseDate = (
  releasedAt: string,
  locale?: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string => {
  if (!releasedAt) {
    return '';
  }

  const trimmed = releasedAt.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);

  let date: Date;
  if (isDateOnly) {
    const [year, month, day] = trimmed.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(trimmed);
  }

  if (Number.isNaN(date.getTime())) {
    return releasedAt;
  }

  return date.toLocaleDateString(locale, options);
};
