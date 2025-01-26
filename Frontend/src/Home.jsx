import React, { useState } from "react";
import ChatInterface from "./chat";
import { ActionProvider } from "./ActionContent";

function App() {
  const [showChat, setShowChat] = useState(false);

  const handleChatButtonClick = () => {
    setShowChat(true);
  };

  return (
    <div className="h-screen bg-gray-100 flex justify-center items-center">
      {!showChat ? (
        <div className="fixed bottom-8 right-8 flex flex-col items-center">
          {/* Message Box */}
          <div className="bg-white shadow-lg rounded-lg p-4 text-center mb-3">
            <p className="text-gray-700 text-sm">Hello There 👋, chat with us!</p>
            <button
              className="bg-green-500 text-white text-sm font-semibold mt-2 px-3 py-1 rounded hover:bg-green-600 transition"
              onClick={handleChatButtonClick}
            >
              Chat Now
            </button>
          </div>

          {/* Chatbot Icon */}
          <div
            className="w-16 h-16 flex justify-center items-center rounded-full border-4 border-green-100 cursor-pointer hover:scale-105 transition-transform"
            onClick={handleChatButtonClick}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/128/811/811476.png"
              alt="Chatbot Icon"
              className="w-12 h-12"
            />
          </div>
        </div>
      ) : (
        <ActionProvider>
        <ChatInterface setShowChat={setShowChat} />
      </ActionProvider>
      )}
    </div>
  );
}

export default App;
