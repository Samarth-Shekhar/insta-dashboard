// Test script to verify hashtag upload endpoint
const testPost = {
    id: 'test_' + Date.now(),
    shortcode: 'test123',
    url: 'https://www.instagram.com/p/test123/',
    caption: 'Test caption from script',
    owner: 'testuser',
    likes: 0,
    commentsCount: 0,
    timestamp: new Date().toISOString(),
    searchQuery: 'test'
};

fetch('http://localhost:5001/api/hashtags/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts: [testPost] })
})
    .then(res => res.json())
    .then(data => {
        console.log('✅ Upload successful:', data);
    })
    .catch(err => {
        console.error('❌ Upload failed:', err);
    });
