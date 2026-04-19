const mongoose = require('mongoose');

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = {
  clearDatabase,
  disconnectDatabase
};