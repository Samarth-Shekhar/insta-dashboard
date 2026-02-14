const axios = require('axios');

// Helper to extract shortcode
const getShortcodeFromUrl = (url) => {
    const regex = /\/p\/([^\/]+)|\/reel\/([^\/]+)/;
    const match = url.match(regex);
    return match ? (match[1] || match[2]) : null;
};

// 1. Get Username via oEmbed (Public posts only)
const getAuthorFromOembed = async (url, accessToken) => {
    try {
        // oEmbed is the only official way to get metadata from a raw URL
        const response = await axios.get(`https://graph.facebook.com/v18.0/instagram_oembed`, {
            params: {
                url: url,
                access_token: accessToken
            }
        });
        return response.data.author_name;
    } catch (error) {
        console.error('oEmbed Failed:', error.message);
        return null;
    }
};

// 2. Fetch Comments via Business Discovery (For Other Business Accounts)
const fetchCommentsViaDiscovery = async (url, accessToken, myBusinessId) => {
    const shortcode = getShortcodeFromUrl(url);
    if (!shortcode) throw new Error('Invalid Instagram URL');

    // Step A: Find the author username
    const authorUsername = await getAuthorFromOembed(url, accessToken);

    if (!authorUsername) {
        throw new Error('Could not resolve author. Post might be from a Private/Personal account or oEmbed failed.');
    }

    console.log(`Resolved Author: ${authorUsername}, Shortcode: ${shortcode}`);

    // Step B: Use Business Discovery to find the media and comments
    // Query: Look up the AUTHOR, then find the SPECIFIC MEDIA by shortcode, then get its comments
    const query = `business_discovery.username(${authorUsername}){media.shortcode(${shortcode}){id,comments.limit(50){id,text,username,timestamp}}}`;

    try {
        const response = await axios.get(`https://graph.facebook.com/v18.0/${myBusinessId}`, {
            params: {
                fields: query,
                access_token: accessToken
            }
        });

        const mediaData = response.data.business_discovery.media;

        if (!mediaData) {
            throw new Error('Media not found. The target user might be a Personal account (Discovery only works for Business/Creator accounts).');
        }

        // Discovery returns a slightly different structure
        const commentsData = mediaData.comments ? mediaData.comments.data : [];

        // Map to our standard format
        return {
            mediaId: mediaData.id,
            comments: commentsData.map(c => ({
                id: c.id,
                text: c.text,
                username: c.username,
                timestamp: c.timestamp,
                mediaId: mediaData.id
            }))
        };

    } catch (error) {
        if (error.response?.data?.error) {
            console.error('Discovery API Error:', JSON.stringify(error.response.data.error, null, 2));
            throw new Error(`API Error: ${error.response.data.error.message}`);
        }
        throw error;
    }
};

// Original function (kept for backward compatibility or direct ID usage)
const getMediaIdFromUrl = async (url, accessToken, instagramBusinessAccountId) => {
    // This function originally acted on "My Media". 
    // We will now divert to the more powerful Discovery method above.
    return fetchCommentsViaDiscovery(url, accessToken, instagramBusinessAccountId);
};

module.exports = {
    getMediaIdFromUrl,
    fetchCommentsViaDiscovery
};
