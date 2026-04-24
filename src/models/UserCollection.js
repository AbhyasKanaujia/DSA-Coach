const mongoose = require('mongoose');

const userCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userCollectionSchema.index({ userId: 1, collectionId: 1 }, { unique: true });
userCollectionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('UserCollection', userCollectionSchema);