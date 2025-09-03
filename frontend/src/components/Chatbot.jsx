import React, { useState, useRef, useEffect } from 'react';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi there! I'm your E-Commerce Assistant. How can I help you today?",
      sender: "bot"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    { text: "How to browse products", keyword: "browse" },
    { text: "How to use the cart", keyword: "cart" },
    { text: "How to track orders", keyword: "track" },
    { text: "How to update profile", keyword: "profile" },
    { text: "How to make payment", keyword: "payment" },
    { text: "Product inquiries", keyword: "products" },
    { text: "Delivery information", keyword: "delivery" },
    { text: "Return policy", keyword: "return" }
  ];

  const botResponses = {
    welcome: "Hi there! I'm your E-Commerce Assistant. How can I help you today?",
    browse: "To browse products:\n1. Use the navigation menu to select categories\n2. Use the search bar to find specific items\n3. Filter results by price, brand, or rating\n4. Click on products to view details, images, and reviews",
    cart: "Using your shopping cart:\n1. Click 'Add to Cart' to place items in your cart\n2. Click the cart icon to review your selections\n3. Modify quantities or remove items before checkout\n4. Your cart saves items between sessions when logged in",
    track: "To track your orders:\n1. Go to 'My Orders' in your account section\n2. View order status (Processing, Shipped, Delivered)\n3. Click on any order for detailed tracking information\n4. Contact support if delivery exceeds estimated time",
    profile: "Updating your profile:\n1. Click on your account name in the top right\n2. Select 'Profile' from the dropdown menu\n3. Edit personal information, shipping addresses, or preferences\n4. Remember to save your changes before exiting",
    payment: "Making a payment:\n1. Proceed to checkout from your cart\n2. Select your preferred payment method (credit card, PayPal, etc.)\n3. Enter your payment details securely\n4. Review your order and confirm purchase\n5. You'll receive an email confirmation with order details",
    
    // Enhanced responses based on the original chatbot
    products: "We offer Sarees, Kurtis, Dresses, T-Shirts, Shoes, Jewelry, and more! 🛍️",
    saree: "Our Saree collection includes Silk, Cotton, and Designer Sarees. Would you like to see budget-friendly or premium sarees?",
    kurti: "We have stylish Kurtis starting at just ₹299. Perfect for casual and office wear 👗.",
    shoes: "Trendy shoes for men & women 👟. Do you want sports shoes, casual, or formal?",
    jewelry: "✨ Explore our collection of Necklaces, Earrings, and Bangles. Affordable and stylish!",
    accessories: "👜 Accessories → Handbags, Clutches, Wallets, Sunglasses, Belts. Which type are you looking for?",
    footwear: "👟 Footwear → Sports Shoes, Sandals, Casual Shoes, Heels, Slippers. Do you want men's, women's, or kids' footwear?",
    delivery: "🚚 Standard delivery takes 5–7 days. Express delivery (where available) takes 2–3 days.",
    shipping: "📮 We deliver across India. Shipping charges depend on seller & weight. Many items come with Free Delivery 🚀.",
    return: "♻️ You can return a product from My Orders → Click Return Policy button → Return. We will validate the reason within 7 days.",
    refund: "💰 Refunds are processed within 5–7 business days after pickup.",
    cod: "✅ Yes, Cash on Delivery is available on most products. Pay only when you get your order.",
    offers: "🎉 Big Offers Zone → Discounts up to 50%! Daily deals and combo offers available.",
    
    default: "I'm not sure how to help with that. Try asking about browsing products, using the cart, tracking orders, updating your profile, or making payments."
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const newMessages = [...messages, { text: inputValue, sender: 'user' }];
    setMessages(newMessages);
    setInputValue('');
    setShowQuickReplies(false);
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      let botResponse = botResponses.default;
      const userMessage = inputValue.toLowerCase();
      
      // Check for keywords in the user's message
      if (userMessage.includes('browse') || userMessage.includes('product') || userMessage.includes('find')) {
        botResponse = botResponses.browse;
      } else if (userMessage.includes('cart') || userMessage.includes('bag') || userMessage.includes('add')) {
        botResponse = botResponses.cart;
      } else if (userMessage.includes('track') || userMessage.includes('order') || userMessage.includes('status')) {
        botResponse = botResponses.track;
      } else if (userMessage.includes('profile') || userMessage.includes('account') || userMessage.includes('update')) {
        botResponse = botResponses.profile;
      } else if (userMessage.includes('pay') || userMessage.includes('checkout') || userMessage.includes('purchase')) {
        botResponse = botResponses.payment;
      } else if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
        botResponse = botResponses.welcome;
      } else if (userMessage.includes('saree') || userMessage.includes('sari')) {
        botResponse = botResponses.saree;
      } else if (userMessage.includes('kurti') || userMessage.includes('kurta')) {
        botResponse = botResponses.kurti;
      } else if (userMessage.includes('shoe') || userMessage.includes('footwear')) {
        botResponse = botResponses.shoes;
      } else if (userMessage.includes('jewel') || userMessage.includes('necklace') || userMessage.includes('earring')) {
        botResponse = botResponses.jewelry;
      } else if (userMessage.includes('accessor')) {
        botResponse = botResponses.accessories;
      } else if (userMessage.includes('deliver') || userMessage.includes('shipping')) {
        botResponse = botResponses.delivery;
      } 
      else if (userMessage.includes('return') || userMessage.includes('refund')) {
        botResponse = botResponses.return;
      } 
      else if (userMessage.includes('cod') || userMessage.includes('cash on delivery')) {
        botResponse = botResponses.cod;
      } else if (userMessage.includes('offer') || userMessage.includes('discount')) {
        botResponse = botResponses.offers;
      }
      
      setMessages(prevMessages => [...prevMessages, { text: botResponse, sender: 'bot' }]);
    }, 500);
  };

  const handleQuickReply = (keyword) => {
    setInputValue(keyword);
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    // Reset to initial state when opening
    if (!isOpen) {
      setMessages([
        {
          text: "Hi there! I'm your E-Commerce Assistant. How can I help you today?",
          sender: "bot"
        }
      ]);
      setShowQuickReplies(true);
    }
  };

  if (!isOpen) {
    return (
      <button className="chatbotToggle" onClick={toggleChatbot}>
        <span className="chatbotIcon">💬</span>
      </button>
    );
  }

  return (
    <div className="chatbotContainer">
      <div className="chatHeader">
        <h3 className="headerText">E-Commerce Assistant</h3>
        <span className="statusIndicator">Online</span>
        <button 
          onClick={toggleChatbot} 
          className="closeButton"
        >
          ×
        </button>
      </div>
      
      <div className="chatWindow">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`messageBubble ${message.sender === 'bot' ? 'botMessage' : 'userMessage'}`}
          >
            {message.text.split('\n').map((line, i) => (
              <p key={i} className="messageText">{line}</p>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {showQuickReplies && (
        <div className="quickReplies">
          <p className="quickReplyTitle">Quick help:</p>
          <div className="quickRepliesContainer">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                className="quickReplyButton"
                onClick={() => handleQuickReply(reply.keyword)}
              >
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="inputArea">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about our e-commerce site..."
          className="inputField"
        />
        <button onClick={handleSendMessage} className="sendButton">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;