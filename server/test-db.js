require('dotenv').config();
const mongoose = require('mongoose');
const HashtagPost = require('./models/HashtagPost');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('='.repeat(50));
        console.log('DATABASE CHECK');
        console.log('='.repeat(50));

        const posts = await HashtagPost.find().sort({ timestamp: -1 });
        console.log(`Total posts: ${posts.length}`);
        console.log('='.repeat(50));

        posts.forEach((post, index) => {
            console.log(`${index + 1}. ${post.searchQuery} - ${post.url}`);
        });

        console.log('='.repeat(50));
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
