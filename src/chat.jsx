import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Good afternoon. 👋 Thank you for reaching out to Orient Bell Tiles help desk.\nKindly choose one of the options👇',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: 'Show Tiles', action: 'SHOW_TILES' },
        { label: 'Store Locator', action: 'STORE_LOCATOR' },
        { label: 'About us', action: 'ABOUT_US' },
        { label: 'Contact us', action: 'CONTACT_US' },
        { label: 'Careers', action: 'CAREERS' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Predefined responses for quick actions
  const predefinedResponses = {
    SHOW_TILES: "Here are our popular tile categories:\n- Bathroom Tiles\n- Kitchen Tiles\n- Living Room Tiles\n- Outdoor Tiles\nWhich category would you like to explore?",
    STORE_LOCATOR: "Please share your city name or PIN code to help you locate the nearest Orient Bell Tiles store.",
    ABOUT_US: "Orient Bell Tiles is a leading manufacturer of ceramic tiles in India. We offer a wide range of tiles for all your needs. Would you like to know more about our history or products?",
    CONTACT_US: "You can reach us at:\nEmail: info@orientbell.com\nPhone: 1800-123-123-123\nOr let me know what you'd like assistance with.",
    CAREERS: "Visit our careers page at orientbell.com/careers to explore current opportunities. Would you like information about any specific role?"
  };

  const TypingIndicator = () => (
    <div className="flex gap-1 items-center p-2">
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  );

  const sendMessageToBackend = async (userMessage) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: messages.map(msg => ({
            type: msg.type,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      return {
        response: "I apologize, but I'm having trouble connecting to the server. Please try again later.",
        suggested_options: null
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = input.trim();
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => [...prev, { 
        type: 'user', 
        content: userMessage,
        timestamp 
      }]);
      setInput('');

      const data = await sendMessageToBackend(userMessage);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: data.suggested_options ? data.suggested_options.map(option => ({
          label: option,
          action: option.toUpperCase().replace(/ /g, '_')
        })) : null
      }]);
    }
  };

  const handleOptionClick = async (action) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (predefinedResponses[action]) {
      setMessages(prev => [
        ...prev,
        { 
          type: 'user', 
          content: action.replace(/_/g, ' ').toLowerCase(),
          timestamp 
        },
        { 
          type: 'bot', 
          content: predefinedResponses[action],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      const userMessage = action.replace(/_/g, ' ').toLowerCase();
      setMessages(prev => [...prev, { 
        type: 'user', 
        content: userMessage,
        timestamp 
      }]);
      
      const data = await sendMessageToBackend(userMessage);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: data.suggested_options ? data.suggested_options.map(option => ({
          label: option,
          action: option.toUpperCase().replace(/ /g, '_')
        })) : null
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-[calc(100vh-2rem)] bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-green-600 p-3 md:p-4 rounded-t-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shrink-0">
              <img src="chatbot-icon.png" alt="Orient Bell Logo" className="rounded-full" />
            </div>
            <div className="text-white">
              <div className="font-semibold text-sm md:text-base">Orient Bell Tiles Help Desk</div>
              <div className="text-xs md:text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {isLoading ? 'Typing...' : 'We are online to assist you'}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`${message.type === 'user' ? 'ml-auto' : ''}`}>
              <div className={`max-w-[80%] p-2 md:p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-green-600 text-white ml-auto' 
                  : 'bg-gray-100'
              }`}>
                <div className="whitespace-pre-wrap text-sm md:text-base">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </div>
              </div>

              {message.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {message.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option.action)}
                      className="p-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm md:text-base"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex">
              <div className="bg-gray-100 rounded-lg">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-green-600 text-sm md:text-base"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}