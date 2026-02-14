const axios = require('axios');

async function testHashtagUpload() {
    try {
        console.log('Testing Hashtag Upload...');
        const res = await axios.post('http://localhost:5001/api/hashtags/import', {
            posts: [
                {
                    id: 'TEST_ID_' + Date.now(),
                    url: 'http://instagram.com/p/test',
                    caption: 'Test Caption',
                    searchQuery: 'test_tag'
                }
            ]
        });
        console.log('Upload Result:', res.data);

        console.log('Testing Fetch...');
        const fetchRes = await axios.get('http://localhost:5001/api/hashtags');
        console.log('Fetch Result Count:', fetchRes.data.length);

        if (fetchRes.data.some(p => p.id.startsWith('TEST_ID'))) {
            console.log('SUCCESS: API is working correctly.');
        } else {
            console.log('FAILURE: Uploaded item not found.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
}

testHashtagUpload();
