import { describe, expect, it } from 'vitest';
import { normalizeApiBase } from '@/services/api';

describe('normalizeApiBase', () => {
  it('maps the cPanel application URL to its API mount', () => {
    expect(normalizeApiBase('https://egyhost1.com/server')).toBe('https://egyhost1.com/server/api');
    expect(normalizeApiBase('https://egyhost1.com/server/')).toBe('https://egyhost1.com/server/api');
  });

  it('does not duplicate an existing API mount', () => {
    expect(normalizeApiBase('https://egyhost1.com/server/api')).toBe('https://egyhost1.com/server/api');
  });
});
