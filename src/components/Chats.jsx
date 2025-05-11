import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/messageService';
import { userService } from '../services/api';
import '../styles/Chats.css';

const Chats = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      messageService.initializeWebSocket(user.id);
    }
  }, [user?.id]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!user?.id) return;

    const handleNewMessage = (msg) => {
      const message = {
        ...msg,
        sender: msg.sender || { id: msg.senderId },
        receiver: msg.receiver || { id: msg.receiverId },
      };
      setMessages(prev => {
        if (!message.id || prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setProcessedMessageIds(prev => {
        const newSet = new Set(prev);
        if (message.id) newSet.add(message.id);
        return newSet;
      });
      // Update chat preview in sidebar (only lastMessage and timestamp)
      setChats(prevChats => {
        const otherUser = message.sender.id === user.id ? message.receiver : message.sender;
        let updated = false;
        const updatedChats = prevChats.map(chat => {
          if (chat.id === otherUser.id) {
            updated = true;
            return {
              ...chat,
              lastMessage: message.content,
              timestamp: new Date(message.timestamp).toLocaleTimeString(),
              // avatar remains unchanged
            };
          }
          return chat;
        });
        // If chat not found, add it (with avatar)
        if (!updated) {
          const avatar = otherUser.profilePicture
            ? (otherUser.profilePicture.startsWith('data:image')
                ? otherUser.profilePicture
                : (otherUser.profilePicture.length > 30
                    ? `data:image/jpeg;base64,${otherUser.profilePicture}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.fullName || otherUser.username)}&background=random&color=fff`))
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.fullName || otherUser.username)}&background=random&color=fff`;
          updatedChats.unshift({
            id: otherUser.id,
            type: 'direct',
            name: otherUser.fullName || otherUser.username,
            lastMessage: message.content,
            timestamp: new Date(message.timestamp).toLocaleTimeString(),
            unread: 0,
            avatar,
            user: otherUser
          });
        }
        return updatedChats;
      });
    };

    const removeHandler = messageService.addMessageHandler(handleNewMessage);
    return () => removeHandler();
  }, [user?.id, selectedChat]);

  // Utility function for consistent avatar resolution
  const getProfilePictureUrl = (user) => {
    if (!user) return 'https://ui-avatars.com/api/?name=User&background=random&color=fff';
    try {
      if (user.profilePicture) {
        if (user.profilePicture.startsWith('data:image')) {
          return user.profilePicture;
        }
        if (typeof user.profilePicture === 'string' && user.profilePicture.length > 0) {
          return `data:image/jpeg;base64,${user.profilePicture}`;
        }
      }
      if (user.profilePictureBase64) {
        if (user.profilePictureBase64.startsWith('data:image')) {
          return user.profilePictureBase64;
        }
        if (typeof user.profilePictureBase64 === 'string' && user.profilePictureBase64.length > 0) {
          return `data:image/jpeg;base64,${user.profilePictureBase64}`;
        }
      }
    } catch (error) {
      console.error('Error processing profile picture:', error);
    }
    const name = user.fullName || user.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  // Process messages into chat list
  const processMessagesIntoChats = (messages) => {
    const chatMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.sender.id === user.id ? msg.receiver.id : msg.sender.id;
      const otherUser = msg.sender.id === user.id ? msg.receiver : msg.sender;
      const avatar = getProfilePictureUrl(otherUser);
      if (!chatMap.has(otherUserId)) {
        chatMap.set(otherUserId, {
          id: otherUserId,
          type: 'direct',
          name: otherUser.fullName || otherUser.username,
          lastMessage: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          unread: 0,
          avatar,
          user: otherUser
        });
      } else {
        // Update existing chat with latest message
        const existingChat = chatMap.get(otherUserId);
        if (new Date(msg.timestamp) > new Date(existingChat.timestamp)) {
          chatMap.set(otherUserId, {
            ...existingChat,
            lastMessage: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            avatar
          });
        }
      }
    });
    
    // Sort chats by timestamp, most recent first
    return Array.from(chatMap.values()).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  };

  // Fetch user's chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const messages = await messageService.getMessagesForUser(user.id);
        const processedChats = processMessagesIntoChats(messages);
        setChats(processedChats);
        setLoading(false);
      } catch (err) {
        if (err.response?.status !== 403) {
          setError('Failed to load chats');
        }
        setLoading(false);
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  // Search users when typing
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim()) {
        try {
          const results = await userService.searchUsers(searchTerm.trim());
          // Filter out the current user and users we already have chats with
          const filteredResults = results.filter(
            result => result.id !== user.id && !chats.some(chat => chat.id === result.id)
          );
          setSearchResults(filteredResults);
        } catch (err) {
          console.error('Error searching users:', err);
        }
      } else {
        setSearchResults([]);
      }
    };

    searchUsers();
  }, [searchTerm, user, chats]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat) {
        try {
          console.log('Fetching messages for chat:', selectedChat);
          const messages = await messageService.getMessagesBetweenUsers(user.id, selectedChat.id);
          console.log('Received messages:', messages);
          setMessages(messages);
          scrollToBottom();
        } catch (err) {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages');
        }
      }
    };

    fetchMessages();
  }, [selectedChat, user]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && selectedChat) {
      try {
        await messageService.sendMessage(
          user.id,
          selectedChat.id,
          message.trim(),
          selectedImage
        );
        setMessage('');
        setSelectedImage(null);
        // Do not add to messages here; wait for WebSocket
      } catch (err) {
        setError('Failed to send message');
      }
    }
  };

  const handleStartChat = async (userId, username, profilePicture = null, fullName = null) => {
    let userProfile = null;
    try {
      userProfile = await userService.getUserProfile(userId);
    } catch (err) {
      userProfile = { id: userId, username, fullName: fullName || username, profilePicture };
    }
    const avatar = getProfilePictureUrl(userProfile);
    const newChat = {
      id: userId,
      type: 'direct',
      name: userProfile.fullName || userProfile.username,
      lastMessage: '',
      timestamp: new Date().toLocaleTimeString(),
      unread: 0,
      avatar,
      user: userProfile
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    setShowNewChat(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // After setMessages, recalculate chat previews
  useEffect(() => {
    if (!user) return;
    setChats(prevChats => {
      // Build a map of latest message per chat
      const latestByChat = {};
      messages.forEach(msg => {
        const otherUserId = msg.sender.id === user.id ? msg.receiver.id : msg.sender.id;
        if (!latestByChat[otherUserId] || new Date(msg.timestamp) > new Date(latestByChat[otherUserId].timestamp)) {
          latestByChat[otherUserId] = msg;
        }
      });
      return prevChats.map(chat => {
        const latest = latestByChat[chat.id];
        if (latest) {
          return {
            ...chat,
            lastMessage: latest.content,
            timestamp: new Date(latest.timestamp).toLocaleTimeString(),
          };
        }
        return chat;
      });
    });
  }, [messages, user]);

  if (loading) {
    return <div className="chats-container flex items-center justify-center">
      <div className="text-gray-400">Loading chats...</div>
    </div>;
  }

  // Don't show error state if we just have no chats
  if (error && error !== 'No chats found') {
    return <div className="chats-container flex items-center justify-center">
      <div className="text-red-400">{error}</div>
    </div>;
  }

  return (
    <div className="chats-container">
      {/* Sidebar */}
      <div className="chats-sidebar">
        <div className="chats-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChat(!showNewChat)}
          >
            {showNewChat ? 'Cancel' : 'New Chat'}
          </button>
        </div>
        
        {showNewChat ? (
          <div className="new-chat-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users to chat with..."
              className="search-input"
            />
            <div className="search-results">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => handleStartChat(user.id, user.fullName || user.username, user.profilePicture, user.fullName)}
                >
                  <img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=random&color=fff`}
                    alt={user.fullName || user.username}
                    className="chat-avatar"
                  />
                  <div className="user-info">
                    <h3>{user.fullName || user.username}</h3>
                    <p className="username">@{user.username}</p>
                  </div>
                </div>
              ))}
              {searchTerm && searchResults.length === 0 && (
                <div className="no-results">No users found</div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-list">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
                  <div className="chat-info" style={{ display: 'flex', alignItems: 'start', gap: '8px', marginLeft: '4px', justifyContent: 'flex-start' }}>
                    <span className="chat-name" style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{chat.name}</span>
                    <span className="last-message" style={{ color: '#9ca3af', fontSize: '0.95rem', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{chat.lastMessage}</span>
                  </div>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="no-chats">
                <p>No chats yet</p>
                <button 
                  className="start-chat-btn"
                  onClick={() => setShowNewChat(true)}
                >
                  Start a new chat
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <img src={selectedChat.avatar} alt={selectedChat.name} className="chat-avatar" />
              <div className="chat-header-info">
                <h2>{selectedChat.name}</h2>
              </div>
            </div>

            <div className="messages-container">
              {messages.length > 0 ? (
                messages
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .map((msg) => (
                        <div
                            key={msg.id || Math.random()}
                            className={`message ${msg.sender?.id === user.id ? 'sent' : 'received'}`}
                        >
                            <div className="message-content">
                                {msg.content}
                                {msg.imageBase64 && (
                                    <img 
                                        src={`data:image/jpeg;base64,${msg.imageBase64}`} 
                                        alt="Message attachment" 
                                        className="message-image"
                                        onError={(e) => {
                                            console.error('Failed to load message image:', e);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                            </div>
                            <span className="message-time">
                                {formatMessageTime(msg.timestamp)}
                            </span>
                        </div>
                    ))
              ) : (
                <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-container" onSubmit={handleSendMessage}>
              {selectedImage && (
                <div className="selected-image-preview">
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Selected" 
                    className="preview-image"
                  />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={removeSelectedImage}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="input-actions">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="image-upload-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a chat to start messaging</h2>
            <p>Or start a new conversation with someone</p>
            <button 
              className="start-chat-btn"
              onClick={() => setShowNewChat(true)}
            >
              Start a new chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats; 