const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.statusCode) {
    const response = { error: err.message };
    if (err.field) {
      response.field = err.field;
    }
    return res.status(err.statusCode).json(response);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  if (err.message === 'Email already registered') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  if (err.message === 'Invalid credentials') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (err.message === 'No token provided' || err.message === 'Invalid token') {
    return res.status(401).json({ error: err.message });
  }

  if (err.message === 'Card not found' || err.message === 'User not found' || err.message === 'Problem state not found' || err.message === 'Problem not found' || err.message === 'Problem content not found' || err.message === 'Collection not found' || err.message === 'Collection subscription not found' || err.message === 'User problem state not found') {
    return res.status(404).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;