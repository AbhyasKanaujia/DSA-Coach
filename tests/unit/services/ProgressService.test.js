const progressService = require('../../../src/services/ProgressService');
const userRepository = require('../../../src/repositories/UserRepository');
const userProblemStateRepository = require('../../../src/repositories/UserProblemStateRepository');

jest.mock('../../../src/repositories/UserRepository');
jest.mock('../../../src/repositories/UserProblemStateRepository');

describe('ProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('should return progress with mastery breakdown', async () => {
      userRepository.findById.mockResolvedValue({
        _id: 'user123',
        stats: {
          totalReviews: 42,
          streak: 5,
          lastActiveDate: new Date('2026-04-24')
        }
      });

      userProblemStateRepository.countGroupByStatus.mockResolvedValue([
        { _id: 'new', count: 10 },
        { _id: 'learning', count: 15 },
        { _id: 'review', count: 8 },
        { _id: 'mastered', count: 3 }
      ]);

      const result = await progressService.getUserProgress('user123');

      expect(result.totalSolved).toBe(36);
      expect(result.totalReviewed).toBe(42);
      expect(result.streak).toBe(5);
      expect(result.masteryBreakdown).toEqual({
        new: 10,
        learning: 15,
        review: 8,
        mastered: 3
      });
    });

    it('should handle empty problem states', async () => {
      userRepository.findById.mockResolvedValue({
        _id: 'user123',
        stats: { totalReviews: 0, streak: 0, lastActiveDate: null }
      });

      userProblemStateRepository.countGroupByStatus.mockResolvedValue([]);

      const result = await progressService.getUserProgress('user123');

      expect(result.totalSolved).toBe(0);
      expect(result.totalReviewed).toBe(0);
      expect(result.masteryBreakdown).toEqual({
        new: 0,
        learning: 0,
        review: 0,
        mastered: 0
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(progressService.getUserProgress('nonexistent'))
        .rejects
        .toThrow('User not found');
    });

    it('should handle partial status counts', async () => {
      userRepository.findById.mockResolvedValue({
        _id: 'user123',
        stats: { totalReviews: 5, streak: 1, lastActiveDate: new Date() }
      });

      userProblemStateRepository.countGroupByStatus.mockResolvedValue([
        { _id: 'learning', count: 3 }
      ]);

      const result = await progressService.getUserProgress('user123');

      expect(result.totalSolved).toBe(3);
      expect(result.masteryBreakdown).toEqual({
        new: 0,
        learning: 3,
        review: 0,
        mastered: 0
      });
    });
  });
});