import { useState, useEffect, useRef } from 'react';
import { AssistantMessage, SystemMessage, ToolMessage, UserMessage } from '@mistralai/mistralai/models/components';
import { marked } from 'marked';

import ToolTip from './components/tooltip/Tooltip';
import Startup from './components/startup/Startup';
import ArrowUp from './assets/icons/ArrowUp';
import Plus from './assets/icons/Plus';
import Image from './assets/icons/Image';

import './App.css';
import Spinner from './components/spinner/Spinner';

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
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
  const [chatOption, setChatOption] = useState<'summarize' | 'proofread' | null>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatResponse = async () => {
    if (!userPrompt || chatCount >= maxChats) return;

    setIsLoading(true); // Set loading state to true

    let promptText = userPrompt;

    if (chatOption === 'summarize') {
      promptText = `Please summarize the following text: '${promptText}'`;
    } else if (chatOption === 'proofread') {
      promptText = `Please proofread and fix spelling, grammar and style of the following text: '${promptText}'`;
    }

    const newMessages = [...messages, { role: 'user', content: promptText }] as Message[];
    setMessages(newMessages);

    if (useMock) {
      // Fetch mock response from local JSON file
      const response = await fetch('/data/chatResponse.json');
      const mockData = await response.json();
      const message = mockData.choices[0].message.content as string;
      newMessages.push({ role: 'assistant', content: message });
    } else {
      // Fetch response from API
      const chatResponse = await fetch(`${VITE_DOMAIN}/${VITE_API_BASE_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-tiny',
          content: newMessages as PayloadMessages,
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
          newMessages.push({ role: 'assistant', content: message });
        }
      }
    }

    setMessages(newMessages);
    setUserPrompt('');
    setIsLoading(false); // Set loading state to false
    setChatCount(chatCount + 1); // Increment chat count
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
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMessages([...messages, { role: 'user', content: `<img src="${base64String}" alt="uploaded image" />` }]);
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
  } else {
    placeholderText = 'Enter your chat prompt here';
  }

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
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                dangerouslySetInnerHTML={{ __html: marked(message.content) }} // Convert Markdown to HTML
              />
            ))}
            {isLoading && (
              <div className="message assistant-message loading-message">
                <Spinner /> Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className={`chat-input-section ${messages.length > 0 ? 'chat-position' : 'startup-position'}`}>
        {isLoading ? (
          <Spinner />
        ) : chatCount >= maxChats ? (
          <div className="chat-status-label">
            Chat limit reached for this session. Please refresh the page to start a new session.
          </div>
        ) : (
          <>
            <div className="chat-container container">
              <div className="chat-input-label">Maximum {maxChats} chats per session</div>
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
                    <label className="image-upload-icon">
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      <Image />
                    </label>
                    <div className="actions-pills-group">
                      <div
                        className={`actions-pill summarize ${chatOption === 'summarize' ? 'active' : ''}`}
                        onClick={() => {
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
                          if (chatOption === 'proofread') {
                            setChatOption(null);
                          } else {
                            setChatOption('proofread');
                          }
                        }}
                      >
                        Proofread
                      </div>
                    </div>
                  </div>
                  <div className="chat-input-actions-right">
                    <i className={`send-icon ${!userPrompt.length ? 'inactive' : ''}`} onClick={handleButtonClick}>
                      <ArrowUp />
                    </i>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
