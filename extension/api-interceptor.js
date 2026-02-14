// Instagram API Interceptor
// This intercepts Instagram's internal GraphQL/REST API calls

class InstagramAPIInterceptor {
    constructor() {
        this.capturedData = [];
        this.isActive = false;
        this.hashtagData = new Map();
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        console.log('🔍 API Interceptor Started');
        this.interceptFetch();
        this.interceptXHR();
    }

    stop() {
        this.isActive = false;
        console.log('🛑 API Interceptor Stopped');
    }

    // Intercept fetch() calls
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);

            // Clone response to read it without consuming
            const clonedResponse = response.clone();
            const url = args[0];

            // Check if this is a hashtag API call
            if (typeof url === 'string' && (
                url.includes('/tags/') ||
                url.includes('/graphql/query') ||
                url.includes('__a=1')
            )) {
                try {
                    const data = await clonedResponse.json();
                    self.processAPIResponse(url, data);
                } catch (e) {
                    // Not JSON or already consumed
                }
            }

            return response;
        };
    }

    // Intercept XMLHttpRequest
    interceptXHR() {
        const self = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._url = url;
            return originalOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                if (this._url && (
                    this._url.includes('/tags/') ||
                    this._url.includes('/graphql/')
                )) {
                    try {
                        const data = JSON.parse(this.responseText);
                        self.processAPIResponse(this._url, data);
                    } catch (e) {
                        // Not JSON
                    }
                }
            });
            return originalSend.apply(this, args);
        };
    }

    // Process captured API responses
    processAPIResponse(url, data) {
        console.log('📡 Captured API Response:', url);

        // Extract hashtag data from various Instagram API formats
        let posts = [];
        let cursor = null;
        let hasNextPage = false;

        // Format 1: GraphQL Query Response
        if (data?.data?.hashtag) {
            const hashtag = data.data.hashtag;
            const edges = hashtag?.edge_hashtag_to_media?.edges || [];

            edges.forEach(edge => {
                const node = edge.node;
                posts.push(this.normalizePost(node));
            });

            const pageInfo = hashtag?.edge_hashtag_to_media?.page_info;
            if (pageInfo) {
                hasNextPage = pageInfo.has_next_page;
                cursor = pageInfo.end_cursor;
            }
        }

        // Format 2: REST API Response
        if (data?.items) {
            data.items.forEach(item => {
                posts.push(this.normalizePost(item));
            });

            if (data.next_max_id) {
                cursor = data.next_max_id;
                hasNextPage = true;
            }
        }

        // Format 3: __a=1 format
        if (data?.graphql?.hashtag) {
            const hashtag = data.graphql.hashtag;
            const edges = hashtag?.edge_hashtag_to_media?.edges || [];

            edges.forEach(edge => {
                posts.push(this.normalizePost(edge.node));
            });
        }

        if (posts.length > 0) {
            this.capturedData.push(...posts);
            console.log(`✅ Captured ${posts.length} posts. Total: ${this.capturedData.length}`);

            // Notify content script
            window.postMessage({
                type: 'INSTAGRAM_API_DATA',
                posts: posts,
                cursor: cursor,
                hasNextPage: hasNextPage
            }, '*');
        }
    }

    // Normalize post data to consistent format
    normalizePost(node) {
        const shortcode = node.shortcode || node.code;
        const id = node.id;

        return {
            id: shortcode || id,
            url: `https://www.instagram.com/p/${shortcode}/`,
            shortcode: shortcode,
            caption: this.extractCaption(node),
            likes: node.edge_liked_by?.count || node.like_count || 0,
            commentsCount: node.edge_media_to_comment?.count || node.comment_count || 0,
            timestamp: new Date(node.taken_at_timestamp * 1000 || Date.now()).toISOString(),
            owner: node.owner?.username || 'Unknown',
            ownerId: node.owner?.id,
            displayUrl: node.display_url || node.thumbnail_src,
            isVideo: node.is_video || false,
            videoViewCount: node.video_view_count || 0
        };
    }

    extractCaption(node) {
        if (node.edge_media_to_caption?.edges?.[0]?.node?.text) {
            return node.edge_media_to_caption.edges[0].node.text;
        }
        if (node.caption?.text) {
            return node.caption.text;
        }
        return '';
    }

    getCapturedData() {
        return this.capturedData;
    }

    clearData() {
        this.capturedData = [];
    }
}

// Initialize interceptor
window.instagramInterceptor = new InstagramAPIInterceptor();
console.log('✅ Instagram API Interceptor Loaded');
