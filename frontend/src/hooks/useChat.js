import { useState, useCallback, useRef } from 'react';
import { queryAgent } from '../api/client';

let conversationCounter = 0;

export function useChat() {
  const [conversations, setConversations] = useState([
    { id: 'default', title: 'New Conversation', messages: [] },
  ]);
  const [activeConversation, setActiveConversation] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConversation) || conversations[0];
  const messages = activeConv?.messages || [];

  const updateConversation = useCallback((convId, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, ...updater(c) } : c))
    );
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      const userMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      // Add user message immediately
      updateConversation(activeConversation, (conv) => ({
        messages: [...conv.messages, userMessage],
        title: conv.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '...' : '') : conv.title,
      }));

      setIsLoading(true);

      try {
        const response = await queryAgent(text);

        const assistantMessage = {
          role: 'assistant',
          content: response.answer,
          citations: response.citations || [],
          confidence: response.confidence || 0,
          requestId: response.request_id,
          timestamp: new Date().toISOString(),
        };

        updateConversation(activeConversation, (conv) => ({
          messages: [...conv.messages, assistantMessage],
        }));
      } catch (error) {
        const errorMessage = {
          role: 'assistant',
          content: error.message || 'Sorry, something went wrong. Please try again.',
          citations: [],
          confidence: 0,
          timestamp: new Date().toISOString(),
        };

        updateConversation(activeConversation, (conv) => ({
          messages: [...conv.messages, errorMessage],
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversation, isLoading, updateConversation]
  );

  const startNewChat = useCallback(() => {
    conversationCounter += 1;
    const newId = `conv-${Date.now()}`;
    setConversations((prev) => [
      { id: newId, title: 'New Conversation', messages: [] },
      ...prev,
    ]);
    setActiveConversation(newId);
  }, []);

  const switchConversation = useCallback((id) => {
    setActiveConversation(id);
  }, []);

  return {
    messages,
    conversations,
    activeConversation,
    isLoading,
    sendMessage,
    startNewChat,
    switchConversation,
  };
}
