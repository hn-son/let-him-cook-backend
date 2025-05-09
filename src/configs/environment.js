require('dotenv').config();

const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    APP_PORT: process.env.APP_PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_NAME: process.env.DATABASE_NAME
};

module.exports = { env };
