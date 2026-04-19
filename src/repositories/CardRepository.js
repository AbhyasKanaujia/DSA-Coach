const Card = require('../models/Card');

class CardRepository {
  async create(cardData) {
    const card = new Card(cardData);
    return await card.save();
  }

  async findById(cardId, userId) {
    return await Card.findOne({ _id: cardId, userId });
  }

  async findAll(userId, filters = {}, pagination = {}) {
    const query = { userId, ...filters };
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    return await Card.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(cardId, userId, updates) {
    return await Card.findOneAndUpdate(
      { _id: cardId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  async delete(cardId, userId) {
    return await Card.findOneAndDelete({ _id: cardId, userId });
  }

  async findDueCards(userId, now, limit = 10) {
    return await Card.find({
      userId,
      dueDate: { $lte: now }
    })
    .sort({ dueDate: 1 })
    .limit(limit);
  }

  async countDueCards(userId, now) {
    return await Card.countDocuments({
      userId,
      dueDate: { $lte: now }
    });
  }

  async updateSR(cardId, userId, srFields) {
    return await Card.findOneAndUpdate(
      { _id: cardId, userId },
      { $set: srFields },
      { new: true }
    );
  }

  async incrementLapse(cardId, userId) {
    return await Card.findOneAndUpdate(
      { _id: cardId, userId },
      { $inc: { lapseCount: 1 } },
      { new: true }
    );
  }

  async addSolution(cardId, userId, solution) {
    return await Card.findOneAndUpdate(
      { _id: cardId, userId },
      { $push: { solutions: solution } },
      { new: true }
    );
  }

  async updateSolution(cardId, userId, solutionIndex, updates) {
    const updateOps = {};
    for (const [field, value] of Object.entries(updates)) {
      updateOps[`solutions.${solutionIndex}.${field}`] = value;
    }

    return await Card.findOneAndUpdate(
      { _id: cardId, userId },
      { $set: updateOps },
      { new: true }
    );
  }
}

module.exports = new CardRepository();