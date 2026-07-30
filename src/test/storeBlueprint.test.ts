import { describe, expect, it } from 'vitest';
import { normalizeStoreBlueprint } from '@/services/storeService';

describe('normalizeStoreBlueprint', () => {
  it('repairs incomplete AI output before creating a store', () => {
    const blueprint = normalizeStoreBlueprint({
      name: 'A'.repeat(120),
      config: {
        direction: 'sideways',
        colors: { ink: 'black', accent: '#ec4899' },
        hero: { title: 'متجر أحذية' },
        categories: [],
      },
      social: { instagram: 42 },
    }, 'متجر أحذية رياضية للشباب');

    expect(blueprint.name).toHaveLength(80);
    expect(blueprint.config.direction).toBe('rtl');
    expect(blueprint.config.colors.ink).toMatch(/^#[0-9a-f]{6}$/i);
    expect(blueprint.config.colors.accent).toBe('#ec4899');
    expect(blueprint.config.categories.length).toBeGreaterThan(0);
    expect(blueprint.social.instagram).toBe('');
  });
});
