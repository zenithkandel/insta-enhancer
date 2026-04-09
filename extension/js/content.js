const APP_CLASS = 'ie-active';
const THEME_ATTRIBUTE = 'data-ie-theme';
const VALID_THEMES = new Set(['minimal-beige', 'dark-glass', 'cyberpunk']);
const LEGACY_ROOT_CLASSES = [
    'enhancer-active',
    'enhancer-theme-minimal-beige',
    'enhancer-theme-dark-glass',
    'enhancer-theme-cyberpunk'
];

const processedBubbles = new WeakSet();
let observer = null;
let scheduled = false;
let debounceTimer = null;

bootstrap();

function bootstrap() {
    if (!location.pathname.startsWith('/direct/')) {
        return;
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request && request.action === 'changeTheme') {
            applyTheme(request.theme);
        }
    });

    chrome.storage.local.get(['theme'], (result) => {
        const selectedTheme = result && result.theme ? result.theme : 'minimal-beige';
        applyTheme(selectedTheme);
        startObserver();
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    const normalizedTheme = VALID_THEMES.has(theme) ? theme : 'minimal-beige';

    LEGACY_ROOT_CLASSES.forEach((className) => root.classList.remove(className));

    if (theme === 'default') {
        root.classList.remove(APP_CLASS);
        root.removeAttribute(THEME_ATTRIBUTE);
        return;
    }

    root.classList.add(APP_CLASS);
    root.setAttribute(THEME_ATTRIBUTE, normalizedTheme);
    scheduleEnhance();
}

function startObserver() {
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(() => {
        if (!document.documentElement.classList.contains(APP_CLASS)) {
            return;
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            scheduleEnhance();
        }, 70);
    });

    observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'aria-label', 'role']
    });

    scheduleEnhance();
}

function scheduleEnhance() {
    if (scheduled) {
        return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
        scheduled = false;
        try {
            enforceUI();
        } catch (_error) {
            // Ignore transient render phases while React updates the tree.
        }
    });
}

function enforceUI() {
    const root = document.documentElement;
    if (!root.classList.contains(APP_CLASS)) {
        return;
    }

    const main = document.querySelector('main[role="main"], div[role="main"]');
    if (!main) {
        return;
    }

    main.classList.add('ie-thread-main');

    const header = main.querySelector(':scope > div:first-child');
    if (header) {
        header.classList.add('ie-thread-header');
    }

    tagNavigationShell();
    tagChatList();
    tagComposer(main);
    tagMessageBubbles(main);
}

function tagNavigationShell() {
    const nav = document.querySelector('nav[role="navigation"]');
    if (!nav) {
        return;
    }

    let cursor = nav;
    for (let depth = 0; depth < 4 && cursor; depth += 1) {
        cursor.classList.add('ie-nav-shell');
        cursor = cursor.parentElement;
    }
}

function tagChatList() {
    const listBox = document.querySelector('div[role="listbox"]');
    if (!listBox) {
        return;
    }

    listBox.classList.add('ie-chat-list');

    const chatItems = listBox.querySelectorAll('a[href*="/direct/t/"]');
    chatItems.forEach((item) => {
        item.classList.add('ie-chat-item');
    });

    Array.from(listBox.children).forEach((row) => {
        row.classList.add('ie-chat-row');
    });
}

function tagComposer(main) {
    const textBox = main.querySelector(
        'div[role="textbox"][contenteditable="true"], div[role="textbox"]'
    );

    if (!textBox) {
        return;
    }

    textBox.classList.add('ie-composer-input');

    const shell = findComposerShell(textBox, main);
    if (shell) {
        shell.classList.add('ie-composer-shell');
    }
}

function findComposerShell(textBox, boundary) {
    let cursor = textBox;
    let fallback = textBox.parentElement;

    for (let depth = 0; depth < 7 && cursor && cursor !== boundary; depth += 1) {
        const rect = cursor.getBoundingClientRect();
        const looksLikeComposerSize = rect.width > 260 && rect.height < 160;
        const buttonCount = cursor.querySelectorAll('button, [role="button"]').length;

        if (looksLikeComposerSize) {
            fallback = cursor;
        }

        if (looksLikeComposerSize && buttonCount >= 2) {
            return cursor;
        }

        cursor = cursor.parentElement;
    }

    return fallback;
}

function tagMessageBubbles(main) {
    const rows = main.querySelectorAll('div[role="row"]');
    rows.forEach((row) => {
        if (row.querySelector('div[role="textbox"]')) {
            return;
        }

        const textNodes = row.querySelectorAll('div[dir="auto"]');
        textNodes.forEach((textNode) => {
            if (textNode.closest('div[role="textbox"]')) {
                return;
            }

            const bubble = findBubbleElement(row, textNode);
            if (!bubble) {
                return;
            }

            if (!processedBubbles.has(bubble)) {
                bubble.classList.add('ie-bubble', 'ie-bubble-enter');
                processedBubbles.add(bubble);

                setTimeout(() => {
                    bubble.classList.remove('ie-bubble-enter');
                }, 500);
            }

            bubble.classList.remove('ie-bubble--in', 'ie-bubble--out', 'ie-bubble--media');

            if (bubble.querySelector('img, video')) {
                bubble.classList.add('ie-bubble--media');
            }

            if (isOutgoingRow(row, bubble)) {
                bubble.classList.add('ie-bubble--out');
            } else {
                bubble.classList.add('ie-bubble--in');
            }
        });
    });
}

function findBubbleElement(row, textNode) {
    const styleBased = textNode.closest(
        'div[style*="background"], div[style*="border-radius"], div[style*="max-width"], div[style*="padding"]'
    );

    const candidate = styleBased && row.contains(styleBased) ? styleBased : textNode.parentElement;
    if (!candidate || candidate === row) {
        return null;
    }

    const rowRect = row.getBoundingClientRect();
    const bubbleRect = candidate.getBoundingClientRect();
    if (!rowRect.width || !bubbleRect.width) {
        return null;
    }

    const tooWide = bubbleRect.width > rowRect.width * 0.92;
    const suspiciousHugeCard =
        bubbleRect.height > 520 && bubbleRect.width > rowRect.width * 0.72;

    if (tooWide || suspiciousHugeCard) {
        return null;
    }

    return candidate;
}

function isOutgoingRow(row, bubble) {
    const rowStyle = row.getAttribute('style') || '';
    if (/flex-end|row-reverse/i.test(rowStyle)) {
        return true;
    }

    if (row.querySelector('[style*="flex-end"], [style*="row-reverse"]')) {
        return true;
    }

    if (row.querySelector('img[alt*="profile picture" i], img[alt*="profile photo" i]')) {
        return false;
    }

    const rowRect = row.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    return bubbleRect.left + bubbleRect.width * 0.5 > rowRect.left + rowRect.width * 0.5;
}
