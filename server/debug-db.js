require('dotenv').config();
const mongoose = require('mongoose');
const Comment = require('./models/Comment');

async function debug() {
    console.log('--- DEBUG DB STATS ---');
    console.log('URI:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'UNDEFINED');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Comment.countDocuments();
        console.log(`CURRENT DB COMMENT COUNT: ${count}`);

        const sample = await Comment.findOne();
        console.log('SAMPLE COMMENT:', sample);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
