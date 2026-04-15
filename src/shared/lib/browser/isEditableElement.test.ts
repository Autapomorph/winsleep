import { isEditableElement } from './isEditableElement';

describe('isEditableElement', () => {
  test('should return true for text input elements', () => {
    const input = document.createElement('input');
    input.type = 'text';
    expect(isEditableElement(input)).toBe(true);
  });

  test('should return false for disabled or read-only text inputs', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.disabled = true;
    expect(isEditableElement(input)).toBe(false);

    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.readOnly = true;
    expect(isEditableElement(input2)).toBe(false);
  });

  test('should return false for non-text input types', () => {
    const btn = document.createElement('input');
    btn.type = 'button';
    expect(isEditableElement(btn)).toBe(false);

    const radio = document.createElement('input');
    radio.type = 'radio';
    expect(isEditableElement(radio)).toBe(false);
  });

  test('should return true for active textareas', () => {
    const textarea = document.createElement('textarea');
    expect(isEditableElement(textarea)).toBe(true);
  });

  test('should return false for disabled or read-only textareas', () => {
    const textarea = document.createElement('textarea');
    textarea.disabled = true;
    expect(isEditableElement(textarea)).toBe(false);
  });

  test('should return false for div or other elements', () => {
    const div = document.createElement('div');
    expect(isEditableElement(div)).toBe(false);
  });
});
