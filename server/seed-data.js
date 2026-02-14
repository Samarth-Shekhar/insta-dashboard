require('dotenv').config();
const mongoose = require('mongoose');
const HashtagPost = require('./models/HashtagPost');

const samplePosts = [
    {
        id: 'C3xK9mLPqR1',
        shortcode: 'C3xK9mLPqR1',
        url: 'https://www.instagram.com/p/C3xK9mLPqR1/',
        caption: 'Beautiful sunset at the beach 🌅 Perfect end to a perfect day! #sunset #beach #nature',
        owner: 'travel_enthusiast',
        likes: '2.5K',
        commentsCount: '142',
        searchQuery: 'sunset',
        timestamp: new Date('2026-02-10T18:30:00Z')
    },
    {
        id: 'C3wN8pKLmQ2',
        shortcode: 'C3wN8pKLmQ2',
        url: 'https://www.instagram.com/p/C3wN8pKLmQ2/',
        caption: 'Morning coffee and good vibes ☕️✨ Starting the day right! #coffee #morning #lifestyle',
        owner: 'coffee_lover_daily',
        likes: '1.8K',
        commentsCount: '89',
        searchQuery: 'coffee',
        timestamp: new Date('2026-02-11T08:15:00Z')
    },
    {
        id: 'C3vM7oJKnP3',
        shortcode: 'C3vM7oJKnP3',
        url: 'https://www.instagram.com/p/C3vM7oJKnP3/',
        caption: 'Fitness is not about being better than someone else. It\'s about being better than you used to be 💪 #fitness #motivation #gym',
        owner: 'fit_lifestyle_coach',
        likes: '3.2K',
        commentsCount: '201',
        searchQuery: 'fitness',
        timestamp: new Date('2026-02-11T12:45:00Z')
    },
    {
        id: 'C3uL6nIJoO4',
        shortcode: 'C3uL6nIJoO4',
        url: 'https://www.instagram.com/p/C3uL6nIJoO4/',
        caption: 'Exploring hidden gems in the city 🏙️ Architecture at its finest! #architecture #city #photography',
        owner: 'urban_explorer_',
        likes: '4.1K',
        commentsCount: '178',
        searchQuery: 'architecture',
        timestamp: new Date('2026-02-11T15:20:00Z')
    },
    {
        id: 'C3tK5mHIpN5',
        shortcode: 'C3tK5mHIpN5',
        url: 'https://www.instagram.com/p/C3tK5mHIpN5/',
        caption: 'Homemade pasta from scratch 🍝 Nothing beats fresh ingredients! #food #cooking #italian',
        owner: 'chef_at_home',
        likes: '2.9K',
        commentsCount: '156',
        searchQuery: 'food',
        timestamp: new Date('2026-02-12T19:00:00Z')
    },
    {
        id: 'C3sJ4lGHqM6',
        shortcode: 'C3sJ4lGHqM6',
        url: 'https://www.instagram.com/p/C3sJ4lGHqM6/',
        caption: 'New art piece finished! 🎨 Inspired by nature and emotions. What do you see? #art #painting #artist',
        owner: 'creative_artist_studio',
        likes: '1.5K',
        commentsCount: '94',
        searchQuery: 'art',
        timestamp: new Date('2026-02-12T14:30:00Z')
    },
    {
        id: 'C3rI3kFGrL7',
        shortcode: 'C3rI3kFGrL7',
        url: 'https://www.instagram.com/p/C3rI3kFGrL7/',
        caption: 'Weekend vibes with my furry friend 🐕 Best companion ever! #dog #pets #weekend',
        owner: 'pet_lover_2024',
        likes: '5.3K',
        commentsCount: '312',
        searchQuery: 'dog',
        timestamp: new Date('2026-02-12T10:15:00Z')
    },
    {
        id: 'C3qH2jEFsK8',
        shortcode: 'C3qH2jEFsK8',
        url: 'https://www.instagram.com/p/C3qH2jEFsK8/',
        caption: 'Mountain peaks and fresh air 🏔️ Nature therapy at its best! #mountains #hiking #adventure',
        owner: 'mountain_wanderer',
        likes: '3.7K',
        commentsCount: '189',
        searchQuery: 'mountains',
        timestamp: new Date('2026-02-11T16:45:00Z')
    },
    {
        id: 'C3pH1iDEtJ9',
        shortcode: 'C3pH1iDEtJ9',
        url: 'https://www.instagram.com/p/C3pH1iDEtJ9/',
        caption: 'New fashion collection dropping soon! 👗✨ Stay tuned for the launch! #fashion #style #ootd',
        owner: 'fashion_forward_',
        likes: '6.2K',
        commentsCount: '421',
        searchQuery: 'fashion',
        timestamp: new Date('2026-02-10T20:00:00Z')
    },
    {
        id: 'C3oG0hCDuI0',
        shortcode: 'C3oG0hCDuI0',
        url: 'https://www.instagram.com/p/C3oG0hCDuI0/',
        caption: 'Late night coding session 💻 Building something amazing! #coding #developer #tech',
        owner: 'dev_life_daily',
        likes: '2.1K',
        commentsCount: '127',
        searchQuery: 'coding',
        timestamp: new Date('2026-02-12T23:30:00Z')
    },
    {
        id: 'C3nF9gBCvH1',
        shortcode: 'C3nF9gBCvH1',
        url: 'https://www.instagram.com/p/C3nF9gBCvH1/',
        caption: 'Yoga flow in nature 🧘‍♀️ Finding peace and balance. #yoga #wellness #mindfulness',
        owner: 'yoga_with_sarah',
        likes: '1.9K',
        commentsCount: '103',
        searchQuery: 'yoga',
        timestamp: new Date('2026-02-11T07:00:00Z')
    },
    {
        id: 'C3mE8fABwG2',
        shortcode: 'C3mE8fABwG2',
        url: 'https://www.instagram.com/p/C3mE8fABwG2/',
        caption: 'Street photography at golden hour 📸 The city never looked so good! #photography #streetphotography #urban',
        owner: 'lens_and_light',
        likes: '4.5K',
        commentsCount: '234',
        searchQuery: 'photography',
        timestamp: new Date('2026-02-10T17:30:00Z')
    },
    {
        id: 'C3lD7eZAxF3',
        shortcode: 'C3lD7eZAxF3',
        url: 'https://www.instagram.com/p/C3lD7eZAxF3/',
        caption: 'Plant babies thriving! 🌱 My little indoor jungle is growing. #plants #indoorplants #greenthumb',
        owner: 'plant_parent_life',
        likes: '2.3K',
        commentsCount: '145',
        searchQuery: 'plants',
        timestamp: new Date('2026-02-12T11:20:00Z')
    },
    {
        id: 'C3kC6dYZyE4',
        shortcode: 'C3kC6dYZyE4',
        url: 'https://www.instagram.com/p/C3kC6dYZyE4/',
        caption: 'Baking therapy 🍰 Chocolate cake that melts in your mouth! #baking #dessert #homemade',
        owner: 'bake_with_love',
        likes: '3.4K',
        commentsCount: '198',
        searchQuery: 'baking',
        timestamp: new Date('2026-02-11T14:00:00Z')
    },
    {
        id: 'C3jB5cXYzD5',
        shortcode: 'C3jB5cXYzD5',
        url: 'https://www.instagram.com/p/C3jB5cXYzD5/',
        caption: 'Vintage finds from today\'s thrift haul! 🛍️ Sustainable fashion is the best fashion. #vintage #thrifting #sustainable',
        owner: 'thrift_queen_',
        likes: '1.7K',
        commentsCount: '87',
        searchQuery: 'vintage',
        timestamp: new Date('2026-02-12T16:45:00Z')
    }
];

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('🌱 Seeding database with sample hashtag posts...\n');

        // Clear existing data
        await HashtagPost.deleteMany({});
        console.log('✅ Cleared existing posts\n');

        // Insert sample data
        await HashtagPost.insertMany(samplePosts);
        console.log(`✅ Inserted ${samplePosts.length} sample posts\n`);

        // Verify
        const count = await HashtagPost.countDocuments();
        console.log(`📊 Total posts in database: ${count}\n`);

        console.log('Sample posts:');
        samplePosts.slice(0, 3).forEach((post, i) => {
            console.log(`${i + 1}. @${post.owner} - #${post.searchQuery}`);
            console.log(`   ${post.url}`);
            console.log(`   "${post.caption.substring(0, 50)}..."\n`);
        });

        console.log('✨ Database seeded successfully!');
        console.log('🔄 Refresh your dashboard to see the new data!\n');

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
