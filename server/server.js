require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const commentRoutes = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - MUST be before routes to parse JSON body
app.use(cors({
    origin: true, // Allow ALL origins (including instagram.com)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Extension Import Routes
app.get('/api/comments/import', (req, res) => res.json({ status: 'ok' }));

app.post('/api/comments/import', async (req, res) => {
    try {
        const { comments } = req.body;
        const safeComments = comments || [];

        if (safeComments.length > 0) {
            const Comment = require('./models/Comment');
            const ops = safeComments.map(c => ({
                updateOne: {
                    filter: { id: c.id },
                    update: c,
                    upsert: true
                }
            }));
            await Comment.bulkWrite(ops);
        }
        res.json({ success: true, count: safeComments.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// App Routes
app.use('/api/comments', commentRoutes);

const hashtagRoutes = require('./routes/hashtags');
app.use('/api/hashtags', hashtagRoutes);

app.get('/', (req, res) => {
    res.send('Instagram Comment Dashboard API Running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Initial server start (Conditional for Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel Serverless
module.exports = app;
