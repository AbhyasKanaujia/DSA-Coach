const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');

describe('SpacedRepetitionService', () => {
  describe('reviewCard', () => {
    const mockCard = {
      easeFactor: 2.5,
      interval: 0,
      repetition: 0,
      lapseCount: 0
    };

    describe('quality mapping', () => {
      it('should map easy to quality 5', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.lastQuality).toBe(5);
      });

      it('should map medium to quality 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'medium');
        expect(result.lastQuality).toBe(3);
      });

      it('should map hard to quality 1', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.lastQuality).toBe(1);
      });

      it('should throw error for invalid quality', () => {
        expect(() => {
          spacedRepetitionService.reviewCard(mockCard, 'invalid');
        }).toThrow('Invalid quality');
      });
    });

    describe('ease factor calculation', () => {
      it('should increase ease factor for easy reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.easeFactor).toBeGreaterThan(2.5);
      });

      it('should decrease ease factor for hard reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.easeFactor).toBeLessThanOrEqual(2.5);
      });

      it('should clamp ease factor to minimum 1.3', () => {
        const lowEFCard = { ...mockCard, easeFactor: 1.35 };
        const result = spacedRepetitionService.reviewCard(lowEFCard, 'hard');
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should calculate ease factor correctly for medium reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'medium');
        expect(result.easeFactor).toBeCloseTo(2.36, 1);
      });
    });

    describe('interval progression', () => {
      it('should set interval to 1 for first successful review', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.interval).toBe(1);
      });

      it('should set interval to 6 for second successful review', () => {
        const cardWithOneRep = { ...mockCard, repetition: 1 };
        const result = spacedRepetitionService.reviewCard(cardWithOneRep, 'easy');
        expect(result.interval).toBe(6);
      });

      it('should multiply interval by ease factor for subsequent reviews', () => {
        const cardWithTwoReps = { ...mockCard, repetition: 2, interval: 6, easeFactor: 2.5 };
        const result = spacedRepetitionService.reviewCard(cardWithTwoReps, 'easy');
        expect(result.interval).toBe(16);
      });
    });

    describe('lapse behavior', () => {
      it('should reset repetition to 0 for quality < 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.repetition).toBe(0);
      });

      it('should reset interval to 1 for quality < 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.interval).toBe(1);
      });

      it('should increment lapse count for quality < 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.lapseCount).toBe(1);
      });

      it('should increment repetition for quality >= 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'medium');
        expect(result.repetition).toBe(1);
      });
    });

    describe('due date calculation', () => {
      it('should calculate due date correctly', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        const expectedDue = new Date();
        expectedDue.setDate(expectedDue.getDate() + 1);
        expect(result.dueDate.toDateString()).toBe(expectedDue.toDateString());
      });

      it('should set lastReviewed to current time', () => {
        const before = new Date();
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        const after = new Date();
        expect(result.lastReviewed).toBeInstanceOf(Date);
        expect(result.lastReviewed.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.lastReviewed.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('edge cases', () => {
      it('should handle quality = 3 boundary', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'medium');
        expect(result.repetition).toBe(1);
        expect(result.lapseCount).toBe(0);
      });

      it('should handle multiple consecutive hard reviews', () => {
        let card = { ...mockCard };
        for (let i = 0; i < 5; i++) {
          card = spacedRepetitionService.reviewCard(card, 'hard');
        }
        expect(card.lapseCount).toBe(5);
        expect(card.repetition).toBe(0);
      });

      it('should handle multiple consecutive easy reviews', () => {
        let card = { ...mockCard };
        for (let i = 0; i < 5; i++) {
          card = spacedRepetitionService.reviewCard(card, 'easy');
        }
        expect(card.repetition).toBe(5);
        expect(card.lapseCount).toBe(0);
        expect(card.easeFactor).toBeGreaterThan(2.5);
      });
    });
  });

  describe('initializeSR', () => {
    it('should initialize SR fields with default values', () => {
      const result = spacedRepetitionService.initializeSR();
      expect(result).toEqual({
        easeFactor: 2.5,
        interval: 0,
        repetition: 0,
        dueDate: expect.any(Date),
        lastReviewed: null,
        lastQuality: null,
        lapseCount: 0
      });
    });

    it('should set dueDate to current time', () => {
      const before = new Date();
      const result = spacedRepetitionService.initializeSR();
      const after = new Date();
      expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.dueDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});