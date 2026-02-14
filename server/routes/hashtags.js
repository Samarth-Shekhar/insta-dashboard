const express = require('express');
const router = express.Router();
const HashtagPost = require('../models/HashtagPost');
const { Parser } = require('json2csv');

// GET /api/hashtags
router.get('/', async (req, res) => {
    try {
        console.log('[Hashtag API] Fetching posts...');
        const posts = await HashtagPost.find().sort({ timestamp: -1 }).limit(100);
        console.log(`[Hashtag API] Found ${posts.length} posts.`);

        // Log the actual data being sent
        if (posts.length > 0) {
            console.log('[Hashtag API] Sample post:', JSON.stringify(posts[0], null, 2));
        }
        console.log('[Hashtag API] Sending response...');

        res.json(posts);
    } catch (err) {
        console.error('[Hashtag API] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hashtags/import
router.post('/import', async (req, res) => {
    try {
        const { posts } = req.body;
        console.log(`[Hashtag Import] Received ${posts ? posts.length : 0} posts.`);

        if (!posts || !Array.isArray(posts)) {
            console.error('[Hashtag Import] Invalid payload:', req.body);
            return res.status(400).json({ error: 'Invalid data' });
        }

        // Log first post to check structure
        if (posts.length > 0) {
            console.log('[Hashtag Import] Sample Post:', JSON.stringify(posts[0], null, 2));
        }

        const ops = posts.map(p => ({
            updateOne: {
                filter: { id: p.id },
                update: p,
                upsert: true
            }
        }));

        const result = await HashtagPost.bulkWrite(ops);
        console.log('[Hashtag Import] BulkWrite Result:', result);

        res.json({ success: true, count: posts.length });
    } catch (err) {
        console.error('[Hashtag Import] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/hashtags - Clear all data
router.delete('/', async (req, res) => {
    try {
        await HashtagPost.deleteMany({});
        console.log('[API] Cleared all hashtag data');
        res.json({ success: true, message: 'All data cleared' });
    } catch (err) {
        console.error('[API] Clear Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
