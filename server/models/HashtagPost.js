const mongoose = require('mongoose');

const HashtagPostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Shortcode or URL
    url: { type: String, required: true },
    caption: { type: String },
    likes: { type: String }, // Can be "1.5K" or exact number
    commentsCount: { type: String }, // "500" or similar
    timestamp: { type: Date, default: Date.now },
    searchQuery: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isScraped: { type: Boolean, default: false },
    scrapedCommentsCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('HashtagPost', HashtagPostSchema);
