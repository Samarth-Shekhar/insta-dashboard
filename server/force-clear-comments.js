const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Comment = require('./models/Comment');

console.log('🔌 Connecting to MongoDB...');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected.');
        console.log('🗑️  Force Clearing ALL Comments...');

        const result = await Comment.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} comments.`);

        console.log('✨ Operation Complete.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
