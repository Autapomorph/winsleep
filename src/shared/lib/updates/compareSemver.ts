export type SortDirection = 'asc' | 'desc';

export interface CompareSemverOptions {
  direction?: SortDirection;
  pinnedTop?: string;
}

/**
 * Compares two semantic version strings with configurable direction ('asc' | 'desc', defaults to 'desc').
 * Supports optional prefix 'v' (e.g. "v1.2.0" and "1.2.0").
 * Optionally accepts a `pinnedTop` string that is always ordered before any other version.
 */
export const compareSemver = (
  a: string,
  b: string,
  directionOrOptions: SortDirection | CompareSemverOptions = 'desc',
  pinnedTopArg?: string,
): number => {
  const direction: SortDirection =
    typeof directionOrOptions === 'string'
      ? directionOrOptions
      : (directionOrOptions.direction ?? 'desc');

  const pinnedTop =
    typeof directionOrOptions === 'object' ? directionOrOptions.pinnedTop : pinnedTopArg;

  if (pinnedTop) {
    if (a === pinnedTop && b === pinnedTop) {
      return 0;
    }

    if (a === pinnedTop) {
      return -1;
    }

    if (b === pinnedTop) {
      return 1;
    }
  }

  const parse = (version: string): [number, number, number] => {
    const parts = version
      .replace(/^v/, '')
      .split('.')
      .map(part => parseInt(part, 10) || 0);

    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };

  const [aMaj, aMin, aPatch] = parse(a);
  const [bMaj, bMin, bPatch] = parse(b);

  let diff = 0;
  if (aMaj !== bMaj) {
    diff = aMaj - bMaj;
  } else if (aMin !== bMin) {
    diff = aMin - bMin;
  } else {
    diff = aPatch - bPatch;
  }

  if (diff === 0) {
    return 0;
  }

  return direction === 'asc' ? diff : -diff;
};

/**
 * Convenience alias for compareSemver with descending order.
 */
export const compareSemverDesc = (a: string, b: string, pinnedTop?: string): number => {
  return compareSemver(a, b, 'desc', pinnedTop);
};
