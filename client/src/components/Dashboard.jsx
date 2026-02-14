import { useState, useEffect } from 'react';
import api from '../utils/api';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('comments');
    const [comments, setComments] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [currentHashtag, setCurrentHashtag] = useState(''); // Most recent hashtag

    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [currentMediaId, setCurrentMediaId] = useState('');

    useEffect(() => {
        if (activeTab === 'comments') {
            fetchStoredComments();
        } else {
            fetchStoredHashtags();
        }
    }, [page, search, currentMediaId, activeTab]);

    const fetchStoredComments = async () => {
        try {
            const { data } = await api.get('/comments', {
                params: { page, search, mediaId: currentMediaId }
            });
            setComments(data.comments || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch stored comments');
        }
    };

    const [error, setError] = useState(null);

    const fetchStoredHashtags = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Dashboard: Fetching hashtags...');
            const { data } = await api.get('/hashtags');
            console.log('Dashboard: Received:', data);

            if (Array.isArray(data) && data.length > 0) {
                // Sort by timestamp (most recent first)
                const sorted = [...data].sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );

                // Get all unique hashtags
                const uniqueHashtags = [...new Set(sorted.map(post => post.searchQuery))].filter(Boolean);

                // Set all posts (no filtering)
                setHashtags(sorted);

                // Set current hashtag to show in header (most recent)
                if (uniqueHashtags.length > 0) {
                    setCurrentHashtag(uniqueHashtags.map(tag => `#${tag}`).join(', '));
                } else {
                    setCurrentHashtag('');
                }

                console.log(`Showing ${sorted.length} posts from ${uniqueHashtags.length} hashtags`);
            } else {
                setHashtags([]);
                setCurrentHashtag('');
            }
        } catch (error) {
            console.error('Failed to fetch hashtags', error);
            setError(`Failed to load data: ${error.message}`);
            setHashtags([]);
            setCurrentHashtag('');
        } finally {
            setLoading(false);
        }
    };

    // Kept for backward compatibility
    const handleFetchFromInstagram = async () => {
        // ... (existing logic)
    };

    const clearHashtags = async () => {
        if (!window.confirm('Are you sure you want to clear ALL hashtag data? This cannot be undone.')) return;

        setLoading(true);
        try {
            await api.delete('/hashtags');
            setHashtags([]);
            setCurrentHashtag('');
            alert('Hashtag data cleared successfully!');
        } catch (error) {
            console.error('Failed to clear data', error);
            alert('Failed to clear data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportHashtags = () => {
        if (hashtags.length === 0) return alert('No data to export');

        const headers = ['URL', 'Caption', 'Likes', 'Comments', 'Hashtag', 'Date'];
        const csvContent = [
            headers.join(','),
            ...hashtags.map(p => [
                p.url,
                `"${(p.caption || '').replace(/"/g, '""')}"`,
                p.likes,
                p.commentsCount,
                p.searchQuery,
                new Date(p.timestamp).toISOString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'hashtag_posts.csv');
        document.body.appendChild(link);
        link.click();
    };

    const exportComments = () => {
        if (comments.length === 0) return alert('No comments to export');

        const headers = ['Username', 'Comment', 'Date', 'Post URL', 'ID'];
        const csvContent = [
            headers.join(','),
            ...comments.map(c => [
                c.username,
                `"${(c.text || '').replace(/"/g, '""')}"`,
                new Date(c.timestamp).toISOString(),
                c.mediaId || '',
                c.id
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'comments_export.csv');
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">InstaExtract Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your scraped data efficiently</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'comments' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Comments Data
                        </button>
                        <button
                            onClick={() => setActiveTab('hashtags')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'hashtags' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Hashtag Posts
                        </button>
                    </div>
                </header>

                {activeTab === 'hashtags' && error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Error:</strong> {error}
                    </div>
                )}



                {activeTab === 'comments' ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Scraped Comments</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportComments}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={fetchStoredComments}
                                    className="px-4 py-2 text-sm bg-gray-50 text-gray-600 border rounded hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <span>↻</span> Refresh Data
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider w-1/2">Comment</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Timestamp</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Post URL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-medium text-blue-600">{comment.username}</td>
                                                <td className="p-4 text-gray-700 leading-relaxed">{comment.text}</td>
                                                <td className="p-4 text-gray-500 text-sm whitespace-nowrap">{new Date(comment.timestamp).toLocaleString()}</td>
                                                <td className="p-4 text-gray-400 text-xs font-mono break-all w-48">
                                                    <a href={comment.mediaId} target="_blank" rel="noreferrer" className="hover:underline text-blue-500">
                                                        {comment.mediaId?.includes('http') ? 'View Post' : comment.mediaId}
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400 italic">No comments data yet. Use the extension to scrape.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Hashtag Posts</h2>
                                {currentHashtag && (
                                    <p className="text-sm text-purple-600 mt-1 font-medium">
                                        📊 Scraped hashtags: <span className="font-bold">{currentHashtag}</span> ({hashtags.length} posts)
                                    </p>
                                )}
                                {!currentHashtag && hashtags.length === 0 && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        No data yet. Start scraping hashtags on Instagram!
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={clearHashtags}
                                    className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
                                >
                                    🗑️ Clear Data
                                </button>
                                <button
                                    onClick={exportHashtags}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                >
                                    Export URLs (CSV)
                                </button>
                                <button
                                    onClick={fetchStoredHashtags}
                                    disabled={loading}
                                    className={`px-4 py-2 text-sm border rounded flex items-center gap-2 transition-colors ${loading
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer'
                                        }`}
                                >
                                    <span>{loading ? '⏳' : '↻'}</span> {loading ? 'Loading...' : 'Refresh Data'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Post URL</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider w-1/3">Caption</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {hashtags.length > 0 ? (
                                        hashtags.map((post) => (
                                            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <a href={post.url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 block w-full truncate">
                                                        {post.url}
                                                    </a>
                                                </td>
                                                <td className="p-4 font-medium text-gray-800">{post.owner || 'Unknown'}</td>
                                                <td className="p-4 text-gray-700 text-sm">{post.caption ? post.caption.substring(0, 50) + '...' : '-'}</td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => {
                                                            // Trigger Extension Auto-Scrape via Hash
                                                            window.open(`${post.url}#scrape_comments`, '_blank');
                                                        }}
                                                        className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium flex items-center gap-1"
                                                    >
                                                        🤖 Auto-Scrape Comments
                                                    </button>
                                                    💬 Scrape Comments
                                                </button>
                                            </td>
                                            </tr>
                                ))
                                ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-gray-400 italic">No hashtag data yet. Use "Crawl Hashtag" in extension.</td>
                                </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                    </div>
                )}
        </div>
        </div >
    );
};

export default Dashboard;
