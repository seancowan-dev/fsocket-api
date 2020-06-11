module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SERVER_URL: process.env.VERCEL_URL || "http://localhost:8000",
    ORIGIN_URL: "https://fsocket-client.now.sh" || "http://localhost:3000"
  }