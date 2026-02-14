// Manual test upload - Run this in Instagram console to test upload
const testPosts = [
    {
        id: 'TEST_' + Date.now(),
        url: 'https://www.instagram.com/p/test123/',
        shortcode: 'test123',
        caption: 'This is a test post from manual upload',
        likes: 100,
        commentsCount: 50,
        timestamp: new Date().toISOString(),
        owner: 'testuser',
        searchQuery: 'manual_test'
    },
    {
        id: 'TEST_' + (Date.now() + 1),
        url: 'https://www.instagram.com/p/test456/',
        shortcode: 'test456',
        caption: 'Another test post',
        likes: 200,
        commentsCount: 75,
        timestamp: new Date().toISOString(),
        owner: 'anotheruser',
        searchQuery: 'manual_test'
    }
];

console.log('📤 Sending test data to background script...');

chrome.runtime.sendMessage({
    action: 'UPLOAD_HASHTAGS',
    data: testPosts
}, (response) => {
    if (chrome.runtime.lastError) {
        console.error('❌ Error:', chrome.runtime.lastError.message);
    } else if (response && response.success) {
        console.log('✅ Upload successful!', response);
        alert('Test upload successful! Check your dashboard.');
    } else {
        console.error('❌ Upload failed:', response);
        alert('Upload failed: ' + (response?.error || 'Unknown error'));
    }
});
