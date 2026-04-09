// Enhance Instagram Direct UI

let currentTheme = 'minimal-beige';

// Listen for theme changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'changeTheme') {
    applyTheme(request.theme);
  }
});

// Init
chrome.storage.local.get(['theme'], (result) => {
  if (result.theme) {
    applyTheme(result.theme);
  } else {
    applyTheme(currentTheme);
  }
  initObserver();
});

// Update Theme Classes reliably
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.classList.remove('enhancer-active');
  document.documentElement.classList.remove('enhancer-theme-minimal-beige', 'enhancer-theme-cyberpunk', 'enhancer-theme-dark-glass');
  
  if(theme === 'default') return;

  document.documentElement.classList.add('enhancer-active');
  document.documentElement.classList.add(enhancer-theme- + theme);
  
  // Re-run DOM overrides so active views update immediately
  enforceUI();
}

/**
 * High-performance mutation observer
 */
function initObserver() {
  const config = { childList: true, subtree: true, characterData: true };
  let enhancerTimeout;

  const observer = new MutationObserver(() => {
    if(!document.documentElement.classList.contains('enhancer-active')) return;
    if (enhancerTimeout) clearTimeout(enhancerTimeout);
    enhancerTimeout = setTimeout(enforceUI, 80);
  });
  observer.observe(document.body, config);
}

/**
 * Surgically force styling and classes onto Instagram's DOM
 */
function enforceUI() {
  // 1. Sidebar Nav Expands on hover -> Find it and make it opaque
  const navigations = document.querySelectorAll('nav[role="navigation"], div[style*="width: 398px"]');
  navigations.forEach(nav => {
    nav.classList.add('enhanced-left-sidebar');
    // Ensure all hover expansion states maintain a solid background
    const wrapper = nav.closest('div');
    if (wrapper) wrapper.classList.add('enhanced-left-sidebar');
  });

  // 2. Chat list items container
  const chatListContainer = document.querySelector('div[aria-label="Chats"], div[role="listbox"]');
  if(chatListContainer) {
       chatListContainer.classList.add('enhanced-chats-list');
  }

  // 3. Input Textbox wrapper
  const inputs = document.querySelectorAll('div[role="textbox"]');
  inputs.forEach(input => {
    let parent = input.closest('div[style*="min-height"]');
    if(!parent) parent = input.parentElement.parentElement;
    if (parent && !parent.classList.contains('enhanced-input-container')) {
        parent.classList.add('enhanced-input-container');
    }
  });

  // 4. Message Bubble Engine
  const msgRows = document.querySelectorAll('div[role="row"]');
  msgRows.forEach(row => {
    const isOutgoing = row.querySelector('div[style*="justify-content: flex-end"], div[style*="flex-direction: row-reverse"]') !== null;
    const isIncoming = row.querySelector('div[style*="justify-content: flex-start"], img[alt*="profile picture"]') !== null;
    const textDirs = row.querySelectorAll('div[dir="auto"]');
    
    textDirs.forEach(textDir => {
         let bubble = textDir.parentElement;
         if (bubble.tagName === 'SPAN') { bubble = bubble.parentElement; } 

         if (bubble && !bubble.classList.contains('enhanced-bubble')) {
             bubble.classList.add('enhanced-bubble');
             // Bruteforce wipe Instagram's dynamic inline styles so CSS takes over
             bubble.style.cssText = bubble.style.cssText.replace(/background-color[^;]+;?/g, '');
             bubble.style.cssText = bubble.style.cssText.replace(/border[^;]+;?/g, '');
             bubble.style.cssText = bubble.style.cssText.replace(/padding[^;]+;?/g, '');
             bubble.style.cssText = bubble.style.cssText.replace(/color[^;]+;?/g, '');

             if (isOutgoing) {
                 bubble.classList.add('enhanced-bubble-outgoing');
             } else if (isIncoming) {
                 bubble.classList.add('enhanced-bubble-incoming');
             }
         }
    });
  });
}
