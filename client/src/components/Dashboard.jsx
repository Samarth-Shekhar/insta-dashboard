import { useState, useEffect } from 'react';
import api from '../utils/api';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('comments');
    const [comments, setComments] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [currentHashtag, setCurrentHashtag] = useState('');

    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [currentMediaId, setCurrentMediaId] = useState('');
    const [error, setError] = useState(null);

    // --- BULK ACTION STATE ---
    const [selectedPosts, setSelectedPosts] = useState(new Set());
    const [isBatchScraping, setIsBatchScraping] = useState(false);

    useEffect(() => {
        if (activeTab === 'comments') {
            fetchStoredComments();
        } else {
            fetchStoredHashtags();
        }
    }, [page, currentMediaId, activeTab]);
    // removed 'search' from dependency to allow client-side filtering for hashtags

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
            window.open(`${post.url}#scrape_comments&tag=${post.searchQuery || ''}`, '_blank');
            i++;

            // Wait 12 seconds
            setTimeout(processNext, 12000);
        };

        processNext();
    };

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

    const fetchStoredHashtags = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/hashtags');
            if (Array.isArray(data) && data.length > 0) {
                const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setHashtags(sorted);
                const uniqueHashtags = [...new Set(sorted.map(post => post.searchQuery))].filter(Boolean);
                if (uniqueHashtags.length > 0) {
                    setCurrentHashtag(uniqueHashtags.map(tag => `#${tag}`).join(', '));
                } else {
                    setCurrentHashtag('');
                }
            } else {
                setHashtags([]);
                setCurrentHashtag('');
            }
        } catch (error) {
            setError(`Failed to load data: ${error.message}`);
            setHashtags([]);
        } finally {
            setLoading(false);
        }
    };

    const clearHashtags = async () => {
        if (!window.confirm('Clear ALL hashtag post data?')) return;
        setLoading(true);
        try {
            await api.delete('/hashtags');
            setHashtags([]);
            setCurrentHashtag('');
            alert('Cleared!');
        } catch (error) {
            alert('Failed to clear: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearComments = async () => {
        if (!window.confirm('⚠️ WARNING: Clear ALL scraped comments logic?\nThis cannot be undone.')) return;
        setLoading(true);
        try {
            // Try DELETE first
            await api.delete('/comments');
            setComments([]);
            alert('All comments cleared!');
        } catch (error) {
            console.warn('DELETE failed, trying POST /clear fallback...', error);
            try {
                // Fallback to POST /clear
                await api.post('/comments/clear');
                setComments([]);
                alert('All comments cleared (via fallback)!');
            } catch (fallbackError) {
                alert('Failed to clear comments: ' + fallbackError.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const exportHashtags = () => {
        if (hashtags.length === 0) return alert('No data');
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
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'hashtag_posts.csv';
        link.click();
    };

    const exportComments = () => {
        if (comments.length === 0) return alert('No comments');
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
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'comments_export.csv';
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
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'comments' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Generic Comments
                        </button>
                        <button
                            onClick={() => setActiveTab('hashtag_comments')}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'hashtag_comments' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            #Hashtag Comments
                        </button>
                        <button
                            onClick={() => setActiveTab('hashtags')}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'hashtags' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Hashtag Posts
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* HASHTAG COMMENTS TAB (NEW) */}
                {activeTab === 'hashtag_comments' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex flex-col mb-6 gap-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Scraped Comments</h2>
                                <div className="flex gap-2">
                                    <button onClick={clearComments} className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2">🗑️ Clear Data</button>
                                    <button onClick={exportComments} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Export CSV</button>
                                    <button onClick={fetchStoredComments} className="px-4 py-2 text-sm bg-gray-50 text-gray-600 border rounded hover:bg-gray-100">↻ Refresh</button>
                                </div>
                            </div>

                            {/* STATS BAR */}
                            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 flex flex-wrap gap-4 items-center">
                                <span className="font-bold text-teal-800 text-sm">📊 Stats:</span>
                                {Object.entries(comments.reduce((acc, c) => {
                                    if (c.hashtag) acc[c.hashtag] = (acc[c.hashtag] || 0) + 1;
                                    return acc;
                                }, {})).map(([tag, count]) => (
                                    <span key={tag} className="px-3 py-1 bg-white border border-teal-200 rounded-full text-xs font-medium text-teal-700 shadow-sm">
                                        #{tag}: <span className="font-bold">{count}</span>
                                    </span>
                                ))}
                                {comments.filter(c => c.hashtag).length === 0 && <span className="text-xs text-teal-600 italic">No hashtag stats yet.</span>}
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Hashtag</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase w-1/3">Comment</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Date</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {comments.filter(c => c.hashtag).length > 0 ? (
                                        comments.filter(c => c.hashtag).map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50">
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                                        #{c.hashtag}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-blue-600">{c.username}</td>
                                                <td className="p-4 text-gray-700">{c.text}</td>
                                                <td className="p-4 text-sm text-gray-500">{new Date(c.timestamp).toLocaleString()}</td>
                                                <td className="p-4 text-xs">
                                                    <a href={c.mediaId} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View</a>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="p-12 text-center text-gray-400">No hashtag-specific comments found yet. Use Auto-Scrape.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* GENERIC COMMENTS TAB */}
                {activeTab === 'comments' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Scraped Comments</h2>
                            <div className="flex gap-2">
                                <button onClick={clearComments} className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2">🗑️ Clear Data</button>
                                <button onClick={exportComments} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Export CSV</button>
                                <button onClick={fetchStoredComments} className="px-4 py-2 text-sm bg-gray-50 text-gray-600 border rounded hover:bg-gray-100">↻ Refresh</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase w-1/3">Comment</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Hashtag</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Date</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {comments.filter(c => !c.hashtag).map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-blue-600">{c.username}</td>
                                            <td className="p-4 text-gray-700">{c.text}</td>
                                            <td className="p-4">
                                                {c.hashtag ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        #{c.hashtag}
                                                    </span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{new Date(c.timestamp).toLocaleString()}</td>
                                            <td className="p-4 text-xs">
                                                <a href={c.mediaId} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View</a>
                                            </td>
                                        </tr>
                                    ))}
                                    {comments.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No comments found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* HASHTAGS TAB */}
                {activeTab === 'hashtags' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Hashtag Posts</h2>
                                <p className="text-sm text-gray-500 mt-1">{hashtags.length} posts loaded</p>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                {/* FILTER */}
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

                                {/* BULK SCRAPE */}
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

                                <button onClick={clearHashtags} className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100">Clear</button>
                                <button onClick={fetchStoredHashtags} disabled={loading} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">↻</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={hashtags.length > 0 && selectedPosts.size === getFilteredHashtags().length}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Post URL</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Hashtag</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Username</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase w-1/4">Caption</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Action</th>
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
                                                        className="rounded"
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
                                                        🤖 Auto
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-gray-400 italic">
                                                No posts found. {search ? `Try clearing filter.` : `Use the extension to scrape hashtags first.`}
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
