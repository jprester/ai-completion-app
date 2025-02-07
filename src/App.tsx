import { useState, useEffect, useRef, useMemo } from 'react';
import { AssistantMessage, SystemMessage, ToolMessage, UserMessage } from '@mistralai/mistralai/models/components';
import { marked } from 'marked';

import ToolTip from './components/tooltip/Tooltip';
import Startup from './components/startup/Startup';
import ArrowUp from './assets/icons/ArrowUp';
import Plus from './assets/icons/Plus';
import Image from './assets/icons/Image';

import './App.css';
import Spinner from './components/spinner/Spinner';
import Close from './assets/icons/Close';

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  type: 'text' | 'image';
  content: string;
};

type PayloadMessages = (
  | (SystemMessage & {
      role: 'system';
    })
  | (UserMessage & {
      role: 'user';
    })
  | (AssistantMessage & {
      role: 'assistant';
    })
  | (ToolMessage & {
      role: 'tool';
    })
)[];

function App() {
  const maxChats = import.meta.env.VITE_MAX_CHATS; // Maximum number of chats per session

  const VITE_DOMAIN = import.meta.env.VITE_DOMAIN;
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [messages, setMessages] = useState<Message[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [useMock, setUseMock] = useState<boolean>(false); // State to toggle mock response
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading
  const [chatCount, setChatCount] = useState<number>(0); // State to track the number of chats
  const [chatOption, setChatOption] = useState<'summarize' | 'proofread' | 'image-recognition' | null>();
  const [imagePrompt, setImagePrompt] = useState<{
    base64String: string;
    name: string;
  }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatResponse = async () => {
    if (!userPrompt || chatCount >= maxChats) return;

    setIsLoading(true); // Set loading state to true

    let promptText = userPrompt;

    if (chatOption === 'summarize') {
      promptText = `Please summarize the following text: '${promptText}'`;
    } else if (chatOption === 'proofread') {
      promptText = `Please proofread and fix spelling, grammar and style of the following text: '${promptText}'`;
    } else if (chatOption === 'image-recognition' && !imagePrompt) {
      promptText = 'Please provide a description of the image';
    }

    let newMessages = [...messages] as Message[];

    if (imagePrompt) {
      newMessages.push(
        {
          role: 'user',
          type: 'text',
          content: promptText,
        },
        {
          role: 'user',
          type: 'image',
          content: imagePrompt.base64String,
        }
      );
    } else {
      newMessages = newMessages.concat({ role: 'user', type: 'text', content: promptText });
    }
    setMessages(newMessages);

    if (useMock) {
      // Fetch mock response from local JSON file
      const response = await fetch('/data/chatResponse.json');
      const mockData = await response.json();
      const message = mockData.choices[0].message.content as string;
      newMessages.push({ role: 'assistant', type: 'text', content: message });
    } else if (chatOption === 'image-recognition') {
      // Fetch response from API
      const chatResponse = await fetch(`${VITE_DOMAIN}/${VITE_API_BASE_URL}/image-recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: newMessages as PayloadMessages,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .catch((error) => {
          console.error('Error:', error);
        });
      if (chatResponse?.response) {
        const message = chatResponse.response as string;
        if (message) {
          newMessages.push({ role: 'assistant', type: 'text', content: message });
        }
      }
    } else {
      // Fetch response from API
      const chatResponse = await fetch(`${VITE_DOMAIN}/${VITE_API_BASE_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-tiny',
          content: newMessages.filter((message) => message.type === 'text') as PayloadMessages,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .catch((error) => {
          console.error('Error:', error);
        });
      if (chatResponse?.response) {
        const message = chatResponse.response as string;
        if (message) {
          newMessages.push({ role: 'assistant', type: 'text', content: message });
        }
      }
    }

    setMessages(newMessages);
    setUserPrompt('');
    setImagePrompt(undefined);
    setIsLoading(false); // Set loading state to false
    setChatCount(chatCount + 1); // Increment chat count
    setChatOption(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value);
    event.target.style.height = 'auto'; // Reset the height
    event.target.style.height = `${event.target.scrollHeight + 2}px`; // Set the height to the scroll height
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setChatOption('image-recognition');
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePrompt({
          base64String,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMock = () => {
    setUseMock(!useMock);
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  // write variable for placeholder chat text depending on chatOption
  let placeholderText = '';
  if (chatOption === 'summarize') {
    placeholderText = 'Enter your chat prompt here to summarize';
  } else if (chatOption === 'proofread') {
    placeholderText = 'Enter your chat prompt here to proofread';
  } else if (chatOption === 'image-recognition') {
    placeholderText = 'Ask questions about the image';
  } else {
    placeholderText = 'Enter your chat prompt here';
  }

  const initialChatState = useMemo(() => messages.length === 0, [messages]);

  return (
    <div className="App">
      <div className="header-section">
        <div className="header-content">
          <div className="header-actions-left">
            <ToolTip
              text="New Chat"
              position="left"
              children={
                <i
                  className={`add-icon ${messages.length === 0 ? 'disabled' : ''}`}
                  onClick={() => {
                    setMessages([]);
                    setChatCount(0);
                  }}
                >
                  <Plus />
                </i>
              }
            />
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
                    dangerouslySetInnerHTML={{ __html: marked(message.content) }} // Convert Markdown to HTML
                  />
                );
              } else if (message.content && message.type === 'image') {
                return (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                  >
                    <img src={message.content as string} className="image-message" />
                  </div>
                );
              }
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
                  <img src={imagePrompt.base64String} className="added-image-thumbnail" />
                  {imagePrompt?.name}{' '}
                  <span className="close-icon" onClick={() => setImagePrompt(undefined)}>
                    <Close />
                  </span>
                </div>
              )}
              <textarea
                value={userPrompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={placeholderText}
                className={`chat-input ${chatOption ? chatOption : ''}`}
                style={{ overflow: 'hidden' }} // Hide overflow to prevent scrollbars
              />
              <div className="chat-input-actions">
                <div className="chat-input-actions-container">
                  <div className="chat-input-actions-left">
                    {initialChatState && (
                      <div className="actions-pills-group">
                        <div
                          className={`actions-pill summarize ${chatOption === 'summarize' ? 'active' : ''}`}
                          onClick={() => {
                            setImagePrompt(undefined);
                            if (chatOption === 'summarize') {
                              setChatOption(null);
                            } else {
                              setChatOption('summarize');
                            }
                          }}
                        >
                          Summarize
                        </div>

                        <div
                          className={`actions-pill proofread ${chatOption === 'proofread' ? 'active' : ''}`}
                          onClick={() => {
                            setImagePrompt(undefined);
                            if (chatOption === 'proofread') {
                              setChatOption(null);
                            } else {
                              setChatOption('proofread');
                            }
                          }}
                        >
                          Improve Text
                        </div>
                        <ToolTip
                          text="Image Recognition"
                          position="right"
                          children={
                            <label className="image-upload-icon">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                              />
                              <Image />
                            </label>
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="chat-input-actions-right">
                    <ToolTip
                      text="Send Chat"
                      position="left"
                      children={
                        <i
                          className={`send-icon ${!userPrompt.length && !imagePrompt?.base64String ? 'inactive' : ''}`}
                          onClick={handleButtonClick}
                        >
                          <ArrowUp />
                        </i>
                      }
                    />
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
