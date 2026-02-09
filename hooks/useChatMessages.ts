/**
 * useChatMessages Hook
 *
 * Manages chat message state and operations.
 * Unified message management for chat interactions.
 */

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addMessages: (messages: Omit<ChatMessage, 'id' | 'timestamp'>[]) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  removeLastMessage: () => void;
}

export const useChatMessages = (): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const addMessages = useCallback((newMessages: Omit<ChatMessage, 'id' | 'timestamp'>[]) => {
    const messagesWithIds: ChatMessage[] = newMessages.map(msg => ({
      ...msg,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date()
    }));
    setMessages(prev => [...prev, ...messagesWithIds]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
  }, []);

  return {
    messages,
    addMessage,
    addMessages,
    clearMessages,
    setMessages,
    removeLastMessage
  };
};
