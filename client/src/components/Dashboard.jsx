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

    // --- BULK ACTION STATE ---
    const [selectedPosts, setSelectedPosts] = useState(new Set());
    const [isBatchScraping, setIsBatchScraping] = useState(false);

    // --- BULK HELPERS ---
    const getFilteredHashtags = () => {
        if (!search) return hashtags;
        return hashtags.filter(h => h.searchQuery === search);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = getFilteredHashtags().map(p => p.id);
            setSelectedPosts(new Set(allIds));
        } else {
            setSelectedPosts(new Set());
        }
    };

    const toggleSelectPost = (id) => {
        const newSet = new Set(selectedPosts);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPosts(newSet);
    };

    const handleBatchScrape = async () => {
        if (!window.confirm(`⚠️ WARNING: This will open ${selectedPosts.size} new tabs sequentially!\n\nYou must ALLOW POPUPS for this site.\n\nTabs will open every 12 seconds to allow the extension to scrape. Continue?`)) return;

        setIsBatchScraping(true);
        const postsToScrape = hashtags.filter(p => selectedPosts.has(p.id));

        let i = 0;
        const processNext = () => {
            if (i >= postsToScrape.length) {
                setIsBatchScraping(false);
                alert('Batch Scrape Sequence Completed!');
                return;
            }

            const post = postsToScrape[i];
            window.open(`${post.url}#scrape_comments`, '_blank');
            i++;

            // Wait 12 seconds before next
            setTimeout(processNext, 12000);
        };

        processNext();
    };

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
                {activeTab === 'hashtags' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Hashtag Posts</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {hashtags.length} posts loaded
                                </p>
                            </div>

                            {/* FILTERS & ACTIONS */}
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* Hashtag Filter */}
                                <select
                                    className="px-3 py-2 border rounded text-sm bg-gray-50 text-gray-700 font-medium"
                                    onChange={(e) => setSearch(e.target.value)}
                                    value={search}
                                >
                                    <option value="">All Hashtags</option>
                                    {[...new Set(hashtags.map(h => h.searchQuery).filter(Boolean))].map(tag => (
                                        <option key={tag} value={tag}>#{tag}</option>
                                    ))}
                                </select>

                                {/* Bulk Scrape Button */}
                                {selectedPosts.size > 0 && (
                                    <button
                                        onClick={handleBatchScrape}
                                        disabled={isBatchScraping}
                                        className={`px-4 py-2 text-sm text-white rounded shadow-sm flex items-center gap-2 transition-all ${isBatchScraping ? 'bg-orange-400 cursor-wait' : 'bg-orange-600 hover:bg-orange-700'
                                            }`}
                                    >
                                        {isBatchScraping ? '⏳ Processing Batch...' : `🤖 Scrape ${selectedPosts.size} Selected`}
                                    </button>
                                )}

                                <button
                                    onClick={clearHashtags}
                                    className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition-colors"
                                >
                                    Clear Data
                                </button>

                                <button
                                    onClick={fetchStoredHashtags}
                                    disabled={loading}
                                    className="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                                >
                                    ↻ Refresh
                                </button>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={hashtags.length > 0 && selectedPosts.size === hashtags.filter(p => !search || p.searchQuery === search).length}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Post URL</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Hashtag</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider w-1/4">Caption</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {getFilteredHashtags().length > 0 ? (
                                        getFilteredHashtags().map((post) => (
                                            <tr key={post.id} className={`transition-colors ${selectedPosts.has(post.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPosts.has(post.id)}
                                                        onChange={() => toggleSelectPost(post.id)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <a href={post.url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 block w-full truncate">
                                                        {post.url}
                                                    </a>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        #{post.searchQuery}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-gray-800">{post.owner || 'Unknown'}</td>
                                                <td className="p-4 text-gray-700 text-sm">{post.caption ? post.caption.substring(0, 40) + '...' : '-'}</td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => window.open(`${post.url}#scrape_comments`, '_blank')}
                                                        className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium flex items-center gap-1 shadow-sm"
                                                    >
                                                        🤖 Auto-Scrape
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-gray-400 italic">
                                                No posts found. {search ? `Try clearing filter/search.` : `Use the extension to scrape hashtags first.`}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
