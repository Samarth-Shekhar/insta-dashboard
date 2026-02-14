const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { fetchCommentsViaPuppeteer } = require('../utils/puppeteer');
const { Parser } = require('json2csv');

// POST /api/comments/fetch
router.post('/fetch', async (req, res) => {
    const { url } = req.body;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 1. Fetch Comments using Puppeteer (No API Key needed)
        // This works for Personal accounts as long as the post is Public.
        const result = await fetchCommentsViaPuppeteer(url);
        const { mediaId, comments } = result;

        // 2. Store in MongoDB
        if (comments.length > 0) {
            const operations = comments.map(comment => ({
                updateOne: {
                    filter: { id: comment.id },
                    update: { ...comment },
                    upsert: true
                }
            }));
            await Comment.bulkWrite(operations);
        }

        res.json({
            success: true,
            count: comments.length,
            mediaId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/comments
// Supports pagination, search, sort
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, search, mediaId } = req.query;
    const query = {};

    if (mediaId) {
        query.mediaId = mediaId;
    }

    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { text: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const comments = await Comment.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Comment.countDocuments(query);

        res.json({
            comments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalComments: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

// GET /api/comments/export
router.get('/export', async (req, res) => {
    const { mediaId } = req.query;
    const query = {};
    if (mediaId) query.mediaId = mediaId;

    try {
        const comments = await Comment.find(query).lean();

        const fields = ['id', 'username', 'text', 'timestamp', 'mediaId'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(comments);

        res.header('Content-Type', 'text/csv');
        res.attachment('comments.csv');
        return res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error exporting comments' });
    }
});

// DELETE /api/comments
// Clears ALL comments from the database
router.delete('/', async (req, res) => {
    try {
        await Comment.deleteMany({});
        res.status(200).json({ message: 'All comments cleared successfully' });
    } catch (error) {
        console.error('Error clearing comments:', error);
        res.status(500).json({ error: 'Failed to clear comments' });
    }
});

// POST /api/comments/clear (Backup for DELETE issues)
router.post('/clear', async (req, res) => {
    try {
        await Comment.deleteMany({});
        res.status(200).json({ message: 'All comments cleared successfully' });
    } catch (error) {
        console.error('Error clearing comments:', error);
        res.status(500).json({ error: 'Failed to clear comments' });
    }
});

module.exports = router;
