// Test Script - Verify API Interceptor Setup
// Run this in Instagram's console to test if interception works

console.log('🧪 Testing API Interceptor...');

// Check if interceptor is loaded
if (window.instagramInterceptor) {
    console.log('✅ API Interceptor found');
    console.log('📊 Current captured data:', window.instagramInterceptor.getCapturedData().length, 'posts');

    // Start interceptor
    window.instagramInterceptor.start();
    console.log('✅ Interceptor started');

    // Scroll to trigger API calls
    console.log('📜 Scrolling to trigger API calls...');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    // Check after 5 seconds
    setTimeout(() => {
        const data = window.instagramInterceptor.getCapturedData();
        console.log('📊 Captured', data.length, 'posts');

        if (data.length > 0) {
            console.log('✅ SUCCESS! Sample post:', data[0]);
        } else {
            console.log('⚠️ No data captured yet. Try scrolling more or check if you\'re on a hashtag page.');
        }
    }, 5000);

} else {
    console.log('❌ API Interceptor NOT found');
    console.log('💡 Make sure:');
    console.log('   1. Extension is loaded');
    console.log('   2. You\'re on instagram.com');
    console.log('   3. Page has been refreshed after extension update');
}
