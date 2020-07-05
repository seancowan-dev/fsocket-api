module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SERVER_URL: process.env.VERCEL_URL || "http://localhost:8000",
    ORIGIN_URL: "http://localhost:3000",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://dunder_mifflin:password@localhost/fsocket",
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://dunder_mifflin:password@localhost/fsocket"
  }

  //"https://fsocket-client.now.sh" || 