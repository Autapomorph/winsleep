import { describe, expect, test, vi } from 'vitest';

import { GitHubUpdateProvider } from './providers/github.provider';
import { ProxyUpdateProvider } from './providers/proxy.provider';
import { type UpdateProvider } from './update.interface';
import { UpdateService } from './update.service';

describe('UpdateService', () => {
  test('returns release from primary provider when available', async () => {
    const primaryProvider: UpdateProvider = {
      name: 'primary',
      fetchReleaseNotes: vi.fn().mockResolvedValue({
        notes: 'Primary notes',
        releasedAt: '2026-09-20',
        tags: ['New'],
        version: '1.2.3',
      }),
    };

    const secondaryProvider: UpdateProvider = {
      name: 'secondary',
      fetchReleaseNotes: vi.fn(),
    };

    const service = new UpdateService([primaryProvider, secondaryProvider]);
    const result = await service.fetchReleaseNotes('1.2.3');

    expect(result).toEqual({
      notes: 'Primary notes',
      releasedAt: '2026-09-20',
      tags: ['New'],
      version: '1.2.3',
    });
    expect(primaryProvider.fetchReleaseNotes).toHaveBeenCalledWith('1.2.3');
    expect(secondaryProvider.fetchReleaseNotes).not.toHaveBeenCalled();
  });

  test('falls back to secondary provider when primary returns null', async () => {
    const primaryProvider: UpdateProvider = {
      name: 'primary',
      fetchReleaseNotes: vi.fn().mockResolvedValue(null),
    };

    const secondaryProvider: UpdateProvider = {
      name: 'secondary',
      fetchReleaseNotes: vi.fn().mockResolvedValue({
        notes: 'Secondary notes',
        releasedAt: '2026-09-20',
        tags: [],
        version: '1.2.3',
      }),
    };

    const service = new UpdateService([primaryProvider, secondaryProvider]);
    const result = await service.fetchReleaseNotes('1.2.3');

    expect(result).toEqual({
      notes: 'Secondary notes',
      releasedAt: '2026-09-20',
      tags: [],
      version: '1.2.3',
    });
    expect(primaryProvider.fetchReleaseNotes).toHaveBeenCalledWith('1.2.3');
    expect(secondaryProvider.fetchReleaseNotes).toHaveBeenCalledWith('1.2.3');
  });

  test('falls back to secondary provider when primary throws', async () => {
    const primaryProvider: UpdateProvider = {
      name: 'primary',
      fetchReleaseNotes: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    const secondaryProvider: UpdateProvider = {
      name: 'secondary',
      fetchReleaseNotes: vi.fn().mockResolvedValue({
        notes: 'Secondary notes',
        version: '1.2.3',
      }),
    };

    const service = new UpdateService([primaryProvider, secondaryProvider]);
    const result = await service.fetchReleaseNotes('1.2.3');

    expect(result.notes).toBe('Secondary notes');
  });

  test('throws error when all providers fail', async () => {
    const provider: UpdateProvider = {
      name: 'failing',
      fetchReleaseNotes: vi.fn().mockResolvedValue(null),
    };

    const service = new UpdateService([provider]);

    await expect(service.fetchReleaseNotes('9.9.9')).rejects.toThrow(
      'Release notes not found for version: 9.9.9',
    );
  });

  test('fetches available versions from the first provider supporting it', async () => {
    const providerWithoutVersions: UpdateProvider = {
      name: 'no-versions',
      fetchReleaseNotes: vi.fn(),
    };

    const providerWithVersions: UpdateProvider = {
      name: 'with-versions',
      fetchAvailableVersions: vi.fn().mockResolvedValue(['1.2.0', '1.1.0']),
      fetchReleaseNotes: vi.fn(),
    };

    const service = new UpdateService([providerWithoutVersions, providerWithVersions]);
    const versions = await service.fetchAvailableVersions();

    expect(versions).toEqual(['1.2.0', '1.1.0']);
  });

  test('returns empty array when all providers fail to provide versions', async () => {
    const provider: UpdateProvider = {
      name: 'failing',
      fetchAvailableVersions: vi.fn().mockResolvedValue(null),
      fetchReleaseNotes: vi.fn(),
    };

    const service = new UpdateService([provider]);
    const versions = await service.fetchAvailableVersions();

    expect(versions).toEqual([]);
  });

  test('resolves release url from provider supporting it', () => {
    const provider: UpdateProvider = {
      name: 'with-url',
      fetchReleaseNotes: vi.fn(),
      getReleaseUrl: (ver: string) => `https://example.com/releases/${ver}`,
      getReleasesUrl: () => 'https://example.com/releases',
    };

    const service = new UpdateService([provider]);

    expect(service.getReleaseUrl('1.0.0')).toBe('https://example.com/releases/1.0.0');
    expect(service.getReleasesUrl()).toBe('https://example.com/releases');
  });
});

describe('ProxyUpdateProvider', () => {
  test('fetches and maps release notes correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          notes: 'Proxy notes content',
          releasedAt: '2026-09-22',
          tags: ['feature'],
          version: '1.3.0',
        }),
        { status: 200 },
      ),
    );

    const provider = new ProxyUpdateProvider();
    const result = await provider.fetchReleaseNotes('1.3.0');

    expect(result).toEqual({
      notes: 'Proxy notes content',
      releasedAt: '2026-09-22',
      tags: ['feature'],
      version: '1.3.0',
    });
  });

  test('returns null when proxy returns non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    const provider = new ProxyUpdateProvider();
    const result = await provider.fetchReleaseNotes('unknown');

    expect(result).toBeNull();
  });

  test('fetches available versions correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ versions: ['1.3.0', '1.2.0'] }), { status: 200 }),
    );

    const provider = new ProxyUpdateProvider();
    const result = await provider.fetchAvailableVersions();

    expect(result).toEqual(['1.3.0', '1.2.0']);
  });
});

describe('GitHubUpdateProvider', () => {
  test('fetches and maps github release notes correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          body: 'GitHub release markdown',
          published_at: '2026-09-21T10:00:00Z',
        }),
        { status: 200 },
      ),
    );

    const provider = new GitHubUpdateProvider();
    const result = await provider.fetchReleaseNotes('v1.3.0');

    expect(result).toEqual({
      notes: 'GitHub release markdown',
      releasedAt: '2026-09-21T10:00:00Z',
      tags: [],
      url: provider.getReleaseUrl('v1.3.0'),
      version: '1.3.0',
    });
  });

  test('returns release and releases URLs correctly', () => {
    const provider = new GitHubUpdateProvider();

    expect(provider.getReleaseUrl('1.3.0')).toContain('/releases/tag/1.3.0');
    expect(provider.getReleaseUrl('v1.3.0')).toContain('/releases/tag/1.3.0');
    expect(provider.getReleasesUrl()).toContain('/releases');
  });

  test('returns null when GitHub API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    const provider = new GitHubUpdateProvider();
    const result = await provider.fetchReleaseNotes('v1.3.0');

    expect(result).toBeNull();
  });
});
