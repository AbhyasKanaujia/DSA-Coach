const spacedRepetitionService = require('../../../src/services/SpacedRepetitionService');

describe('SpacedRepetitionService', () => {
  describe('computeStatusTransition', () => {
    it('should transition new to learning regardless of quality', () => {
      expect(spacedRepetitionService.computeStatusTransition('new', 'easy')).toBe('learning');
      expect(spacedRepetitionService.computeStatusTransition('new', 'hard')).toBe('learning');
      expect(spacedRepetitionService.computeStatusTransition('new', 'again')).toBe('learning');
    });

    it('should transition learning to review on easy', () => {
      expect(spacedRepetitionService.computeStatusTransition('learning', 'easy')).toBe('review');
    });

    it('should keep learning on hard', () => {
      expect(spacedRepetitionService.computeStatusTransition('learning', 'hard')).toBe('learning');
    });

    it('should transition learning to learning on again (lapse)', () => {
      expect(spacedRepetitionService.computeStatusTransition('learning', 'again')).toBe('learning');
    });

    it('should transition review to mastered on easy', () => {
      expect(spacedRepetitionService.computeStatusTransition('review', 'easy')).toBe('mastered');
    });

    it('should keep review on hard', () => {
      expect(spacedRepetitionService.computeStatusTransition('review', 'hard')).toBe('review');
    });

    it('should transition review to learning on again (lapse)', () => {
      expect(spacedRepetitionService.computeStatusTransition('review', 'again')).toBe('learning');
    });

    it('should keep mastered on easy', () => {
      expect(spacedRepetitionService.computeStatusTransition('mastered', 'easy')).toBe('mastered');
    });

    it('should keep mastered on hard', () => {
      expect(spacedRepetitionService.computeStatusTransition('mastered', 'hard')).toBe('mastered');
    });

    it('should transition mastered to learning on again (lapse)', () => {
      expect(spacedRepetitionService.computeStatusTransition('mastered', 'again')).toBe('learning');
    });

    it('should throw error for invalid quality', () => {
      expect(() => {
        spacedRepetitionService.computeStatusTransition('new', 'invalid');
      }).toThrow('Invalid quality');
    });
  });

  describe('reviewCard', () => {
    const mockCard = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lapseCount: 0,
      status: 'new'
    };

    describe('quality mapping', () => {
      it('should map easy to quality 5', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.lastResult).toBe('easy');
      });

      it('should map hard to quality 3', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.lastResult).toBe('hard');
      });

      it('should map again to quality 1', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'again');
        expect(result.lastResult).toBe('again');
      });

      it('should throw error for invalid quality', () => {
        expect(() => {
          spacedRepetitionService.reviewCard(mockCard, 'invalid');
        }).toThrow('Invalid quality');
      });
    });

    describe('status in return value', () => {
      it('should include status in return value', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.status).toBe('learning');
      });

      it('should transition status from new to learning', () => {
        const result = spacedRepetitionService.reviewCard({ ...mockCard, status: 'new' }, 'easy');
        expect(result.status).toBe('learning');
      });

      it('should transition learning to review on easy', () => {
        const result = spacedRepetitionService.reviewCard({ ...mockCard, status: 'learning' }, 'easy');
        expect(result.status).toBe('review');
      });

      it('should transition review to mastered on easy', () => {
        const result = spacedRepetitionService.reviewCard({ ...mockCard, status: 'review' }, 'easy');
        expect(result.status).toBe('mastered');
      });

      it('should default to new status if not provided', () => {
        const cardWithoutStatus = { easeFactor: 2.5, interval: 0, repetitions: 0, lapseCount: 0 };
        const result = spacedRepetitionService.reviewCard(cardWithoutStatus, 'easy');
        expect(result.status).toBe('learning');
      });
    });

    describe('ease factor calculation', () => {
      it('should increase ease factor for easy reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.easeFactor).toBeGreaterThan(2.5);
      });

      it('should decrease ease factor for again reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'again');
        expect(result.easeFactor).toBeLessThanOrEqual(2.5);
      });

      it('should clamp ease factor to minimum 1.3', () => {
        const lowEFCard = { ...mockCard, easeFactor: 1.35 };
        const result = spacedRepetitionService.reviewCard(lowEFCard, 'again');
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should calculate ease factor correctly for hard reviews', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.easeFactor).toBeCloseTo(2.36, 1);
      });
    });

    describe('interval progression', () => {
      it('should set interval to 1 for first successful review', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        expect(result.interval).toBe(1);
      });

      it('should set interval to 6 for second successful review', () => {
        const cardWithOneRep = { ...mockCard, repetitions: 1 };
        const result = spacedRepetitionService.reviewCard(cardWithOneRep, 'easy');
        expect(result.interval).toBe(6);
      });

      it('should multiply interval by ease factor for subsequent reviews', () => {
        const cardWithTwoReps = { ...mockCard, repetitions: 2, interval: 6, easeFactor: 2.5 };
        const result = spacedRepetitionService.reviewCard(cardWithTwoReps, 'easy');
        expect(result.interval).toBe(16);
      });
    });

    describe('lapse behavior', () => {
      it('should reset repetitions to 0 for again (quality < 3)', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'again');
        expect(result.repetitions).toBe(0);
      });

      it('should reset interval to 1 for again (quality < 3)', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'again');
        expect(result.interval).toBe(1);
      });

      it('should increment lapse count for again (quality < 3)', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'again');
        expect(result.lapseCount).toBe(1);
      });

      it('should increment repetitions for hard (quality >= 3)', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.repetitions).toBe(1);
      });
    });

    describe('due date calculation', () => {
      it('should calculate due date correctly', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        const expectedDue = new Date();
        expectedDue.setDate(expectedDue.getDate() + 1);
        expect(result.nextReviewAt.toDateString()).toBe(expectedDue.toDateString());
      });

      it('should set lastReviewedAt to current time', () => {
        const before = new Date();
        const result = spacedRepetitionService.reviewCard(mockCard, 'easy');
        const after = new Date();
        expect(result.lastReviewedAt).toBeInstanceOf(Date);
        expect(result.lastReviewedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.lastReviewedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('edge cases', () => {
      it('should handle quality = 3 boundary (hard)', () => {
        const result = spacedRepetitionService.reviewCard(mockCard, 'hard');
        expect(result.repetitions).toBe(1);
        expect(result.lapseCount).toBe(0);
      });

      it('should handle multiple consecutive again reviews', () => {
        let card = { ...mockCard };
        for (let i = 0; i < 5; i++) {
          card = spacedRepetitionService.reviewCard(card, 'again');
        }
        expect(card.lapseCount).toBe(5);
        expect(card.repetitions).toBe(0);
      });

      it('should handle multiple consecutive easy reviews', () => {
        let card = { ...mockCard };
        for (let i = 0; i < 5; i++) {
          card = spacedRepetitionService.reviewCard(card, 'easy');
        }
        expect(card.repetitions).toBe(5);
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
        repetitions: 0,
        nextReviewAt: expect.any(Date),
        lastReviewedAt: null,
        lastResult: null,
        lapseCount: 0
      });
    });

    it('should set nextReviewAt to current time', () => {
      const before = new Date();
      const result = spacedRepetitionService.initializeSR();
      const after = new Date();
      expect(result.nextReviewAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.nextReviewAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});