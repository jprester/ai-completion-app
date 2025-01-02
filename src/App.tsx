import { useState, useEffect, useRef } from "react";
import { Mistral } from "@mistralai/mistralai";

import ArrowUp from "./assets/icons/ArrowUp";

import "./App.css";
import {
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from "@mistralai/mistralai/models/components";

type Message = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

type PayloadMessages = (
  | (SystemMessage & {
      role: "system";
    })
  | (UserMessage & {
      role: "user";
    })
  | (AssistantMessage & {
      role: "assistant";
    })
  | (ToolMessage & {
      role: "tool";
    })
)[];

function App() {
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
  const maxChats = import.meta.env.VITE_MAX_CHATS; // Maximum number of chats per session

  const [messages, setMessages] = useState<Message[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [useMock, setUseMock] = useState<boolean>(true); // State to toggle mock response
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading
  const [chatCount, setChatCount] = useState<number>(0); // State to track the number of chats
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatResponse = async () => {
    if (!userPrompt || chatCount >= maxChats) return;

    setIsLoading(true); // Set loading state to true

    const newMessages = [
      ...messages,
      { role: "user", content: userPrompt },
    ] as Message[];

    if (useMock) {
      // Fetch mock response from local JSON file
      const response = await fetch("/data/chatResponse.json");
      const mockData = await response.json();
      const message = mockData.choices[0].message.content as string;
      newMessages.push({ role: "assistant", content: message });
    } else {
      // Fetch response from API
      const client = new Mistral({ apiKey: apiKey });
      const chatResponse = await client.chat.complete({
        model: "mistral-tiny",
        messages: newMessages as PayloadMessages, // changed to send entire conversation
      });

      if (chatResponse?.choices?.length) {
        const message = chatResponse.choices[0].message.content as string;
        if (message) {
          newMessages.push({ role: "assistant", content: message });
        }
      }
    }

    setMessages(newMessages);
    setUserPrompt("");
    setIsLoading(false); // Set loading state to false
    setChatCount(chatCount + 1); // Increment chat count
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value);
    event.target.style.height = "auto"; // Reset the height
    event.target.style.height = `${event.target.scrollHeight}px`; // Set the height to the scroll height
  };

  const handleButtonClick = () => {
    fetchChatResponse();
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      fetchChatResponse();
    }
  };

  const toggleMock = () => {
    setUseMock(!useMock);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="App">
      <h1>CoolChat</h1>
      {import.meta.env.VITE_ENV !== "prod" && (
        <div className="mock-toggle mt-20">
          <label>
            <input type="checkbox" checked={useMock} onChange={toggleMock} />
            <span className="ml-10">Use Mock Response</span>
          </label>
        </div>
      )}

      <div className="response-section mt-20">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.role === "user" ? "user-message" : "assistant-message"
              }`}>
              {message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-container">
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : chatCount >= maxChats ? (
          <div className="limit-reached">
            Chat limit reached for this session. Please refresh the page to
            start a new session.
          </div>
        ) : (
          <>
            <div className="chat-container">
              <div className="chat-input-label">
                Maximum {maxChats} chats per session
              </div>
              <textarea
                value={userPrompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Enter your chat prompt here"
                className="chat-input"
                style={{ overflow: "hidden" }} // Hide overflow to prevent scrollbars
              />
              <i className="send-icon" onClick={handleButtonClick}>
                <ArrowUp />
              </i>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
