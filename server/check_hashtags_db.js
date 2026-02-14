const mongoose = require('mongoose');
const HashtagPost = require('./models/HashtagPost');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const count = await HashtagPost.countDocuments();
            console.log(`HashtagPost Count: ${count}`);

            if (count > 0) {
                const posts = await HashtagPost.find().limit(5);
                console.log('Sample posts:', JSON.stringify(posts, null, 2));
            } else {
                console.log('No hashtag posts found.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
