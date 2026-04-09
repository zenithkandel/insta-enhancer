// Enhance Instagram Direct UI

// Current Theme State
let currentTheme = 'minimal-beige';

// Listen for theme changes from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'changeTheme') {
    applyTheme(request.theme);
  }
});

// Load the saved theme on script injection
chrome.storage.local.get(['theme'], (result) => {
  if (result.theme) {
    applyTheme(result.theme);
  } else {
    // Default fallback
    applyTheme(currentTheme);
  }
  
  initObserver();
});

// Function to handle switching visual themes dynamically via CSS variables
function applyTheme(theme) {
  currentTheme = theme;
  if(theme === 'default') {
    document.documentElement.classList.remove('enhancer-active');
    document.documentElement.classList.remove('enhancer-theme-minimal-beige', 'enhancer-theme-cyberpunk', 'enhancer-theme-dark-glass');
    return;
  }
  
  // Clean past themes
  document.documentElement.classList.remove('enhancer-theme-minimal-beige', 'enhancer-theme-cyberpunk', 'enhancer-theme-dark-glass');
  
  // Apply brand new styles
  document.documentElement.classList.add('enhancer-active');
  document.documentElement.classList.add(enhancer-theme- + theme);
  
  // Force relayout updates to fix any missed React render cycles
  enforceUI();
}

/**
 * Mutation observer to make sure dynamic UI changes are targeted.
 */
function initObserver() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = (mutationsList, observer) => {
    if(!document.documentElement.classList.contains('enhancer-active')) return;
    
    if (window.enhancerTimeout) clearTimeout(window.enhancerTimeout);
    window.enhancerTimeout = setTimeout(() => {
      enforceUI();
    }, 100);
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

/**
 * Function to reinforce specific structural behaviors or add helpful attribute flags
 */
function enforceUI() {
  // 1. Identify Main Wrapper
  const mainWrapper = document.querySelector('[role="main"]');
  if (mainWrapper && !mainWrapper.hasAttribute('data-enhanced')) {
    mainWrapper.setAttribute('data-enhanced', 'true');
  }

  // 2. Identify the chat input box container
  const inputs = document.querySelectorAll('div[role="textbox"]');
  inputs.forEach(input => {
    let parent = input.closest('div');
    while(parent) {
      if(parent.querySelector('button') && parent.querySelector('svg[aria-label="Emoji"]')) { // rough heuristic for the input bar wrapper
          parent.classList.add('enhanced-input-container');
          break;
      }
      parent = parent.parentElement;
    }
  });

  // 3. Mark Sidebar elements gracefully
  // Usually the sidebar is adjacent to the main role
  const navigations = document.querySelectorAll('div[style*="border-right"], nav[role="navigation"]');
  navigations.forEach(nav => {
    if (nav.tagName === 'DIV' || nav.tagName === 'NAV') {
        const parent = nav.closest('div[style*="width: 398px"], div:not([role="main"]):has(> div[role="listbox"])');
        if (parent) {
             parent.classList.add('enhanced-left-sidebar');
        }
    }
  });
  
  const chatListContainer = document.querySelector('div[aria-label="Chats"], div[role="listbox"]');
  if(chatListContainer) {
       chatListContainer.classList.add('enhanced-chats-list');
  }

  // 4. Mark Message Bubbles via structural analysis instead of random class
  const msgRows = document.querySelectorAll('div[role="row"]');
  msgRows.forEach(row => {
    
    // We can usually find who sent the message by finding div with "flex-end" vs "flex-start" 
    // or by looking at the inner HTML for background colors.
    const isOutgoing = row.querySelector('div[style*="justify-content: flex-end"], div[style*="flex-direction: row-reverse"]') !== null;
    const isIncoming = row.querySelector('div[style*="justify-content: flex-start"]') !== null || row.querySelector('img[alt*="profile picture"]') !== null;

    // The bubble itself usually wraps the text
    const textDirs = row.querySelectorAll('div[dir="auto"]');
    
    textDirs.forEach(textDir => {
         // The actual bubble container is usually 1 or 2 levels up that has a background color
         let bubble = textDir.parentElement;
         if (bubble.tagName === 'SPAN') { bubble = bubble.parentElement; } // Sometimes Facebook puts it inside a span

         if (bubble && !bubble.classList.contains('enhanced-bubble')) {
             bubble.classList.add('enhanced-bubble');
             // Strip inline styles so CSS can override
             bubble.style.backgroundColor = '';
             bubble.style.border = '';
             // Try to remove standard border radiuses manually
             bubble.style.borderTopLeftRadius = '';
             bubble.style.borderTopRightRadius = '';
             bubble.style.borderBottomLeftRadius = '';
             bubble.style.borderBottomRightRadius = '';
             bubble.style.borderRadius = '';
             bubble.style.padding = '';

             if (isOutgoing) {
                 bubble.classList.add('enhanced-bubble-outgoing');
             } else if (isIncoming) {
                 bubble.classList.add('enhanced-bubble-incoming');
             }
         }
    });
  });
}
