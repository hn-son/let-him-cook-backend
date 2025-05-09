const mongoose = require('mongoose');
const { env } = require('./environment');
console.log({env})
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI, clientOptions);
        console.log('\x1b[32m%s\x1b[0m', '✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB connection error:');
        console.error('\x1b[31m%s\x1b[0m', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
