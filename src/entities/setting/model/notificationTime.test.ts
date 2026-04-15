import { deserializeNotificationTimes, serializeNotificationTimes } from './notificationTime';

describe('notificationTime utilities', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-1234-1234-1234567890ab');
  });

  test('correctly serializes NotificationTime objects into seconds array', () => {
    const times = [
      { id: '1', seconds: 30 },
      { id: '2', seconds: 60 },
    ];

    const result = serializeNotificationTimes(times);

    expect(result).toEqual([30, 60]);
  });

  test('correctly deserializes seconds array into NotificationTime objects', () => {
    const result = deserializeNotificationTimes([30, 60]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: '12345678-1234-1234-1234-1234567890ab', seconds: 30 });
    expect(result[1]).toEqual({ id: '12345678-1234-1234-1234-1234567890ab', seconds: 60 });
  });
});
