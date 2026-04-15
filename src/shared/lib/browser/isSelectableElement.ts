export const isSelectableElement = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.userSelect !== 'none';
};
