import { isSelectableElement } from './isSelectableElement';

describe('isSelectableElement', () => {
  test('should return true when userSelect is not none', () => {
    const div = document.createElement('div');
    expect(isSelectableElement(div)).toBe(true);
  });

  test('should return false when userSelect is none', () => {
    const div = document.createElement('div');
    // Stub getComputedStyle userSelect to be 'none'
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      userSelect: 'none',
    } as CSSStyleDeclaration);

    expect(isSelectableElement(div)).toBe(false);
  });
});
