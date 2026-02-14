// Quick test script to check if hashtag data exists in database
const mongoose = require('mongoose');
require('dotenv').config();

const HashtagPost = require('./models/HashtagPost');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const count = await HashtagPost.countDocuments();
        console.log(`📊 Total hashtag posts in database: ${count}`);

        if (count > 0) {
            const sample = await HashtagPost.findOne().sort({ timestamp: -1 });
            console.log('\n📝 Most recent post:');
            console.log(JSON.stringify(sample, null, 2));
        } else {
            console.log('\n⚠️ No hashtag posts found in database!');
            console.log('This means either:');
            console.log('1. Scraping hasn\'t been run yet');
            console.log('2. Upload is failing');
            console.log('3. Data is being saved to wrong collection');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkData();
