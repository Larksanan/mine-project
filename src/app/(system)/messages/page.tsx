'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/messages';
import { FiSend, FiMessageCircle, FiUsers, FiSearch } from 'react-icons/fi';

export default function MessagesPage() {
  const { data: session } = useSession();
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');
  const {
    conversations,
    currentMessages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    markAsRead,
  } = useMessages();

  const handleConversationSelect = async (conversationId: string) => {
    setActiveConversation(conversationId);
    await fetchMessages(conversationId);

    // Mark messages as read
    currentMessages.forEach(message => {
      if (!message.read && message.receiverId === session?.user?.id) {
        markAsRead(message.id);
      }
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return;

    const receiverId = conversation.participants.find(
      id => id !== session?.user?.id
    );
    if (!receiverId) return;

    const success = await sendMessage({
      receiverId,
      content: newMessage,
    });

    if (success) {
      setNewMessage('');
    }
  };

  if (!session) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-2xl font-bold text-gray-900 mb-2'
          >
            Please Sign In
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='text-gray-600'
          >
            You need to be signed in to view messages.
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
        >
          <div className='grid grid-cols-1 md:grid-cols-3 h-150'>
            {/* Conversations List */}
            <div className='border-r border-gray-200'>
              <div className='p-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <FiMessageCircle className='mr-2 h-5 w-5' />
                  Messages
                </h2>
              </div>

              <div className='p-4'>
                <div className='relative mb-4'>
                  <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <input
                    type='text'
                    placeholder='Search conversations...'
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                {isLoading ? (
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  </div>
                ) : error ? (
                  <div className='text-center py-8 text-red-600'>
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {conversations.map(conversation => (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          activeConversation === conversation.id
                            ? 'bg-blue-50 border border-blue-200'
                            : ''
                        }`}
                        onClick={() =>
                          handleConversationSelect(conversation.id)
                        }
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                              <FiUsers className='h-5 w-5 text-white' />
                            </div>
                            <div>
                              <p className='text-sm font-medium text-gray-900'>
                                Conversation
                              </p>
                              <p className='text-xs text-gray-500 truncate max-w-37.5'>
                                {conversation.lastMessage?.content ||
                                  'No messages yet'}
                              </p>
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className='bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {conversations.length === 0 && (
                      <div className='text-center py-8 text-gray-500'>
                        <FiMessageCircle className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                        <p className='text-sm'>No conversations yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className='md:col-span-2 flex flex-col'>
              {activeConversation ? (
                <>
                  <div className='flex-1 p-4 overflow-y-auto'>
                    {isLoading ? (
                      <div className='flex justify-center py-8'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {currentMessages.map(message => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                              message.senderId === session.user.id
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === session.user.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className='text-sm'>{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.senderId === session.user.id
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {new Date(
                                  message.createdAt
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}

                        {currentMessages.length === 0 && (
                          <div className='text-center py-8 text-gray-500'>
                            <p>No messages in this conversation yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='border-t border-gray-200 p-4'>
                    <div className='flex space-x-2'>
                      <input
                        type='text'
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e =>
                          e.key === 'Enter' && handleSendMessage()
                        }
                        placeholder='Type a message...'
                        className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className='bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <FiSend className='h-5 w-5' />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex-1 flex items-center justify-center text-gray-500'>
                  <div className='text-center'>
                    <FiMessageCircle className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
