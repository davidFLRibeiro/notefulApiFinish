module.exports = {
  PORT: process.env.PORT || 1000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL || 'noteful://dunder_mifflin@localhost/noteful',
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    'noteful-test://dunder_mifflin@localhost/noteful-test'
};
