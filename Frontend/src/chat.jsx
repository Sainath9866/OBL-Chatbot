import { useState, useRef, useEffect } from 'react';
import { Send, Menu } from 'lucide-react';
import TileCarousel from './TileCarousel';
import ContactForm from './contact';
import { useAction } from './ActionContent';
import MicInput from "./MicInput";
import { X } from 'lucide-react';
import Sales from './Sales';
import { useNavigate } from 'react-router-dom';
import SuggestedOptionsViewer from './Render';
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 16) return "Good afternoon";
  if (hour >= 16 && hour < 20) return "Good evening";
  return "Good night";
};



const initialMessage = {
  type: 'bot',
  content: `${getGreeting()}. 👋 Thank you for reaching out to Orient Bell Tiles help desk.\nKindly choose one of the options👇`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  options: [
    { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
    { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
    { label: 'About us 🤝', action: 'ABOUT_US' },
    { label: 'Contact us 📞', action: 'CONTACT_US' },
    { label: 'Download Catalogue 📑', action: 'DOWNLOAD_CATALOGUE' },
    { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' },
    { label: 'Confused? Shall I recommend tiles? 🤔', action: 'RECOMMEND_TILE', className: 'col-span-2' }
  ]
};



const MenuPopup = ({ isOpen, onClose, handleOptionClick }) => {
  if (!isOpen) return null;

  const tileOptions = [
    ["Bathroom-tiles", "Living-tiles"],
    ["Kitchen-tiles", "Bedroom-tiles"],
    ["Balcony-tiles", "Swimming Pool-tiles"],
    ["Accent-tiles", "Outdoor-tiles"],
    ["Office-tiles", "See More👈"]
  ];

  return (
    <div className="max-w-[300px] md:max-w-[350px] lg:max-w-[400px] absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-[350px] border border-gray-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={16} />
      </button>

      {/* Grid layout for buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 ">
        {tileOptions.map((row, rowIndex) => (
          row.map((option, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => {
                if (option === "See More👈") {
                  handleOptionClick('SHOW_MORE_TILES');
                } else {
                  handleOptionClick(option.toUpperCase().replace(/-/g, '_'));
                }
                onClose();
              }}
              className="py-2 px-4 text-center border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm whitespace-nowrap"
            >
              {option}
            </button>
          ))
        ))}
      </div>
    </div>
  );
};





export default function ChatInterface({ setShowChat }) {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `${getGreeting()}. 👋 Thank you for reaching out to Orient Bell Tiles help desk.\nKindly choose one of the options👇`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: 'Show Tiles 🧱', action: 'SHOW_TILES' },
        { label: 'Store Locator 🏪', action: 'STORE_LOCATOR' },
        { label: 'About us 🤝', action: 'ABOUT_US' },
        { label: 'Contact us 📞', action: 'CONTACT_US' },
        { label: 'Download Catalogue 📑', action: 'DOWNLOAD_CATALOGUE' },
        { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' },
        { label: 'Confused? Shall I recommend tiles? 🤔', action: 'RECOMMEND_TILE', className: 'col-span-2' },
      ]
    }
  ]);
  const [visibleCategories, setVisibleCategories] = useState(9);
  const [allCategories] = useState(["Bathroom-tiles", "Living-tiles", "Kitchen-tiles", "Bedroom-tiles", "Balcony-tiles", "Swimming Pool-tiles", "Accent-tiles", "Outdoor-tiles", "Office-tiles", "Pathway-tiles", "Dining-tiles", "Hospital-tiles", "High Traffic-tiles", "bar-tiles", "Restaurant-tiles", "School & College-tiles", "Office-tiles", "Commercial-tiles", "Outdoor Area-tiles", "Parking-tiles", "Porch-tiles", "Automotive-tiles","Airport-tiles", "Metro Station-tiles","Warehouse-tiles"]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedState, setSelectedState] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedCategory]);

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

 
  const { currentAction, actionCounter } = useAction();

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
  }, [currentAction, actionCounter]); // Add actionCounter as a dependency
  const checkForTileRequest = (message) => {
    const tileRequestPatterns = [
      'recommend me', 'show me', 'looking for', 'need', 'want', 'searching for', 'interested in', 'display', 'suggest', 'find', 'browse', 'view',
      'tiles for', 'tiles in', 'tiles near', 'tiles around', 'tiles at', 'tiles on', 'tiles from', 'tiles to', 'tiles by', 'tiles under', 'tiles above',
      'tiles below', 'tiles between', 'tiles with', 'tiles without', 'tiles that', 'tiles which', 'tiles like', 'tiles similar', 'tiles same',
      'tiles different', 'tiles matching', 'tiles similar to', 'tiles identical to', 'bathroom tiles', 'living room tiles', 'kitchen tiles', 'bedroom tiles',
      'balcony tiles', 'swimming pool tiles', 'accent tiles', 'outdoor tiles', 'office tiles', 'pathway tiles', 'dining tiles', 'hospital tiles', 'high traffic tiles',
      'bar tiles', 'restaurant tiles', 'school & college tiles', 'office tiles', 'commercial tiles', 'outdoor area tiles', 'parking tiles', 'porch tiles', 'automotive tiles'
    ];

    const messageL = message.toLowerCase();
    const foundPattern = tileRequestPatterns.some(pattern => messageL.includes(pattern));
    const foundCategory1 = allCategories.find(category => messageL.includes(category.toLowerCase()));
    if (!foundPattern) {
      if (foundCategory1) {
        return foundCategory1;
      }
      return null;
    }
    // Check for specific tile categories
    const tileCategories = allCategories.map(cat => cat.toLowerCase());
    const foundCategory = tileCategories.find(category =>
      messageL.includes(category) ||
      messageL.includes(category.replace('-tiles', '')) ||
      messageL.includes(category.replace('-', ' '))
    );

    return foundCategory;
  };

  const sendMessageToBackend = async (userMessage) => {
    // const tileCategory = checkForTileRequest(userMessage);

    // if (tileCategory) {
    //   try {
    //     setIsLoading(true);
    //     // Set the selected category for later use
    //     setSelectedCategory(tileCategory);

    //     // Make request to size endpoint
    //     const response = await fetch('http://127.0.0.1:8000/size', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         category: tileCategory
    //       })
    //     });

    //     if (!response.ok) {
    //       throw new Error('Network response was not ok');
    //     }

    //     const data = await response.json();
    //     return {
    //       response: 'Please select a size:',
    //       suggested_options: data.sizes.map(size => ({
    //         label: size,
    //         action: `SIZE_${size.replace(/[^0-9x]/g, '')}`
    //       }))
    //     };
    //   } catch (error) {
    //     console.error('Error:', error);
    //     return {
    //       response: "I apologize, but I'm having trouble fetching the tile sizes. Please try again later.",
    //       suggested_options: null
    //     };
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }

    // Default chat behavior for non-tile requests
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Network response was not ok');
      }

      const data = await response.json();
      console.log(data.relevant_tiles);
      return {
        response: data.answer,
        suggested_options: data.relevant_tiles
      };
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

      const newMessages = data?.suggested_options?.every(option =>
        option?.label?.includes('x') ?? false
      )
        ? [{
          type: 'bot',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: data.suggested_options || []
        }]
        : [{
          type: 'bot',
          content: <SuggestedOptionsViewer
            suggested_options={data.suggested_options}
            setCurrentAction={setCurrentAction}
          />,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }];
      setTimeout(scrollToBottom, 500);
      setMessages(prev => [...prev, ...newMessages]);
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
    } else if (action === 'CONTACT_US') {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Contact us 📞',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: (
            <>
              Thank you for choosing Orientbell Tiles.
              For more details please visit{' '}
              <a
                href="https://www.orientbell.com/contact-us"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'blue', textDecoration: 'underline' }}
              >
                https://www.orientbell.com/contact-us
              </a>
            </>
          ),
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
            { label: 'Download Catalogue 📑', action: 'DOWNLOAD_CATALOGUE' },
            { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' },
            { label: 'Confused? Shall I recommend tiles? 🤔', action: 'RECOMMEND_TILE', className: 'col-span-2' },
          ]
        }
      ]);
    } else if (action === 'Careers 🧑🏻‍💼') {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Careers 🧑🏻‍💼',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: (
            <>
              Thank you for choosing Orientbell Tiles.For more details please visit{' '}
              <a
                href="https://www.orientbell.com/careers"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'blue', textDecoration: 'underline' }}
              >
                https://www.orientbell.com/careers
              </a>
            </>
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (action === 'ABOUT_US') {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'About us 🤝',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: (
            <>
              Orient Bell Tiles is a well-known tile manufacturing company that offers a wide range of high-quality tiles for various applications, including residential and commercial spaces.Thank you for choosing Orientbell Tiles.For more details please visit{' '}
              <a
                href="https://www.orientbell.com/about-us"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'blue', textDecoration: 'underline' }}
              >
                https://www.orientbell.com/about-us
              </a>
            </>
          ),
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
            { label: 'Download Catalogue 📑', action: 'DOWNLOAD_CATALOGUE' },
            { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' },
            { label: 'Confused? Shall I recommend tiles? 🤔', action: 'RECOMMEND_TILE', className: 'col-span-2' },
          ]
        }
      ]);
    } else if (action === 'STORE_LOCATOR') {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Store Locator 🏪',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: (
            <>
              Thank you for choosing Orientbell Tiles.For more details please visit{' '}
              <a
                href="https://www.orientbell.com/store-locator"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'blue', textDecoration: 'underline' }}
              >
                https://www.orientbell.com/store-locator
              </a>
            </>
          ),
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
            { label: 'Download Catalogue 📑', action: 'DOWNLOAD_CATALOGUE' },
            { label: 'Careers 🧑🏻‍💼', action: 'Careers 🧑🏻‍💼' },
            { label: 'Confused? Shall I recommend tiles? 🤔', action: 'RECOMMEND_TILE', className: 'col-span-2' },
          ]
        }

      ]);
    } else if (action === 'SHOW_MORE_TILES') {
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
      setTimeout(scrollToBottom, 1000);
    } else if (action === 'Careers 🧑🏻‍💼') {
      <ContactForm />
    }
    else if (action === 'RECOMMEND_TILE') {
      try {
        setIsLoading(true);
        setMessages(prev => [
          ...prev,
          {
            type: 'user',
            content: 'I need tile recommendations 🤔',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // Present initial options for recommendation type
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'How would you like to explore our tile recommendations?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [
              { label: 'State/City-wise', action: 'LOCATION_WISE' },
              { label: 'Size-wise', action: 'RECOMMENDATION_SIZE' },
              { label: 'Customer-wise', action: 'CUSTOMER_WISE' }
            ]
          }
        ]);
      } catch (error) {
        console.error('Error in recommendation flow:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'I apologize, but I encountered an error. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'LOCATION_WISE') {
      try {
        setIsLoading(true);
        setMessages(prev => [
          ...prev,
          {
            type: 'user',
            content: 'Selected : location wise',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // Add error handling and retry logic
        const fetchStates = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              const response = await fetch('http://127.0.0.1:8000/states');
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return await response.json();
            } catch (error) {
              if (i === retries - 1) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            }
          }
        };

        const data = await fetchStates();

        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select your state to help me recommend the best tiles for you:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: data.states.map(state => ({
              label: state,
              action: `STATE_${state.replace(/\s+/g, '_')}`
            }))
          }
        ]);
      } catch (error) {
        console.error('Error fetching states:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'I apologize, but I encountered an error. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (action.startsWith('STATE_')) {
      const state = action.replace('STATE_', '').replace(/_/g, ' ');
      setSelectedState(state);

      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Selected state: ${state}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      try {
        setIsLoading(true);
        const response = await fetch('http://127.0.0.1:8000/cities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: state })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await response.json();

        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: `Great! I'll help you find the perfect tiles for your location in ${selectedState}. Please select a city nearby your location:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: data.cities.map(city => ({
              label: city,
              action: `CITY_${city.toUpperCase().replace(/\s+/g, '_')}`
            }))
          }
        ]);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'I apologize, but I encountered an error while fetching the cities. Please try again later.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [
              { label: 'Try Again', action: 'RECOMMEND_TILE' }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (action.startsWith('CITY_')) {
      const selectedCity = action
        .replace('CITY_', '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Selected city: ${selectedCity}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    
      try {
        setIsLoading(true);
        // First fetch to get tiles and quantities for the city
        const response = await fetch('http://127.0.0.1:8000/fetch-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            state: selectedState, 
            city: selectedCity 
          })
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch tiles');
        }
    
        const data = await response.json();
    
        // Filter out tiles with zero quantity
        const filteredTiles = data.tiles.filter(tile => tile.quantity > 0);
    
        // Get unique applications from the fetch_sales_data endpoint
        const tileNamesResponse = await fetch('http://127.0.0.1:8000/fetch_sales_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tile_names: filteredTiles.map(tile => tile.name)
          }),
        });
    
        if (!tileNamesResponse.ok) {
          throw new Error('Failed to fetch tile details');
        }
    
        const tileDetailsData = await tileNamesResponse.json();
        console.log(tileDetailsData)
        // Extract unique applications from the detailed tiles data
        const uniqueApplications = [...new Set(
          tileDetailsData.tiles
            .filter(tile => tile && tile.applications)
            .flatMap(tile => 
              tile.applications.split(', ').map(app => app.trim())
            )
        )].sort();
    
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select the application area you are interested in:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: uniqueApplications.map(app => ({
              label: app,
              action: `APPLICATION_${app.replace(/\s+/g, '_')}`
            })),
            metadata: {
              tiles: tileDetailsData.tiles,
              quantities: filteredTiles.map(tile => tile.quantity.toString()),
              selectedCity
            }
          }
        ]);
        setTimeout(scrollToBottom, 500);
      } catch (error) {
        console.error('Error fetching tiles:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: `I apologize, but I encountered an error: ${error.message}. Please try again later.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }


     // Category-wise flow
    // In the SIZE_WISE case, update the action mapping:
    else if (action === 'RECOMMENDATION_SIZE') {
      try {
        setIsLoading(true);
        const response = await fetch('http://127.0.0.1:8000/sales-size');

        if (!response.ok) {
          throw new Error('Failed to fetch sizes');
        }

        const data = await response.json();

        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select a tile size to explore our recommendations:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: data.sizes.map(size => ({
              label: `${size.size} (${size.quantity.toFixed(0)} units sold)`,
              action: `SALES_SIZE${size.size.replace(/\s+/g, '_')}` // Changed from SIZE_ to SALES_SIZE
            }))
          }
        ]);
      } catch (error) {
        console.error('Error fetching sizes:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'I apologize, but I encountered an error while fetching the sizes. Please try again later.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    // Update the size selection case with new action prefix
    else if (action.startsWith('SALES_SIZE')) {
      const selectedSize = action
        .replace('SALES_SIZE', '')
        .replace(/_/g, ' ');
    
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Selected size: ${selectedSize}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    
      try {
        setIsLoading(true);
        // First fetch to get tiles and quantities for the size
        const response = await fetch('http://127.0.0.1:8000/sales-size-tiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ size: selectedSize })
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch tiles');
        }
    
        const data = await response.json();
    
        // Filter out tiles with zero quantity
        const filteredTiles = data.tiles.filter(tile => tile.quantity > 0);
    
        // Get unique applications from the fetch_sales_data endpoint
        const tileNamesResponse = await fetch('http://127.0.0.1:8000/fetch_sales_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tile_names: filteredTiles.map(tile => tile.name)
          }),
        });
    
        if (!tileNamesResponse.ok) {
          throw new Error('Failed to fetch tile details');
        }
    
        const tileDetailsData = await tileNamesResponse.json();
        
        // Extract unique applications from the detailed tiles data
        const uniqueApplications = [...new Set(
          tileDetailsData.tiles
            .filter(tile => tile && tile.applications)
            .flatMap(tile => 
              tile.applications.split(', ').map(app => app.trim())
            )
        )].sort();
    
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select the application area you are interested in:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: uniqueApplications.map(app => ({
              label: app,
              action: `APPLICATION_${app.replace(/\s+/g, '_')}`
            })),
            metadata: {
              tiles: tileDetailsData.tiles,
              quantities: filteredTiles.map(tile => tile.quantity.toString()),
              selectedSize
            }
          }
        ]);
        setTimeout(scrollToBottom, 500);
      } catch (error) {
        console.error('Error fetching tiles:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: `I apologize, but I encountered an error: ${error.message}. Please try again later.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'CUSTOMER_WISE') {
      try {
        setIsLoading(true);
        const response = await fetch('http://127.0.0.1:8000/customers');

        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }

        const data = await response.json();
        const ITEMS_PER_PAGE = 25;
        const totalCustomers = data.customers.length;

        // Show first 25 customers initially
        const initialCustomers = data.customers.slice(0, ITEMS_PER_PAGE);

        setMessages(prev => {
          const options = initialCustomers.map(customer => ({
            label: `${customer.name} (${customer.quantity.toFixed(0)} units)`,
            action: `CUSTOMER_NAME_${customer.name.replace(/\s+/g, '_')}`
          }));

          // Add "See More" button if there are more customers
          if (totalCustomers > ITEMS_PER_PAGE) {
            options.push({
              label: `See More 👈(${totalCustomers - ITEMS_PER_PAGE} more customers)`,
              action: 'SHOW_MORE_CUSTOMERS'
            });
          }

          return [
            ...prev,
            {
              type: 'bot',
              content: 'Please select a customer to see their tile purchase history:',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              options: options,
              metadata: {
                allCustomers: data.customers,
                currentPage: 1,
                totalCustomers: totalCustomers
              }
            }
          ];
        });
      } catch (error) {
        console.error('Error fetching customers:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'I apologize, but I encountered an error while fetching the customers. Please try again later.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    // Add this new case to handle "See More" clicks
    else if (action === 'SHOW_MORE_CUSTOMERS') {
      const lastMessage = messages[messages.length - 1];
      const { allCustomers, currentPage, totalCustomers } = lastMessage.metadata;
      const ITEMS_PER_PAGE = 25;

      const startIndex = currentPage * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCustomers);
      const nextCustomers = allCustomers.slice(startIndex, endIndex);

      setMessages(prev => {
        const options = nextCustomers.map(customer => ({
          label: `${customer.name} (${customer.quantity.toFixed(0)} units)`,
          action: `CUSTOMER_NAME_${customer.name.replace(/\s+/g, '_')}`
        }));

        // Add "See More" button if there are still more customers
        if (endIndex < totalCustomers) {
          options.push({
            label: `See More 👈(${totalCustomers - endIndex} more customers)`,
            action: 'SHOW_MORE_CUSTOMERS'
          });
        }

        return [
          ...prev,
          {
            type: 'bot',
            content: `Showing customers ${startIndex + 1}-${endIndex} of ${totalCustomers}:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: options,
            metadata: {
              allCustomers: allCustomers,
              currentPage: currentPage + 1,
              totalCustomers: totalCustomers
            }
          }
        ];
      });
    } // Customer selection handler
    else if (action.startsWith('CUSTOMER_NAME_')) {
      const selectedCustomer = action
        .replace('CUSTOMER_NAME_', '')
        .replace(/_/g, ' ');
    
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Selected customer: ${selectedCustomer}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    
      try {
        setIsLoading(true);
        // First fetch to get tiles and quantities for the customer
        const response = await fetch('http://127.0.0.1:8000/customer-tiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customer_name: selectedCustomer })
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch tiles');
        }
    
        const data = await response.json();
    
        // Filter out tiles with zero quantity
        const filteredTiles = data.tiles.filter(tile => tile.quantity > 0);
    
        // Get unique applications from the fetch_sales_data endpoint
        const tileNamesResponse = await fetch('http://127.0.0.1:8000/fetch_sales_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tile_names: filteredTiles.map(tile => tile.name)
          }),
        });
    
        if (!tileNamesResponse.ok) {
          throw new Error('Failed to fetch tile details');
        }
    
        const tileDetailsData = await tileNamesResponse.json();
        
        // Extract unique applications from the detailed tiles data
        const uniqueApplications = [...new Set(
          tileDetailsData.tiles
            .filter(tile => tile && tile.applications)
            .flatMap(tile => 
              tile.applications.split(', ').map(app => app.trim())
            )
        )].sort();
        console.log(uniqueApplications);
    
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Please select the application area you are interested in:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: uniqueApplications.map(app => ({
              label: app,
              action: `APPLICATION_${app.replace(/\s+/g, '_')}`
            })),
            metadata: {
              tiles: tileDetailsData.tiles,
              quantities: filteredTiles.map(tile => tile.quantity.toString()),
              selectedCustomer
            }
          }
        ]);
        setTimeout(scrollToBottom, 500);
      } catch (error) {
        console.error('Error fetching tiles:', error);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: `I apologize, but I encountered an error: ${error.message}. Please try again later.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
   // Application selection handler
else if (action.startsWith('APPLICATION_')) {
  const selectedApplication = action
    .replace('APPLICATION_', '')
    .replace(/_/g, ' ');

  // Find the last message that contains our original data
  const dataMessage = messages.findLast(msg => msg.metadata?.tiles && msg.metadata?.quantities);
  
  if (!dataMessage) {
    setMessages(prev => [
      ...prev,
      {
        type: 'bot',
        content: 'Sorry, I could not find the original tile data. Please start over.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: [{ label: 'Start Over', action: 'RECOMMEND_TILE' }]
      }
    ]);
    return;
  }

  const { tiles, quantities, selectedCustomer } = dataMessage.metadata;

  try {
    // Filter tiles based on selected application
    const filteredTilesIndices = tiles
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile }) => 
        tile.applications.split(', ').map(app => app.trim())
          .includes(selectedApplication)
      );

    const filteredTiles = {
      tiles: filteredTilesIndices.map(({ tile }) => tile),
      quantities: filteredTilesIndices.map(({ index }) => quantities[index])
    };

    // Calculate totals
    const total_quantity = filteredTiles.quantities
      .reduce((sum, qty) => sum + parseInt(qty), 0);

    const salesData = {
      tiles: filteredTiles.tiles,
      quantities: filteredTiles.quantities,
      total_unique_tiles: filteredTiles.tiles.length,
      total_quantity: total_quantity
    };

    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: `Selected application: ${selectedApplication}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        type: 'bot',
        content: <Sales salesData={salesData} />,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Preserve the original data in metadata for future application selections
       
      }
    ]);
    setTimeout(scrollToBottom, 500);
  } catch (error) {
    console.error('Error processing application selection:', error);
    setMessages(prev => [
      ...prev,
      {
        type: 'bot',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: [{ label: 'Try Again', action: 'RECOMMEND_TILE' }]
      }
    ]);
  }
}

    else if (action.toUpperCase().includes('TILES')) {
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
        content: `Selected category : ${category}`,
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
    }
    else if (action === 'DOWNLOAD_CATALOGUE') {
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'Download Catalogue 📑',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          type: 'bot',
          content: (
            <>
              You can download our latest catalogue here:{' '}
              <a
                href="https://www.orientbell.com/download-catalogue"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Download Catalogue
              </a>
            </>
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };
  const handleHomeClick = () => {
    setMessages([initialMessage]);
    setInput('');
    setVisibleCategories(9);
    setSelectedCategory(null);
    setIsLoading(false);
    setIsMenuOpen(false);
  };

  const handleClose = () => {
    setShowChat(false);
  };
  const { setCurrentAction } = useAction();



  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-full max-w-[300px] md:max-w-[350px] lg:max-w-[400px] h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-black p-3 md:p-4 rounded-t-lg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shrink-0">
              <img
                src="https://www.kenyt.ai/static/Organizations/Orient%20Bells-6580399/OrientBell_Tiles/chatbot-icon.png"
                alt="Logo"
                className="rounded-full"
              />
            </div>
            <div className="text-white">
              <div className="font-semibold text-xs md:text-sm">Orient Bell Tiles Help Desk</div>
              <div className="text-[10px] md:text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {isLoading ? 'Typing...' : 'We are online to assist you'}
              </div>
            </div>
          </div>

          {/* Original header buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
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
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs ${message.type === 'user' ? 'text-green-100' : 'text-gray-500 mt-1'
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
                      className={`py-1.5 px-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm text-center ${option.action === 'RECOMMEND_TILE' ? 'col-span-2' : ''
                        }`}
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
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your question..."
                className="w-full py-2.5 px-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 text-sm md:text-base"
                disabled={isLoading}
              />
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="p-2 text-black hover:text-gray-600 transition-colors disabled:text-gray-400"
              >
                <Send size={20} />
              </button>
              <button
                onClick={handleHomeClick}
                className="p-2 text-black hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-black hover:text-gray-600 transition-colors"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
          <MenuPopup
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            handleOptionClick={handleOptionClick}
          />
        </div>
      </div>
    </div>
  );
}
