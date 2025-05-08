import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const Post = ({ post, currentUserId, onPostUpdate }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
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
        try {
            await postService.likePost(post.id, currentUserId);
            setIsLiked(!isLiked);
            if (onPostUpdate) {
                onPostUpdate();
            }
        } catch (error) {
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
            if (onPostUpdate) {
                onPostUpdate();
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const imageUrl = post.imageData 
        ? `data:image/jpeg;base64,${post.imageData}`
        : null;

    return (
        <div className="post-card bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
                <img 
                    src={post.user.profilePicture 
                        ? `data:image/jpeg;base64,${post.user.profilePicture}`
                        : 'https://via.placeholder.com/50'} 
                    alt={`${post.user.username}'s avatar`} 
                    className="w-12 h-12 rounded-full"
                />
                <div>
                    <h2 className="font-semibold text-gray-800">{post.user.fullName}</h2>
                    <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-gray-800">{post.title}</h3>
            <p className="mt-2 text-gray-700">{post.content}</p>

            {imageUrl && (
                <img src={imageUrl} alt="Post content" className="mt-4 w-full rounded-lg" />
            )}

            <div className="flex space-x-4 mt-4">
                <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                >
                    <i data-feather="heart"></i>
                    <span>Like ({post.likesCount})</span>
                </button>
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-500"
                >
                    <i data-feather="message-square"></i>
                    <span>Comment ({post.commentsCount})</span>
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
                                        src={comment.user.profilePicture 
                                            ? `data:image/jpeg;base64,${comment.user.profilePicture}`
                                            : 'https://via.placeholder.com/40'} 
                                        alt={`${comment.user.username}'s avatar`} 
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="font-semibold">{comment.user.fullName}</span>
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