import { BRAND, MASCOT, ANIMATED_MASCOT_FRAMES } from '../src/ui/brand.js';

describe('UI Brand & Mascot Configuration', () => {
  test('BRAND defines badge helper and official colors', () => {
    expect(typeof BRAND.badge).toBe('function');
    expect(typeof BRAND.successBadge).toBe('function');
    expect(typeof BRAND.infoBadge).toBe('function');
    expect(typeof BRAND.yellow).toBe('function');
  });

  test('MASCOT defines clean ASCII states without emojis', () => {
    expect(MASCOT.idle).toBe('[--]');
    expect(MASCOT.thinking).toBe('[..]');
    expect(MASCOT.success).toBe('[OK]');
    expect(MASCOT.searching).toBe('[>>]');
    expect(MASCOT.stats).toBe('[##]');
    expect(MASCOT.standup).toBe('[^^]');
  });

  test('ANIMATED_MASCOT_FRAMES contains sequential ASCII frames', () => {
    expect(Array.isArray(ANIMATED_MASCOT_FRAMES)).toBe(true);
    expect(ANIMATED_MASCOT_FRAMES.length).toBeGreaterThan(0);
    ANIMATED_MASCOT_FRAMES.forEach(frame => {
      expect(frame).toMatch(/^\[[.\-]+\]$/);
    });
  });
});
