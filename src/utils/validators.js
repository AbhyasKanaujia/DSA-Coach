class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    return email.toLowerCase().trim();
  },

  password: (password) => {
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', 'password');
    }
    return password;
  },

  name: (name) => {
    if (!name || name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters', 'name');
    }
    if (name.trim().length > 50) {
      throw new ValidationError('Name must be less than 50 characters', 'name');
    }
    return name.trim();
  },

  dailyGoal: (dailyGoal) => {
    const num = parseInt(dailyGoal, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      throw new ValidationError('Daily goal must be between 1 and 100', 'dailyGoal');
    }
    return num;
  },

  maxSessionSize: (maxSessionSize) => {
    const num = parseInt(maxSessionSize, 10);
    if (isNaN(num) || num < 1 || num > 50) {
      throw new ValidationError('Max session size must be between 1 and 50', 'maxSessionSize');
    }
    return num;
  },

  preferences: (preferences) => {
    if (!preferences || typeof preferences !== 'object') {
      throw new ValidationError('Invalid preferences', 'preferences');
    }

    const validated = {};
    if (preferences.dailyGoal !== undefined) {
      validated.dailyGoal = validators.dailyGoal(preferences.dailyGoal);
    }
    if (preferences.maxSessionSize !== undefined) {
      validated.maxSessionSize = validators.maxSessionSize(preferences.maxSessionSize);
    }

    return validated;
  }
};

const validateUserCreation = (data) => {
  const { email, password, name } = data;

  if (!email) {
    throw new ValidationError('Email is required', 'email');
  }
  if (!password) {
    throw new ValidationError('Password is required', 'password');
  }
  if (!name) {
    throw new ValidationError('Name is required', 'name');
  }

  return {
    email: validators.email(email),
    password: validators.password(password),
    name: validators.name(name)
  };
};

const validateUserUpdate = (updates) => {
  const validated = {};

  if (updates.name !== undefined) {
    validated.name = validators.name(updates.name);
  }

  if (updates.avatarUrl !== undefined) {
    if (typeof updates.avatarUrl !== 'string' || updates.avatarUrl.trim().length === 0) {
      throw new ValidationError('Invalid avatar URL', 'avatarUrl');
    }
    validated.avatarUrl = updates.avatarUrl.trim();
  }

  if (updates.preferences !== undefined) {
    validated.preferences = validators.preferences(updates.preferences);
  }

  return validated;
};

module.exports = {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  validateUserCreation,
  validateUserUpdate,
  validators
};