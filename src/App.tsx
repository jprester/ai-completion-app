import { useEffect, useState } from "react";
import { Mistral } from "@mistralai/mistralai";

import "./App.css";

function App() {
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
  const [responseMessage, setResponseMessage] = useState<any>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [useMock, setUseMock] = useState<boolean>(true); // State to toggle mock response
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading

  const fetchChatResponse = async () => {
    if (!userPrompt) return;

    setIsLoading(true); // Set loading state to true

    if (useMock) {
      // Fetch mock response from local JSON file
      const response = await fetch("/data/chatResponse.json");
      const mockData = await response.json();
      const message = mockData.choices[0].message.content;
      setResponseMessage(message);
    } else {
      // Fetch response from API
      const client = new Mistral({ apiKey: apiKey });
      const chatResponse = await client.chat.complete({
        model: "mistral-tiny",
        messages: [{ role: "user", content: userPrompt }],
      });

      if (chatResponse?.choices?.length) {
        const message = chatResponse.choices[0].message.content;
        if (message) {
          setResponseMessage(message);
        }
      }
    }

    setIsLoading(false); // Set loading state to false
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserPrompt(event.target.value);
  };

  const handleButtonClick = () => {
    fetchChatResponse();
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchChatResponse();
    }
  };

  const toggleMock = () => {
    setUseMock(!useMock);
  };

  return (
    <div className="App">
      <h1>App Starter</h1>
      <div className="mock-toggle mt-20">
        <label>
          <input type="checkbox" checked={useMock} onChange={toggleMock} />
          <span className="ml-10">Use Mock Response</span>
        </label>
      </div>
      <div className="input-container mt-20">
        <input
          type="text"
          value={userPrompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Enter your chat prompt here"
          className="chat-input"
        />
      </div>
      <div className="button-container">
        <button onClick={handleButtonClick} className="button send">
          Send
        </button>
      </div>

      <div className="response-section mt-20">
        {isLoading ? (
          <p>Loading...</p>
        ) : responseMessage ? (
          <p>{responseMessage}</p>
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
}

export default App;
