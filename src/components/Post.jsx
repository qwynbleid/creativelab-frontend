import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { postService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { initializeIcons, updateIcons } from '../utils/icons';
import { Link } from 'react-router-dom';

const Post = ({ post, currentUserId, onPostUpdate }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Initialize icons when component mounts
    useEffect(() => {
        initializeIcons();
    }, []);

    // Update icons whenever the component updates
    useEffect(() => {
        updateIcons();
    });

    // Check if post is liked when component mounts
    useEffect(() => {
        const checkLikeStatus = async () => {
            try {
                const response = await postService.checkIfLiked(post.id, currentUserId);
                setIsLiked(response.isLiked);
            } catch (error) {
                console.error('Error checking like status:', error);
            }
        };

        if (currentUserId) {
            checkLikeStatus();
        }
    }, [post.id, currentUserId]);

    // Update likes count when post prop changes
    useEffect(() => {
        setLikesCount(post.likesCount || 0);
    }, [post.likesCount]);

    useEffect(() => {
        setCommentsCount(post.commentsCount || 0);
    }, [post.commentsCount]);

    useEffect(() => {
        console.log('Post data:', {
            postId: post.id,
            user: post.user,
            hasProfilePicture: !!post.user?.profilePicture,
            profilePictureType: post.user?.profilePicture ? typeof post.user.profilePicture : 'none',
            profilePictureBase64: !!post.user?.profilePictureBase64,
            isLikedByUser: post.isLikedByUser,
            likesCount: post.likesCount
        });
        loadComments();
    }, [post.id]);

    useEffect(() => {
        if (!showMenu || showDeleteConfirm) return;
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu, showDeleteConfirm]);

    const loadComments = async () => {
        try {
            const commentsData = await postService.getComments(post.id);
            setComments(commentsData);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const handleLike = async () => {
        if (!currentUserId) {
            console.error('No user ID available');
            return;
        }

        try {
            // Optimistically update UI
            setIsLiked(!isLiked);
            setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
            
            // Make API call
            await postService.likePost(post.id, currentUserId);
            
            // If there's an onPostUpdate callback, call it without forcing a full reload
            if (onPostUpdate) {
                onPostUpdate();
            }
        } catch (error) {
            // Revert optimistic update on error
            setIsLiked(isLiked);
            setLikesCount(prevCount => isLiked ? prevCount + 1 : prevCount - 1);
            console.error('Error liking post:', error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await postService.addComment(post.id, currentUserId, newComment);
            setNewComment('');
            loadComments();
            setCommentsCount(prev => prev + 1);
            if (onPostUpdate) {
                onPostUpdate();
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await postService.deletePost(post.id);
            if (onPostUpdate) {
                onPostUpdate();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const imageUrl = post.postImage || null;

    const getProfilePictureUrl = (user) => {
        if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';
        
        try {
            if (user.profilePicture) {
                // Check if the profile picture is already a data URL
                if (user.profilePicture.startsWith('data:image')) {
                    return user.profilePicture;
                }
                // If it's a base64 string without the prefix, add it
                if (typeof user.profilePicture === 'string' && user.profilePicture.length > 0) {
                    return `data:image/jpeg;base64,${user.profilePicture}`;
                }
            }
            if (user.profilePictureBase64) {
                // Check if the profile picture is already a data URL
                if (user.profilePictureBase64.startsWith('data:image')) {
                    return user.profilePictureBase64;
                }
                // If it's a base64 string without the prefix, add it
                if (typeof user.profilePictureBase64 === 'string' && user.profilePictureBase64.length > 0) {
                    return `data:image/jpeg;base64,${user.profilePictureBase64}`;
                }
            }
        } catch (error) {
            console.error('Error processing profile picture:', error);
        }
        
        // Fallback to a generated avatar based on the user's name
        const name = user.fullName || user.username || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    };

    const closeModal = () => {
        setShowDeleteConfirm(false);
        setShowMenu(false);
    };

    return (
        <div className="post-card bg-white rounded-2xl p-6 shadow-lg w-full max-w-2xl mx-auto relative">
            {/* Three-dot menu for post owner */}
            {post.user && post.user.id === currentUserId && (
                <div className="absolute top-4 right-4 z-10" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu((v) => !v)}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                        title="More options"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button
                                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center space-x-4">
                <Link to={post.user ? `/profile/${post.user.id}` : '#'} className="flex items-center space-x-4 group">
                    <img 
                        src={getProfilePictureUrl(post.user)}
                        alt={`${post.user?.username || 'User'}'s avatar`} 
                        className="w-12 h-12 rounded-full group-hover:ring-2 group-hover:ring-indigo-400 transition"
                        onError={(e) => {
                            console.error('Profile picture failed to load:', {
                                src: e.target.src,
                                user: post.user
                            });
                            e.target.src = 'https://via.placeholder.com/50';
                        }}
                    />
                    <div>
                        <h2 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{post.user?.fullName || 'Unknown User'}</h2>
                        <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </Link>
            </div>

            <div className={`mt-4 ${!imageUrl ? 'mb-4' : ''}`}>
                <h3 className="text-xl font-semibold text-gray-800">{post.title}</h3>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
            </div>

            {imageUrl && (
                <div className="flex justify-center items-center bg-gray-100 rounded-xl my-6 p-2">
                    <img
                        src={imageUrl}
                        alt="Post content"
                        className="rounded-xl shadow-lg object-contain max-h-[600px] w-full"
                    />
                </div>
            )}

            <div className={`flex space-x-4 ${!imageUrl ? 'mt-2' : 'mt-4'}`}>
                <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-2 transition-colors duration-200 ${
                        isLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-600 hover:text-red-500'
                    }`}
                >
                    <i data-feather="heart" className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} data-feather-replace></i>
                    <span className={isLiked ? 'text-red-500' : 'text-gray-600'}>Like ({likesCount})</span>
                </button>
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
                >
                    <i data-feather="message-square" className="w-5 h-5" data-feather-replace></i>
                    <span>Comment ({commentsCount})</span>
                </button>
            </div>

            {showComments && (
                <div className="mt-4">
                    <form onSubmit={handleComment} className="mb-4">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full p-2 border rounded-lg"
                        />
                        <button 
                            type="submit"
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Comment
                        </button>
                    </form>

                    <div className="space-y-4">
                        {comments.slice().reverse().map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <img 
                                        src={getProfilePictureUrl(comment.user)}
                                        alt={`${comment.user?.username || 'User'}'s avatar`} 
                                        className="w-8 h-8 rounded-full"
                                        onError={(e) => {
                                            console.error('Comment profile picture failed to load:', {
                                                src: e.target.src,
                                                user: comment.user
                                            });
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.fullName || comment.user?.username || 'User')}&background=random&color=fff`;
                                        }}
                                    />
                                    <span className="font-semibold">{comment.user?.fullName || 'Unknown User'}</span>
                                </div>
                                <p className="mt-2 text-gray-700">{comment.content}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Post</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete();
                                    closeModal();
                                }}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Post; 