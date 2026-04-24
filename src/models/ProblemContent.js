const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
}, { _id: false });

const solutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  intuition: {
    type: String,
    required: true
  },
  steps: [{
    type: String
  }],
  codeSnippets: {
    type: [codeSnippetSchema],
    required: true
  },
  timeComplexity: {
    type: String,
    required: true
  },
  spaceComplexity: {
    type: String,
    required: true
  }
}, { _id: false });

const problemContentSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    unique: true
  },
  solutions: {
    type: [solutionSchema],
    required: true,
    validate: {
      validator: function(solutions) {
        return solutions.length > 0;
      },
      message: 'Problem must have at least one solution'
    }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProblemContent', problemContentSchema);