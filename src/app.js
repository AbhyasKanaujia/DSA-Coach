require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { ensureAdminUser, migrateCreatedBy } = require('./config/seed');

const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collections');
const libraryRoutes = require('./routes/library');
const problemRoutes = require('./routes/problems');
const sessionRoutes = require('./routes/sessions');
const reviewRoutes = require('./routes/reviews');
const progressRoutes = require('./routes/progress');

const app = express();

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/progress', progressRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

if (require.main === module) {
  connectDB().then(async () => {
    const adminUser = await ensureAdminUser();
    await migrateCreatedBy(adminUser._id);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;