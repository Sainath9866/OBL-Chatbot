import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import TileCarousel from './TileCarousel';
import ContactForm from './contact';
import { useAction } from './ActionContent';
import MicInput from "./MicInput";

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Good afternoon. 👋 Thank you for reaching out to Orient Bell Tiles help desk.\nKindly choose one of the options👇',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
        { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
        { label: 'About us 🤝', action: 'ABOUT_US' },
        { label: 'Contact us 📞', action: 'CONTACT_US' },
        { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' }
      ]
    }
  ]);
  const [visibleCategories, setVisibleCategories] = useState(9);
  const [allCategories] = useState(['wall-tiles', 'floor-tiles', 'liquidation-tiles', 'bathroom-tiles', 'kitchen-tiles', 'parking-tiles', 'elevation-tiles', 'bedroom-tiles', 'outdoor-tiles', 'terrace-tiles', 'living-room-tiles', 'balcony-tiles', 'swimming-pool-tiles', 'porch-tiles', 'office-tiles', 'pathway-tiles', 'dining-room-tiles', 'commercial-tiles', 'bar-tiles', 'restaurant-tiles', 'hospital-tiles', 'accent-tiles', 'automotive-tiles', 'school-tiles', 'high-traffic-tiles', 'step-stairs-tiles', 'industrial-tiles', '3d-tiles', 'wooden-tiles', 'marble-tiles', 'texture-tiles', 'mosaic-tiles', 'granite-tiles', 'stone-tiles', 'pattern-tiles', 'cement-tiles', 'flower-tiles', 'travertine-tiles', 'slate-tiles', 'statuario-tiles', 'plain-tiles', 'metallic-tiles', 'bottochino-tiles', 'book-match-tiles', 'geometric-tiles', 'carrara-tiles', 'abstract-tiles', 'monochrome-tiles', 'stylized-tiles', 'brick-tiles', 'hexagonal-tiles', 'wooden-plank-tiles', 'vitrified-tiles', 'ceramic-tiles', 'designer-tiles', 'anti-skid-tiles', 'digital-tiles', 'double-charge-tiles', 'cool-tiles', 'highlighter-tiles', 'forever-tiles', 'nano-tiles', 'printed-double-charge-tiles', 'non-digital-tiles', 'terracotta-tiles', 'white-tiles', 'black-tiles', 'grey-tiles', 'chequered-tiles', 'blue-tiles', 'red-tiles', 'green-tiles', 'beige-tiles', 'ivory-tiles', 'yellow-tiles', 'cream-tiles', 'pink-tiles', 'orange-tiles', 'light-tiles', 'dark-tiles', 'wenge-tiles', 'brown-tiles', 'sandune-tiles', '2x2-tiles', '2x4-tiles', '4x4-tiles', '1x1-tiles', '300x600-tiles', '395x395-tiles', '300x450-tiles', '200x1200-tiles', '800x800-tiles', '800x1600-tiles', '145x600-tiles', '195x1200-tiles', '200x300-tiles', '250x375-tiles', '400x400-tiles', '1000x1000-tiles', 'matte-finish-tiles', 'glossy-tiles', 'sugar-finish-tiles', 'satin-finish-tiles', 'super-glossy-tiles', 'reactive-tiles', 'tile-collection', 'versalia-vitrified-tiles', 'inspire3-0', 'granalt-tiles', 'inspire-800x1600-mm', 'inspire-art-collection', 'timeless-2-0', 'duazzle-elevation-series', 'marvel', 'pavers-tile', 'eleganz', 'canto-series-tiles', 'big-tiles', 'gft-autumn-2-0', 'inspired-dora-gvt', 'serenity-collection', 'carving-tiles', 'white-marble-tiles', 'green-marble-tiles', 'grey-marble-tiles', 'brown-marble-tiles', 'beige-marble-tiles', 'blue-marble-tiles', 'black-marble-tiles', 'moroccan-tiles', '2x2-double-charge-tiles', '2x4-double-charge-tiles', 'pooja-room-tiles', '80x160-dc', 'bathroom-wall-tiles', 'counter-top', 'kitchen-wall-tiles', 'inspire-xl-1200x1800', 'inspire-special', 'gvt-endless-tiles', 'terrazzo-tiles', 'wash-basin-tiles', 'double-charge-vitrified-tiles', 'lapato-finish-tiles', 'carpet-tile', 'pillar-tile-design', '3d-floor-tile', 'blue-bathroom-tiles-design', 'roof-tiles', 'mumbai', 'bangalore', 'slab-tiles', 'large-tiles', 'dolphin-tiles', 'touch-feel-gvt', 'raiganj', 'jangipur', 'alipurduar', 'cup-plate-tiles', 'fruit-tiles', 'delhi', 'kolkata', 'chennai', 'hyderabad', 'pune', 'lucknow', 'darjeeling', 'dora-gvt-plank-tiles', 'bhopal', 'jabalpur', 'indore', 'patna', 'coimbatore', 'nagpur', 'ernakulam', 'kerala', 'noida', 'gurugram', 'touch-feel-gvt-dora', 'craft-cladding-collection', 'mandala-collection', '300x300-hsk-pavers', 'panchkula', 'narnaul', 'mahendragarh', 'sohna', 'nuh', 'pataudi', 'bhiwadi', 'dharuhera', 'manesar', 'farukhnagar', 'paverxtreme-tiles', 'black-and-white-tiles', 'kitchen-countertop', 'kolhapur', 'rangoli', 'harmony-wall-tiles', 'timeless-heavy-duty-tiles', 'general', 'wooden-floor-tiles', 'marble-floor-tiles', 'vitrified-floor-tiles', 'bedroom-wall-tiles', 'living-room-wall-tiles', '3d-wall-tiles', 'wooden-wall-tiles', '4x8-tiles', 'multi-colour-tiles', 'onyx-tiles', '600x00-tiles', 'purple-tiles', 'sparkle-tiles', 'granalt']);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }; 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTranscription = (transcription) => {
    setInput(transcription);
  };
  

  const TypingIndicator = () => (
    <div className="flex gap-1 items-center p-2">
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  );

  

  const { currentAction } = useAction();

  useEffect(() => {
    if (currentAction === 'SHOW_TILES') {
      const displayCategories = allCategories.slice(0, visibleCategories);
      const hasMore = visibleCategories < allCategories.length;
      
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'show tiles 🧱',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'Please choose a tile category:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: [
            ...displayCategories.map(category => ({
              label: category,
              action: category.toUpperCase().replace(/ /g, '_')
            })),
            ...(hasMore ? [{ label: 'See More👈', action: 'SHOW_MORE_TILES' }] : [])
          ]
        }
      ]);
    }
  }, [currentAction]);

  const sendMessageToBackend = async (userMessage) => {
    console.log(userMessage);
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage
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
      },
      {
        type: 'bot',
        content: 'Kindly choose one of the options👇',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: [
          { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
          { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
          { label: 'About us 🤝', action: 'ABOUT_US' },
          { label: 'Contact us 📞', action: 'CONTACT_US' },
          { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' }
        ]
      }
    ]);
    }
  };

  const handleOptionClick = async (action) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if the action is 'SHOW_TILES'
    if (action === 'SHOW_TILES') {
      const displayCategories = allCategories.slice(0, visibleCategories);
      const hasMore = visibleCategories < allCategories.length;
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'show tiles 🧱',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'Please choose a tile category:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: [
            ...displayCategories.map(category => ({
              label: category,
              action: category.toUpperCase().replace(/ /g, '_')
            })),
            ...(hasMore ? [{
              label: 'See More👈',
              action: 'SHOW_MORE_TILES'
            }] : [])
          ]
        }
      ]);
    } else if(action === 'CONTACT_US'){
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Contact us 📞',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'You can Contact us 📞 on \n📞 1800-208-1015 \nOR write to us at jegatheeswaran.palsamy@orientbell.com',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'Kindly choose one of the options👇',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: [
            { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
            { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
            { label: 'About us 🤝', action: 'ABOUT_US' },
            { label: 'Contact us 📞', action: 'CONTACT_US' },
            { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' }
          ]
        }
      ]);
    }else if(action === 'Careers 🧑🏻‍💼'){
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Careers 🧑🏻‍💼',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: <ContactForm/>,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if(action === 'ABOUT_US'){
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'About us 🤝',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'Orient Bell Tiles is a well-known tile manufacturing company that offers a wide range of high-quality tiles for various applications, including residential and commercial spaces.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: 'Kindly choose one of the options👇',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: [
            { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
            { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
            { label: 'About us 🤝', action: 'ABOUT_US' },
            { label: 'Contact us 📞', action: 'CONTACT_US' },
            { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' }
          ]
        }
      ]);
    } else if(action === 'STORE_LOCATOR'){
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Store Locator 🏪',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: <ContactForm/>,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }else if (action === 'SHOW_MORE_TILES') {
      setVisibleCategories(prev => Math.min(prev + 9, allCategories.length));
      const displayCategories = allCategories.slice(0, visibleCategories + 9);
      const hasMore = (visibleCategories + 9) < allCategories.length;

      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the last message
        {
          type: 'bot',
          content: 'Please choose a tile category:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: [
            ...displayCategories.map(category => ({
              label: category,
              action: category.toUpperCase().replace(/ /g, '_')
            })),
            ...(hasMore ? [{
              label: 'See More👈',
              action: 'SHOW_MORE_TILES'
            }] : [])
          ]
        }
      ]);
    }
    // Inside handleOptionClick function, add this case for handling size selection:
    else if (action.startsWith('SIZE_')) {
      const selectedSize = action.replace('SIZE_', '') + ' mm ft';
      console.log(selectedSize)
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Selected size: ${selectedSize}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: <TileCarousel category={selectedCategory} size={selectedSize} />,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        
      ]);
      setTimeout(scrollToBottom, 100);
    } else if (action.toUpperCase().includes('TILES')) {
      // Convert the action to match backend expectations

      // Convert the action to match backend expectations
      const category = action
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-');

      // Store the selected category
      setSelectedCategory(category);

      console.log(selectedCategory)


      setMessages(prev => [...prev, {
        type: 'user',
        content: category,
        timestamp
      }]);

      try {
        setIsLoading(true);

        // Updated request to match backend expectations
        const response = await fetch('http://127.0.0.1:8000/size', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ category }) // Match the backend model parameter name
        });

        if (!response.ok) {
          // Log the error response for debugging
          const errorData = await response.text();
          console.error('Server response:', errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Format the sizes as buttons
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select a size:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: data.sizes.map(size => ({
              label: size,
              action: `SIZE_${size.replace(/[^0-9x]/g, '')}`
            }))
          }
        ]);
      } catch (error) {
        console.error('Error details:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: "I apologize, but I couldn't fetch the tile sizes. Please try again or contact support if the issue persists.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if(action === 'Careers 🧑🏻‍💼'){
        <ContactForm/>
    }
  };
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className=" max-w-[400px] md:max-w-[400px] lg:max-w-[450px] h-screen bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-green-600 p-3 md:p-4 rounded-t-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shrink-0">
              <img src="chatbot-icon.png" alt="Orient Bell Logo" className="rounded-full" />
            </div>
            <div className="text-white">
              <div className="font-semibold text-xs md:text-sm">Orient Bell Tiles Help Desk</div>
              <div className="text-[10px] md:text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {isLoading ? 'Typing...' : 'We are online to assist you'}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {messages.map((message, index) => (
            <div key={index}>
              <div className={`${message.type === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`${message.type === 'user'
                    ? 'bg-green-600 text-white px-4 py-2 rounded-lg inline-block'
                    : 'bg-gray-100 p-4 rounded-lg w-full'
                  }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={`text-xs ${message.type === 'user'
                      ? 'text-green-100'
                      : 'text-gray-500 mt-1'
                    }`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>

              {message.options && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {message.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option.action)}
                      className="py-1.5 px-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm text-center"
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
          <MicInput onTranscription={handleTranscription} isDisabled={isLoading} />
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