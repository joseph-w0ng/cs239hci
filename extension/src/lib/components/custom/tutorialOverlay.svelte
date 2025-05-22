<!-- TutorialOverlay.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  const isBrowser = typeof window !== 'undefined';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  export let isOpen = false;
  
  interface TutorialStep {
    id: string;
    title: string;
    description: string;
    element: string;
    position: 'top' | 'right' | 'bottom' | 'left';
  }

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'header',
      title: 'Cookie Monster',
      description: 'This extension helps you manage and control cookies on websites.',
      element: 'header h1',
      position: 'bottom'
    },
    {
      id: 'breakdown',
      title: 'Cookie Breakdown',
      description: 'See all cookies categorized by their purpose and privacy impact.',
      element: '.breakdown-chart',
      position: 'right'
    },
    {
      id: 'bulk-actions',
      title: 'Bulk Actions',
      description: 'Quickly manage multiple cookies by category.',
      element: '.bulk-actions-bar',
      position: 'bottom'
    },
    {
      id: 'cookie-list',
      title: 'Cookie List',
      description: 'View and manage individual cookies. Click on a cookie to see more details.',
      element: '.cookie-list',
      position: 'top'
    },
    {
      id: 'refresh',
      title: 'Refresh Button',
      description: 'Reload to see the latest cookies on this page.',
      element: '.refresh-button',
      position: 'left'
    },
    {
      id: 'preferences',
      title: 'Cookie Preferences',
      description: 'Set your cookie blocking preferences for functional, analytics, and marketing cookies.',
      element: '.preferences-button',
      position: 'bottom'
    },
  ];

  let currentStep = 0;
  
  function nextStep() {
    if (currentStep < tutorialSteps.length - 1) {
      currentStep++;
      if (isBrowser) {
        setTimeout(highlightCurrentElement, 10);
      }
    } else {
      closeTutorial();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      if (isBrowser) {
        setTimeout(highlightCurrentElement, 10);
      }
    }
  }

  function closeTutorial() {
    if (isBrowser) {
      cleanupHighlights();
    }
    dispatch('close');
  }
  
  function cleanupHighlights() {
    if (!isBrowser) return;
    
    const existingHighlights = document.querySelectorAll('.tutorial-highlight');
    existingHighlights.forEach(el => {
      const scrollListener = (el as any)._scrollListener;
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener, true);
        window.removeEventListener('resize', scrollListener);
      }
      el.remove();
    });
  }
  
  function highlightCurrentElement() {
    if (!isBrowser) return;
    
    cleanupHighlights();
    
    if (!isOpen) return;
    
    const step = tutorialSteps[currentStep];
    const targetElement = document.querySelector(step.element);
    
    if (!targetElement) {
      console.error('Target element not found:', step.element);
      return;
    }
    
    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    document.body.appendChild(highlight);
    
    function updateHighlightPosition() {
      if (!targetElement || !highlight.parentNode) return;
      
      const rect = targetElement.getBoundingClientRect();
      highlight.style.position = 'fixed';
      highlight.style.top = `${rect.top - 4}px`;
      highlight.style.left = `${rect.left - 4}px`;
      highlight.style.width = `${rect.width + 8}px`;
      highlight.style.height = `${rect.height + 8}px`;
      highlight.style.border = '2px solid rgba(59, 130, 246, 0.8)';
      highlight.style.borderRadius = '4px';
      highlight.style.pointerEvents = 'none';
      highlight.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
      highlight.style.zIndex = '49';
      
      updatePopupPosition(rect);
    }
    
    updateHighlightPosition();
    
    const scrollListener = () => updateHighlightPosition();
    window.addEventListener('scroll', scrollListener, true); // Use capture phase to catch all scroll events
    window.addEventListener('resize', scrollListener);
    
    highlight.dataset.scrollListener = 'attached';
    (highlight as any)._scrollListener = scrollListener;
  }
  
  function updatePopupPosition(rect: DOMRect) {
    const popup = document.querySelector('.tutorial-popup') as HTMLElement;
    if (!popup) return;
    
    const step = tutorialSteps[currentStep];
    let popupLeft, popupTop;
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    
    switch (step.position) {
      case 'top':
        popupLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
        popupTop = rect.top - popupHeight - 16;
        break;
      case 'right':
        popupLeft = rect.right + 16;
        popupTop = rect.top + (rect.height / 2) - (popupHeight / 2);
        break;
      case 'bottom':
        popupLeft = rect.left + (rect.width / 2) - (popupWidth / 2);
        popupTop = rect.bottom + 16;
        break;
      case 'left':
        popupLeft = rect.left - popupWidth - 16;
        popupTop = rect.top + (rect.height / 2) - (popupHeight / 2);
        break;
    }
    
    // Keep popup within viewport
    popupLeft = Math.max(16, Math.min(popupLeft, window.innerWidth - popupWidth - 16));
    popupTop = Math.max(16, Math.min(popupTop, window.innerHeight - popupHeight - 16));
    
    popup.style.left = `${popupLeft}px`;
    popup.style.top = `${popupTop}px`;
  }
  
  onMount(() => {
    if (isOpen && isBrowser) {
      setTimeout(highlightCurrentElement, 100);
    }
    
    return () => {
      if (isBrowser) {
        cleanupHighlights();
      }
    };
  });
  
  $: {
    if (isOpen && isBrowser) {
      setTimeout(highlightCurrentElement, 100);
    } else if (isBrowser) {
      cleanupHighlights();
    }
  }
  
  $: currentTutorialStep = tutorialSteps[currentStep];
  $: isLastStep = currentStep === tutorialSteps.length - 1;

  function handleCloseClick() {
    closeTutorial();
  }

  function handleNextClick() {
    nextStep();
  }

  function handlePrevClick() {
    prevStep();
  }
</script>

<!-- Tutorial overlay -->
{#if isOpen && currentTutorialStep}
  <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div class="tutorial-popup bg-white rounded-lg p-4 shadow-lg max-w-xs absolute pointer-events-auto">
      <button 
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        on:click={handleCloseClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <h3 class="text-lg font-bold mb-2">{currentTutorialStep.title}</h3>
      <p class="text-sm mb-4">{currentTutorialStep.description}</p>
      
      <div class="flex justify-between">
        {#if currentStep > 0}
          <button class="px-3 py-1 bg-gray-100 rounded text-sm" on:click={handlePrevClick}>Previous</button>
        {:else}
          <div></div>
        {/if}
        
        <button class="px-3 py-1 bg-blue-500 text-white rounded text-sm" on:click={handleNextClick}>
          {isLastStep ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .tutorial-popup {
    z-index: 51;
    transition: all 0.2s ease;
  }
</style>