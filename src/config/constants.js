module.exports = {
  SR: {
    DEFAULT_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    QUALITY_MAP: {
      easy: 5,
      medium: 3,
      hard: 1
    },
    INTERVALS: [1, 6]
  },
  AUTH: {
    JWT_EXPIRES_IN: '7d'
  },
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || 'admin@dsaflashcard.local',
    NAME: 'DSA Coach'
  }
};