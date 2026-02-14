require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const commentRoutes = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - MUST be before routes to parse JSON body
// Middleware (App already declared above)
app.use(cors({
    origin: '*', // Allow ALL origins (Crucial for Chrome Extensions)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ... (routes stay the same)

// Initial server start (Conditional for Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

// Database Connection (Cached for Serverless)
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    // Prepare Mongoose options
    const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: true, // Enable buffering to prevent race conditions
    };

    try {
        const mongooseInstance = await mongoose.connect(process.env.MONGO_URI, opts);
        cachedDb = mongooseInstance;
        console.log('MongoDB Connected');
        return cachedDb;
    } catch (e) {
        console.error('MongoDB Connection Error:', e);
        throw e;
    }
}

// Ensure DB is connected for every request
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('DB Middleware Error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

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
