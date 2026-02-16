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

const authenticateToken = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// POST /api/comments/import (For Extension)
router.post('/import', async (req, res) => {
    try {
        const { comments, token } = req.body;
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

        if (!comments || !Array.isArray(comments)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const ops = comments.map(c => ({
            updateOne: {
                filter: { id: c.id },
                update: { ...c, owner: userId },
                upsert: true
            }
        }));

        await Comment.bulkWrite(ops);
        res.json({ success: true, count: comments.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/comments (Protected)
router.get('/', authenticateToken, async (req, res) => {
    const { page = 1, limit = 10, search, mediaId } = req.query;
    const query = { owner: req.user.userId }; // Filter by user

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

// DELETE /api/comments (Protected)
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Comment.deleteMany({ owner: req.user.userId });
        res.status(200).json({ message: 'User comments cleared' });
    } catch (error) {
        console.error('Error clearing comments:', error);
        res.status(500).json({ error: 'Failed to clear comments' });
    }
});

module.exports = router;
