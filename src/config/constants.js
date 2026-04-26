module.exports = {
  SR: {
    DEFAULT_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    QUALITY_MAP: {
      easy: 5,
      hard: 3,
      again: 1
    },
    INTERVALS: [1, 6],
    DEFAULT_SESSION_SIZE: 10,
    DEFAULT_MAX_NEW: 3,
    MAX_SESSION_SIZE: 50,
    MAX_NEW_PER_SESSION: 20
  },
  SESSION: {
    STATUS: {
      ACTIVE: 'active',
      COMPLETED: 'completed',
      ABANDONED: 'abandoned'
    }
  },
  AUTH: {
    JWT_EXPIRES_IN: '7d'
  },
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || 'admin@dsaflashcard.local',
    NAME: 'DSA Coach'
  }
};