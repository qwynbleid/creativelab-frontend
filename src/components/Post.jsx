import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { initializeIcons, updateIcons } from '../utils/icons';

const Post = ({ post, currentUserId, onPostUpdate }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

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

    return (
        <div className="post-card bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
                <img 
                    src={getProfilePictureUrl(post.user)}
                    alt={`${post.user?.username || 'User'}'s avatar`} 
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                        console.error('Profile picture failed to load:', {
                            src: e.target.src,
                            user: post.user
                        });
                        e.target.src = 'https://via.placeholder.com/50';
                    }}
                />
                <div>
                    <h2 className="font-semibold text-gray-800">{post.user?.fullName || 'Unknown User'}</h2>
                    <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-gray-800">{post.title}</h3>
            <p className="mt-2 text-gray-700">{post.content}</p>

            {imageUrl && (
                <div className="flex justify-center items-center bg-gray-100 rounded-xl my-6 p-2">
                    <img
                        src={imageUrl}
                        alt="Post content"
                        className="rounded-xl shadow-lg object-cover max-h-[600px] w-auto max-w-full"
                        style={{ minHeight: '300px' }}
                    />
                </div>
            )}

            <div className="flex space-x-4 mt-4">
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
                        {comments.map((comment) => (
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
        </div>
    );
};

export default Post; 