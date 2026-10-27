import { describe, it, expect } from 'vitest';
import {
  tokens,
  lightTokens,
  darkTokens,
  contrastRatio,
} from '@/styles/tokens';

describe('WCAG 2.1 Theme Contrast Ratios', () => {
  describe('Light Theme Contrast', () => {
    it('text on background meets 4.5:1 for normal text', () => {
      const ratio = contrastRatio(lightTokens.foreground, lightTokens.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text on card meets 4.5:1 for normal text', () => {
      const ratio = contrastRatio(lightTokens.cardForeground, lightTokens.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('primary button text meets 4.5:1', () => {
      const ratio = contrastRatio(lightTokens.onPrimary, lightTokens.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('money-in (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyIn, lightTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(lightTokens.moneyIn, lightTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-in-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyInStrong, lightTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightTokens.moneyInStrong, lightTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('money-out (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyOut, lightTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(lightTokens.moneyOut, lightTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-out-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyOutStrong, lightTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightTokens.moneyOutStrong, lightTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('money-neutral (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyNeutral, lightTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(lightTokens.moneyNeutral, lightTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-neutral-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(lightTokens.moneyNeutralStrong, lightTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightTokens.moneyNeutralStrong, lightTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('nav active text meets 4.5:1 on active background', () => {
      const ratio = contrastRatio(lightTokens.navActiveFg, lightTokens.navActiveBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('nav inactive meets 3:1 on bottom nav bar / card surface', () => {
      const ratio = contrastRatio(lightTokens.navInactive, lightTokens.card);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('input border meets 3:1 against card surface and background', () => {
      expect(contrastRatio(lightTokens.input, lightTokens.card)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(lightTokens.input, lightTokens.background)).toBeGreaterThanOrEqual(3.0);
    });

    it('focus ring meets 3:1 against surface and background', () => {
      expect(contrastRatio(lightTokens.ring, lightTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(lightTokens.ring, lightTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('placeholder meets 4.5:1 for muted text against card and input surface', () => {
      const ratio = contrastRatio(lightTokens.mutedForeground, lightTokens.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Dark Theme Contrast', () => {
    it('text on background meets 4.5:1 for normal text', () => {
      const ratio = contrastRatio(darkTokens.foreground, darkTokens.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text on card meets 4.5:1 for normal text', () => {
      const ratio = contrastRatio(darkTokens.cardForeground, darkTokens.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('primary button text meets 4.5:1', () => {
      const ratio = contrastRatio(darkTokens.onPrimary, darkTokens.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('money-in (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyIn, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.moneyIn, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-in-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyInStrong, darkTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(darkTokens.moneyInStrong, darkTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('money-out (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyOut, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.moneyOut, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-out-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyOutStrong, darkTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(darkTokens.moneyOutStrong, darkTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('money-neutral (large) meets 3:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyNeutral, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.moneyNeutral, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('money-neutral-strong (normal text) meets 4.5:1 on background and card', () => {
      expect(contrastRatio(darkTokens.moneyNeutralStrong, darkTokens.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(darkTokens.moneyNeutralStrong, darkTokens.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('nav active text meets 4.5:1 on active background', () => {
      const ratio = contrastRatio(darkTokens.navActiveFg, darkTokens.navActiveBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('nav inactive meets 3:1 on bottom nav bar / card surface', () => {
      expect(contrastRatio(darkTokens.navInactive, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.navInactive, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
    });

    it('input border meets 3:1 against card surface and background', () => {
      expect(contrastRatio(darkTokens.input, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.input, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
    });

    it('focus ring meets 3:1 against surface and background', () => {
      expect(contrastRatio(darkTokens.ring, darkTokens.background)).toBeGreaterThanOrEqual(3.0);
      expect(contrastRatio(darkTokens.ring, darkTokens.card)).toBeGreaterThanOrEqual(3.0);
    });

    it('placeholder meets 4.5:1 for muted text against card and input surface', () => {
      const ratio = contrastRatio(darkTokens.mutedForeground, darkTokens.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Tokens consistency', () => {
    it('defines tokens for both light and dark themes', () => {
      expect(tokens.light).toBeDefined();
      expect(tokens.dark).toBeDefined();
    });
  });
});
