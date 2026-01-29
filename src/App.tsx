import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import ToolTip from './components/tooltip/Tooltip';
import Startup from './components/startup/Startup';
import ArrowUp from './assets/icons/ArrowUp';
import Plus from './assets/icons/Plus';
import Image from './assets/icons/Image';
import Spinner from './components/spinner/Spinner';
import Close from './assets/icons/Close';
import { fetchCompletion, fetchImageRecognition, fetchMockResponse } from './services/api';

import './App.css';

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  type: 'text' | 'image';
  content: string;
};

type ChatOption = 'summarize' | 'proofread' | 'image-recognition' | null;

function App() {
  const maxChats = import.meta.env.VITE_MAX_CHATS;

  const [messages, setMessages] = useState<Message[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [useMock, setUseMock] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatCount, setChatCount] = useState<number>(0);
  const [chatOption, setChatOption] = useState<ChatOption>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<{
    base64String: string;
    name: string;
  }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sanitizeHtml = useCallback((content: string): string => {
    const rawHtml = marked(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, []);

  const fetchChatResponse = async () => {
    if (!userPrompt && !imagePrompt) return;
    if (chatCount >= maxChats) return;

    setIsLoading(true);
    setError(null);

    let promptText = userPrompt;

    if (chatOption === 'summarize') {
      promptText = `Please summarize the following text: '${promptText}'`;
    } else if (chatOption === 'proofread') {
      promptText = `Please proofread and fix spelling, grammar and style of the following text: '${promptText}'`;
    } else if (chatOption === 'image-recognition' && !userPrompt) {
      promptText = 'Please provide a description of the image';
    }

    const newMessages = [...messages] as Message[];

    if (imagePrompt) {
      newMessages.push(
        { role: 'user', type: 'text', content: promptText },
        { role: 'user', type: 'image', content: imagePrompt.base64String }
      );
    } else {
      newMessages.push({ role: 'user', type: 'text', content: promptText });
    }
    setMessages(newMessages);

    try {
      let responseMessage: string | undefined;

      if (useMock) {
        const mockData = await fetchMockResponse();
        responseMessage = mockData.response;
      } else if (chatOption === 'image-recognition') {
        const chatResponse = await fetchImageRecognition(newMessages);
        responseMessage = chatResponse.response;
      } else {
        const textMessages = newMessages
          .filter((msg) => msg.type === 'text')
          .map((msg) => ({ role: msg.role, content: msg.content }));
        const chatResponse = await fetchCompletion(textMessages);
        responseMessage = chatResponse.response;
      }

      if (responseMessage) {
        setMessages([...newMessages, { role: 'assistant', type: 'text', content: responseMessage }]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setUserPrompt('');
      setImagePrompt(undefined);
      setIsLoading(false);
      setChatCount((prev) => prev + 1);
      setChatOption(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value);
    const textarea = event.target;
    textarea.style.height = 'auto';
    const maxHeight = 300;
    const newHeight = Math.min(textarea.scrollHeight + 2, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleButtonClick = () => {
    fetchChatResponse();
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      fetchChatResponse();
    }
  };

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setChatOption('image-recognition');
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePrompt({ base64String, name: file.name });
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setChatCount(0);
    setError(null);
    setChatOption(null);
    setImagePrompt(undefined);
    setUserPrompt('');
  }, []);

  const toggleMock = () => {
    setUseMock(!useMock);
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  const placeholderText = useMemo(() => {
    switch (chatOption) {
      case 'summarize':
        return 'Enter your chat prompt here to summarize';
      case 'proofread':
        return 'Enter your chat prompt here to proofread';
      case 'image-recognition':
        return 'Ask questions about the image';
      default:
        return 'Enter your chat prompt here';
    }
  }, [chatOption]);

  const initialChatState = useMemo(() => messages.length === 0, [messages]);
  const canSendMessage = userPrompt.length > 0 || imagePrompt?.base64String;

  return (
    <div className="App">
      <div className="header-section">
        <div className="header-content">
          <div className="header-actions-left">
            <ToolTip text="New Chat" position="left">
              <button
                className={`add-icon ${messages.length === 0 ? 'disabled' : ''}`}
                onClick={handleNewChat}
                disabled={messages.length === 0}
                aria-label="Start new chat"
              >
                <Plus />
              </button>
            </ToolTip>
          </div>
          <div className="header-actions-right">
            {import.meta.env.VITE_ENV !== 'production' && (
              <div className="mock-toggle ml-20">
                <label>
                  <input type="checkbox" checked={useMock} onChange={toggleMock} />
                  <span className="ml-10">Use Mock Response</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <Close />
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <Startup />
      ) : (
        <div className="messages-section">
          <div className="messages-container container">
            {messages.map((message, index) => {
              if (message.content && message.type === 'text') {
                return (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }}
                  />
                );
              } else if (message.content && message.type === 'image') {
                return (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                  >
                    <img src={message.content} className="image-message" alt="Uploaded content" />
                  </div>
                );
              }
              return null;
            })}
            {isLoading && (
              <div className="message assistant-message loading-message">
                <Spinner /> Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className={`chat-input-section ${initialChatState ? 'startup-position' : 'chat-position'}`}>
        {isLoading ? (
          <Spinner />
        ) : chatCount >= maxChats ? (
          <div className="chat-status-label">
            Chat limit reached for this session. Please refresh the page to start a new session.
          </div>
        ) : (
          <>
            <div className="chat-container container">
              {imagePrompt?.name && (
                <div className="image-added-label">
                  <img src={imagePrompt.base64String} className="added-image-thumbnail" alt="Selected image preview" />
                  {imagePrompt?.name}
                  <button
                    className="close-icon"
                    onClick={() => setImagePrompt(undefined)}
                    aria-label="Remove selected image"
                  >
                    <Close />
                  </button>
                </div>
              )}
              <textarea
                value={userPrompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={placeholderText}
                className={`chat-input ${chatOption ? chatOption : ''}`}
                style={{ overflow: 'hidden' }}
                aria-label="Chat message input"
              />
              <div className="chat-input-actions">
                <div className="chat-input-actions-container">
                  <div className="chat-input-actions-left">
                    {initialChatState && (
                      <div className="actions-pills-group">
                        <button
                          className={`actions-pill summarize ${chatOption === 'summarize' ? 'active' : ''}`}
                          onClick={() => {
                            setImagePrompt(undefined);
                            setChatOption(chatOption === 'summarize' ? null : 'summarize');
                          }}
                          aria-pressed={chatOption === 'summarize'}
                        >
                          Summarize
                        </button>

                        <button
                          className={`actions-pill proofread ${chatOption === 'proofread' ? 'active' : ''}`}
                          onClick={() => {
                            setImagePrompt(undefined);
                            setChatOption(chatOption === 'proofread' ? null : 'proofread');
                          }}
                          aria-pressed={chatOption === 'proofread'}
                        >
                          Improve Text
                        </button>
                        <ToolTip text="Image Recognition" position="right">
                          <label className="image-upload-icon" aria-label="Upload image for recognition">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                            <Image />
                          </label>
                        </ToolTip>
                      </div>
                    )}
                  </div>

                  <div className="chat-input-actions-right">
                    <ToolTip text="Send Chat" position="left">
                      <button
                        className={`send-icon ${!canSendMessage ? 'inactive' : ''}`}
                        onClick={handleButtonClick}
                        disabled={!canSendMessage}
                        aria-label="Send message"
                      >
                        <ArrowUp />
                      </button>
                    </ToolTip>
                  </div>
                </div>
              </div>
              {initialChatState && <div className="chat-input-label">Maximum {maxChats} chats per session</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
