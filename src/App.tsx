import { useState, useEffect, useRef } from "react";
import { Mistral } from "@mistralai/mistralai";

import "./App.css";

function App() {
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [useMock, setUseMock] = useState<boolean>(true); // State to toggle mock response
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatResponse = async () => {
    if (!userPrompt) return;

    setIsLoading(true); // Set loading state to true

    const newMessages = [...messages, { role: "user", content: userPrompt }];

    if (useMock) {
      // Fetch mock response from local JSON file
      const response = await fetch("/data/chatResponse.json");
      const mockData = await response.json();
      const message = mockData.choices[0].message.content;
      newMessages.push({ role: "assistant", content: message });
    } else {
      // Fetch response from API
      const client = new Mistral({ apiKey: apiKey });
      const chatResponse = await client.chat.complete({
        model: "mistral-tiny",
        messages: [{ role: "user", content: userPrompt }],
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
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value);
    event.target.style.height = "auto"; // Reset the height
    event.target.style.height = `${event.target.scrollHeight}px`; // Set the height to the scroll height
    // const container = event.target.parentElement?.parentElement;
    // if (container) {
    //   container.style.height = `${event.target.scrollHeight}px`; // Adjust the container height
    // }
    // const chatSection = container?.parentElement;
    // if (chatSection) {
    //   chatSection.style.marginBottom = `${event.target.scrollHeight + 20}px`; // Adjust the chat section margin
    // }
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
      <h1>Chat Bot</h1>
      <div className="mock-toggle mt-20">
        <label>
          <input type="checkbox" checked={useMock} onChange={toggleMock} />
          <span className="ml-10">Use Mock Response</span>
        </label>
      </div>

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

      <div
        className="chat-input-section mt-20"
        style={{ position: "fixed", bottom: 0, width: "100%" }}>
        <div className="input-container">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <div className="chat-container">
                <textarea
                  value={userPrompt}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter your chat prompt here"
                  className="chat-input"
                  style={{ overflow: "hidden" }} // Hide overflow to prevent scrollbars
                />
                <i className="send-icon" onClick={handleButtonClick}>
                  <svg
                    width="14"
                    height="17"
                    viewBox="0 0 14 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6.96 16.64a1.47 1.47 0 0 1-1.04-.43c-.14-.14-.24-.3-.32-.48a1.55 1.55 0 0 1-.11-.56L5.46 2.63h2.93l.03 12.54c0 .19-.04.38-.11.56-.07.18-.18.34-.32.48-.14.14-.3.24-.47.32-.18.07-.37.11-.56.11z"
                      fill="currentColor"></path>
                    <path
                      d="M.39 7.76c-.14-.14-.24-.3-.33-.48-.06-.18-.1-.37-.1-.56 0-.2.04-.39.1-.57.09-.18.19-.34.33-.47L5.41.63c.2-.2.44-.36.71-.47a2.112 2.112 0 0 1 1.66 0c.26.11.5.27.7.47l5.02 5.05c.14.13.24.29.31.47a1.388 1.388 0 0 1 0 1.13c-.07.18-.17.34-.31.48-.14.14-.31.24-.48.32-.18.07-.36.11-.56.11-.19 0-.39-.04-.56-.11a1.4 1.4 0 0 1-.47-.32L6.94 3.25 2.46 7.76c-.14.14-.29.24-.47.32-.18.07-.37.11-.56.11-.2 0-.38-.04-.56-.11C.68 8 .53 7.9.39 7.76z"
                      fill="currentColor"></path>
                  </svg>
                </i>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
