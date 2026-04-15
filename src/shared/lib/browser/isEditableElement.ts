export const isEditableElement = (
  element: HTMLElement,
): element is HTMLInputElement | HTMLTextAreaElement => {
  if (element instanceof HTMLInputElement) {
    if (element.disabled || element.readOnly) {
      return false;
    }

    const nonTextInputTypes = [
      'button',
      'checkbox',
      'color',
      'file',
      'hidden',
      'image',
      'radio',
      'range',
      'reset',
      'submit',
    ];

    return !nonTextInputTypes.includes(element.type);
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  return false;
};
