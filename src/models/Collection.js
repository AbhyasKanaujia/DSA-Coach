const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  problemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isEditable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

collectionSchema.index({ createdBy: 1 });
collectionSchema.index({ isPublic: 1 });
collectionSchema.index({ problemIds: 1 });

module.exports = mongoose.model('Collection', collectionSchema);