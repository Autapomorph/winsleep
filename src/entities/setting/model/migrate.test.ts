import { migrateSettings } from './migrate';

describe('migrateSettings', () => {
  test('migrates settings correctly and strips version', () => {
    const data = {
      version: 0,
      someValue: 'test',
    };

    const res = migrateSettings(data);

    expect(res.version).toBe(0);
    expect(res.settings).toEqual({ someValue: 'test' });
    expect(res.settings.version).toBeUndefined();
  });

  test('defaults to version 0 if no version property exists', () => {
    const data = {
      someValue: 'test',
    };

    const res = migrateSettings(data);

    expect(res.version).toBe(0);
    expect(res.settings).toEqual({ someValue: 'test' });
  });
});
