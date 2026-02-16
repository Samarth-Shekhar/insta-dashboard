const express = require('express');
const router = express.Router();
const HashtagPost = require('../models/HashtagPost');
const { Parser } = require('json2csv');

const authenticateToken = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// GET /api/hashtags
router.get('/', authenticateToken, async (req, res) => {
    try {
        const posts = await HashtagPost.find({ owner: req.user.userId }).sort({ timestamp: -1 }).limit(100);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hashtags/import
router.post('/import', async (req, res) => {
    try {
        const { posts, token } = req.body;
        let userId = null;

        // Try to identify user from header or body token
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.split(' ')[1];
        const effectiveToken = headerToken || token;

        if (effectiveToken) {
            try {
                const decoded = jwt.verify(effectiveToken, process.env.JWT_SECRET || 'secret_key');
                userId = decoded.userId;
            } catch (e) {
                console.warn('[Import] Invalid token provided', e.message);
            }
        }

        if (!posts || !Array.isArray(posts)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const ops = posts.map(p => ({
            updateOne: {
                filter: { id: p.id },
                update: { ...p, owner: userId }, // Associate with user if found
                upsert: true
            }
        }));

        const result = await HashtagPost.bulkWrite(ops);
        res.json({ success: true, count: posts.length });
    } catch (err) {
        console.error('[Hashtag Import] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/hashtags - Clear USER data
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await HashtagPost.deleteMany({ owner: req.user.userId });
        res.json({ success: true, message: 'User data cleared' });
    } catch (err) {
        console.error('[API] Clear Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hashtags/mark-scraped
router.post('/mark-scraped', async (req, res) => {
    try {
        const { id, count } = req.body;
        await HashtagPost.updateOne(
            { id: id },
            {
                $set: {
                    isScraped: true,
                    scrapedCommentsCount: count
                }
            }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
