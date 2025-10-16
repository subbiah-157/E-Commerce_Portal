import React, { useState, useRef, useEffect } from 'react';
import { FaComment, FaTrash, FaTimes, FaPaperPlane, FaClock, FaCircle } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';
import '../styles/Chatbot.css';

const Chatbot = () => {
  // Load messages from sessionStorage on component mount
  const [messages, setMessages] = useState(() => {
    const savedMessages = sessionStorage.getItem('chatbotMessages');
    return savedMessages ? JSON.parse(savedMessages) : [
      { 
        text: "Hi 👋 I'm your E-Commerce Assistant. How can I help you today?", 
        sender: "bot",
        timestamp: new Date().toISOString(),
        id: Date.now()
      }
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Save messages to sessionStorage whenever messages change
  useEffect(() => {
    sessionStorage.setItem('chatbotMessages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom with smooth animation
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest" 
      });
    };

    // Small delay to ensure DOM is updated
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Clear chat history
  const clearChat = () => {
    const welcomeMessage = {
      text: "Hi 👋 I'm your E-Commerce Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date().toISOString(),
      id: Date.now() + 1
    };
    setMessages([welcomeMessage]);
  };

  // Generate unique ID for each message
  const generateMessageId = () => Date.now() + Math.random();

  // Call Gemini API
  const callGeminiAPI = async (userPrompt) => {
    try {
      const apiKey = "AIzaSyDE2ibjMlS6pyi92a59BdoW2fpLoR4PHCE";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      // String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key… + apiKey;

      const body = {
        contents: [
          ...messages.map(msg => ({
            role: msg.sender === "bot" ? "model" : "user",
            parts: [{ text: msg.text }]
          })),
          { role: "user", parts: [{ text: userPrompt }] }
        ]
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Sorry, I couldn't generate a response.";

      // Add bot response with animation delay
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== 'typing'),
          { 
            text: output, 
            sender: "bot", 
            timestamp: new Date().toISOString(),
            id: generateMessageId()
          }
        ]);
      }, 800);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== 'typing'),
        { 
          text: "⚠️ Error connecting to AI. Please try again.", 
          sender: "bot",
          timestamp: new Date().toISOString(),
          id: generateMessageId()
        }
      ]);
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = { 
      text: inputValue, 
      sender: "user", 
      timestamp: new Date().toISOString(),
      id: generateMessageId()
    };
    
    const typingMessage = { 
      text: "Typing...", 
      sender: "bot", 
      id: 'typing'
    };

    setMessages(prev => [...prev, userMessage, typingMessage]);
    setIsTyping(true);

    const prompt = inputValue;
    setInputValue('');

    // Call Gemini API with delay for better UX
    setTimeout(() => {
      callGeminiAPI(prompt);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Quick replies for better UX
  const quickReplies = [
    "Hey Assistant!",
  ];

  const handleQuickReply = (reply) => {
    setInputValue(reply);
    // Auto-send after a brief delay
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) {
    return (
      <button className="chatbotToggle" onClick={toggleChatbot}>
        <FaComment className="chatbotIcon" />
        <span className="notificationDot">
          <FaCircle />
        </span>
      </button>
    );
  }

  return (
    <div className="chatbotContainer">
      <div className="chatHeader">
        <div className="headerInfo">
          <h3 className="headerText">E-Commerce Assistant</h3>
          <span className="statusIndicator">Online</span>
        </div>
        <div className="headerControls">
          <button onClick={clearChat} className="clearButton" title="Clear chat">
            <FaTrash />
          </button>
          <button onClick={toggleChatbot} className="closeButton">
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="chatWindow">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`messageBubble ${msg.sender === "bot" ? "botMessage" : "userMessage"} ${
              msg.id === 'typing' ? 'typingMessage' : ''
            }`}
          >
            <div className="messageContent">
              {msg.text}
              {msg.id !== 'typing' && (
                <span className="messageTime">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            {msg.id === 'typing' && (
              <div className="typingIndicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} className="scrollAnchor" />
      </div>

      {messages.length <= 1 && (
        <div className="quickReplies">
          <p className="quickReplyTitle">Quick questions:</p>
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickReply(reply)}
              className="quickReplyButton"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <div className="inputArea">
        <input
          type="text"
          value={inputValue}
          placeholder="Ask about products, orders, delivery..."
          onChange={(e) => setInputValue(e.target.value)} 
          onKeyPress={handleKeyPress}
          className="inputField"
          disabled={isTyping}
        />
        <button 
          onClick={handleSendMessage} 
          className="sendButton"
          disabled={isTyping || !inputValue.trim()}
        >
          {isTyping ? <FaClock /> : <IoIosSend />}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;