const mongoose = require('mongoose');
const env = require('../src/config/env');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
