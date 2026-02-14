
// Import endpoint for Extension
router.post('/import', async (req, res) => {
    try {
        const { comments } = req.body;
        if (!Array.isArray(comments) || comments.length === 0) {
            return res.status(400).json({ error: 'No comments provided' });
        }

        // Bulk upsert
        const operations = comments.map(c => ({
            updateOne: {
                filter: { id: c.id }, // Use generated ID from extension or unique content key
                update: { ...c },
                upsert: true
            }
        }));

        await Comment.bulkWrite(operations);

        res.json({ success: true, count: comments.length });
    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ error: 'Failed to import comments' });
    }
});
