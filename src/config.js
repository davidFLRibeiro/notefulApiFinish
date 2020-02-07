module.exports = {
  PORT: process.env.PORT || 1000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgres://pmriwwvhksseut:188a756cd8fc092d0d63fe3b5f76da125d2092215fc154ea21350e598d032caf@ec2-3-214-53-225.compute-1.amazonaws.com:5432/db8t4kjmev1av1',
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    'noteful-test://dunder_mifflin@localhost/noteful-test'
};
