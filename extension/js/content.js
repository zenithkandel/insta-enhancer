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

    // Initiate mutation observer since React relies heavily on dynamic rendering
    initObserver();
});

// Function to handle switching visual themes dynamically via CSS variables
function applyTheme(theme) {
    currentTheme = theme;
    if (theme === 'default') {
        document.documentElement.classList.remove('enhancer-active');
        document.documentElement.classList.remove('enhancer-theme-minimal-beige', 'enhancer-theme-cyberpunk', 'enhancer-theme-dark-glass');
        return;
    }

    // Clean past themes
    document.documentElement.classList.remove('enhancer-theme-minimal-beige', 'enhancer-theme-cyberpunk', 'enhancer-theme-dark-glass');

    // Apply brand new styles
    document.documentElement.classList.add('enhancer-active');
    document.documentElement.classList.add(`enhancer-theme-${theme}`);

    // Force relayout updates to fix any missed React render cycles
    enforceUI();
}

/**
 * Mutation observer to make sure dynamic UI changes are targeted.
 * Some elements in Instagram's messaging have hardcoded inline styles.
 */
function initObserver() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const callback = (mutationsList, observer) => {
        if (!document.documentElement.classList.contains('enhancer-active')) return;

        // Slight throttle for performance
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
 * since IG obfuscates classes continually (e.g., .x1qjc9v5 or .x9f619).
 */
function enforceUI() {
    // 1. Identify Main Wrapper
    const mainWrapper = document.querySelector('[role="main"]');
    if (mainWrapper && !mainWrapper.hasAttribute('data-enhanced')) {
        mainWrapper.setAttribute('data-enhanced', 'true');
        // Ensure parent heights are 100% viewport to match desktop layouts
        mainWrapper.style.height = "100vh";
    }

    // 2. Identify Chat input box directly 
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => {
        if (!ta.classList.contains('enhanced-textarea')) {
            ta.classList.add('enhanced-textarea');
            // Strip random inline styles if necessary to let our CSS take over
            ta.style.backgroundColor = '';
            ta.style.color = '';
        }
    });

    // 3. Mark Sidebar elements gracefully
    const navigations = document.querySelectorAll('[role="navigation"], [role="banner"]');
    navigations.forEach(nav => {
        nav.classList.add('enhanced-sidebar');
    });

    // 4. Mark Message Bubbles via structural analysis instead of random class
    // IG messages are usually inside lists or grouped by 'flex' with explicit aligns
    const messageRows = document.querySelectorAll('[style*="align-items: flex-start"], [style*="align-items: flex-end"]');
    messageRows.forEach(row => {
        if (row.children.length > 0) {
            row.children[0].classList.add('enhanced-bubble');
        }
    });
}
