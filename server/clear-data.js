require('dotenv').config();
const mongoose = require('mongoose');
const HashtagPost = require('./models/HashtagPost');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('🗑️  Clearing all hashtag posts...\n');

        const result = await HashtagPost.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} posts\n`);

        const count = await HashtagPost.countDocuments();
        console.log(`📊 Total posts remaining: ${count}\n`);

        console.log('✨ Database cleared!');
        console.log('📝 Now scrape some real Instagram posts using the extension!\n');

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
