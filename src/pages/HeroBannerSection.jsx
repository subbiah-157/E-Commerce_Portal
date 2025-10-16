import React, { useState, useEffect } from "react"; 
import { FaShoppingCart, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../styles/HeroBannerSection.css";

const HeroBannerSection = ({ onShopNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [ 
    {
      id: 1,
      title: "Smart Shopping Experience",
      subtitle: "Trusted by Millions of Happy Customers",
      description: "Discover the best products at unbeatable prices. Enjoy seamless shopping with fast delivery, easy returns, and 24/7 customer support.",
      image: "/image1.png",
      buttonText: "Shop Now"
    },
    {
      id: 2,
      title: "Innovative Tech Gadgets",
      subtitle: "Latest in Technology",
      description: "Check out cutting-edge devices that make your life easier. From smart home gadgets to wearable tech, find it all here.",
      image: "/image2.png",
      buttonText: "Explore Gadgets"
    },
    {
      id: 3,
      title: "Exclusive Deals",
      subtitle: "Best Offers Just For You",
      description: "Get amazing discounts on top-rated products. Shop now and enjoy limited-time offers across all categories.",
      image: "/image3.png",
      buttonText: "Shop Deals"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <section className="heroBannerSection">
      <div className="sliderContainer">
        {/* Slides */}
        <div 
          className="slidesWrapper"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="slide"
              style={{ 
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundAttachment:"fixed",
                backgroundRepeat:"no-repeat",
                backgroundPosition:"center"
              }}
            >
              <div className="slideOverlay"></div>
              <div className="slideContent">
                <div className="textContent">
                  <h1 className="slideTitle">{slide.title}</h1>
                  <p className="slideSubtitle">{slide.subtitle}</p>
                  <p className="slideDescription">{slide.description}</p>
                  <button 
                    className="shopNowBtn" 
                    onClick={onShopNow}
                  >
                    <FaShoppingCart className="btnIcon" />
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="bottomNavigation">
          <button className="navArrow prevArrow" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="navArrow nextArrow" onClick={nextSlide}>
            <FaChevronRight />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="dotsContainer">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBannerSection;
