// tutorial.js - Improved positioning
function positionTutorialElements() {
    console.log('Positioning tutorial elements');
    const tutorialPopup = document.querySelector('.tutorial-popup');
    const tutorialSpotlight = document.querySelector('.tutorial-spotlight');
    
    if (!tutorialPopup || !tutorialSpotlight) {
      console.log('Tutorial elements not found');
      return;
    }
    
    const targetSelector = tutorialPopup.getAttribute('data-target');
    const position = tutorialPopup.getAttribute('data-position');
    
    console.log('Targeting:', targetSelector, 'Position:', position);
    
    const targetElement = document.querySelector(targetSelector);
    
    if (!targetElement) {
      console.log('Target element not found:', targetSelector);
      return;
    }
    
    // Position the spotlight
    const rect = targetElement.getBoundingClientRect();
    console.log('Target element rect:', rect);
    
    tutorialSpotlight.style.top = `${rect.top}px`;
    tutorialSpotlight.style.left = `${rect.left}px`;
    tutorialSpotlight.style.width = `${rect.width}px`;
    tutorialSpotlight.style.height = `${rect.height}px`;
    
    // Position the popup
    let popupLeft, popupTop;
    
    // Calculate popup dimensions
    const popupWidth = tutorialPopup.offsetWidth;
    const popupHeight = tutorialPopup.offsetHeight;
    
    console.log('Popup dimensions:', popupWidth, popupHeight);
    
    switch (position) {
      case 'top':
        popupLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
        popupTop = rect.top - popupHeight - 10;
        break;
      case 'right':
        popupLeft = rect.right + 10;
        popupTop = rect.top + (rect.height / 2) - (popupHeight / 2);
        break;
      case 'bottom':
        popupLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
        popupTop = rect.bottom + 10;
        break;
      case 'left':
        popupLeft = rect.left - popupWidth - 10;
        popupTop = rect.top + (rect.height / 2) - (popupHeight / 2);
        break;
      default:
        // Center in viewport as fallback
        popupLeft = (window.innerWidth / 2) - (popupWidth / 2);
        popupTop = (window.innerHeight / 2) - (popupHeight / 2);
    }
    
    // Keep popup within viewport
    popupLeft = Math.max(10, Math.min(popupLeft, window.innerWidth - popupWidth - 10));
    popupTop = Math.max(10, Math.min(popupTop, window.innerHeight - popupHeight - 10));
    
    console.log('Positioning popup at:', popupLeft, popupTop);
    
    tutorialPopup.style.left = `${popupLeft}px`;
    tutorialPopup.style.top = `${popupTop}px`;
    
    // Add a visible outline to the spotlight for better visibility
    tutorialSpotlight.style.border = '2px solid rgba(59, 130, 246, 0.5)';
    tutorialSpotlight.style.borderRadius = '4px';
  }
  
  // Run positioning when tutorial steps change
  function setupTutorialPositioning() {
    console.log('Setting up tutorial positioning');
    
    // Initial positioning
    positionTutorialElements();
    
    // Watch for attribute changes on the tutorial popup
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-target' || mutation.attributeName === 'data-position')) {
          console.log('Tutorial attributes changed, repositioning');
          positionTutorialElements();
          break;
        }
      }
    });
    
    const tutorialPopup = document.querySelector('.tutorial-popup');
    if (tutorialPopup) {
      observer.observe(tutorialPopup, { attributes: true });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      console.log('Window resized, repositioning tutorial');
      positionTutorialElements();
    });
    
    // Also position elements when steps change
    document.addEventListener('tutorialStepChanged', () => {
      console.log('Tutorial step changed, repositioning');
      setTimeout(positionTutorialElements, 50); // Small delay to ensure DOM has updated
    });
  }
  
  // Set up when the tutorial is started
  document.addEventListener('tutorialStarted', () => {
    console.log('Tutorial started event received');
    // Wait a moment for the tutorial elements to be fully rendered
    setTimeout(setupTutorialPositioning, 100);
  });
  
  // Initial setup when the script loads
  console.log('Tutorial script loaded');
  setTimeout(() => {
    const tutorialPopup = document.querySelector('.tutorial-popup');
    if (tutorialPopup) {
      console.log('Tutorial popup found on load, setting up positioning');
      setupTutorialPositioning();
    }
  }, 500);