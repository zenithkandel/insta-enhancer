const APP_CLASS = 'ie-active';
const THEME_ATTRIBUTE = 'data-ie-theme';
const THEME_NAME = 'retro-dark-beige';

const RETRO_THEME_VARIABLES = {
    '--accent': '#d49b62',
    '--ie-accent': '#d49b62',
    '--ie-outgoing-text-color': '#fff4df',
    '--ig-primary-background': '18, 15, 12',
    '--ig-secondary-background': '30, 25, 20',
    '--ig-elevated-background': '36, 30, 24',
    '--ig-highlight-background': '46, 38, 30',
    '--ig-primary-text': '241, 225, 196',
    '--ig-secondary-text': '191, 168, 134',
    '--ig-tertiary-text': '145, 124, 95',
    '--ig-primary-icon': '236, 218, 188',
    '--ig-secondary-icon': '168, 146, 115',
    '--ig-link': '232, 185, 117',
    '--ig-separator': '89, 75, 58',
    '--ig-stroke': '89, 75, 58',
    '--ig-menu-background-color': '27, 22, 17',
    '--ig-menu-text-color': '241, 225, 196',
    '--ig-secondary-button': '241, 225, 196',
    '--ig-secondary-button-background': '58, 47, 35',
    '--ig-secondary-button-hover': '72, 59, 45',
    '--chat-incoming-message-bubble-background-color': '#2b241d',
    '--chat-outgoing-message-bubble-background-color': '#6a4a2f',
    '--ig-incoming-message-bubble': '43, 36, 29',
    '--ig-outgoing-message-bubble': '106, 74, 47'
};

const processedBubbles = new WeakSet();
let observer = null;
let scheduled = false;
let debounceTimer = null;

bootstrap();

function bootstrap() {
    if (!location.pathname.startsWith('/direct/')) {
        return;
    }

    injectRuntimeStyles();

    chrome.runtime.onMessage.addListener((request) => {
        if (!request) {
            return;
        }

        if (request.action === 'applyRetroTheme') {
            applyRetroTheme();
        }
    });

    applyRetroTheme();
    startObserver();
}

function applyRetroTheme() {
    const root = document.documentElement;

    root.classList.remove('enhancer-active');
    Array.from(root.classList).forEach((className) => {
        if (className.startsWith('enhancer-theme-')) {
            root.classList.remove(className);
        }
    });

    root.classList.add(APP_CLASS);
    root.setAttribute(THEME_ATTRIBUTE, THEME_NAME);
    root.style.setProperty('color-scheme', 'only dark');

    Object.entries(RETRO_THEME_VARIABLES).forEach(([name, value]) => {
        root.style.setProperty(name, value);
    });

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
            // React tree changes quickly; skip transient states.
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

    const layoutRoot = main.closest('body > div');
    if (layoutRoot) {
        layoutRoot.classList.add('ie-layout-root');
    }

    tagNavigationShell();
    tagChatList();
    tagComposer(main);
    tagOverlaySurfaces();
    tagMessageBubbles(main);
    applySurfaceFallbacks();
}

function tagNavigationShell() {
    const nav = document.querySelector('nav[role="navigation"]');
    if (!nav) {
        return;
    }

    let cursor = nav;
    for (let depth = 0; depth < 7 && cursor; depth += 1) {
        cursor.classList.add('ie-nav-shell');
        cursor = cursor.parentElement;
    }
}

function tagChatList() {
    const listBox = document.querySelector('div[role="listbox"]');
    if (listBox) {
        listBox.classList.add('ie-chat-list');
        Array.from(listBox.children).forEach((row) => {
            row.classList.add('ie-chat-row');
        });
    }

    const chatItems = document.querySelectorAll('a[href*="/direct/t/"]');
    chatItems.forEach((item) => {
        item.classList.add('ie-chat-item');
        const row = findChatRowAncestor(item);
        if (row) {
            row.classList.add('ie-chat-row');
        }
    });
}

function findChatRowAncestor(node) {
    let cursor = node;
    for (let depth = 0; depth < 6 && cursor; depth += 1) {
        const rect = cursor.getBoundingClientRect();
        if (rect.height > 40 && rect.height < 130 && rect.width > 180) {
            return cursor;
        }
        cursor = cursor.parentElement;
    }
    return null;
}

function tagComposer(main) {
    const textBox =
        main.querySelector('div[role="textbox"][contenteditable="true"]') ||
        main.querySelector('div[role="textbox"]') ||
        main.querySelector('[contenteditable="true"][aria-label*="Message" i]');

    if (!textBox) {
        return;
    }

    textBox.classList.add('ie-composer-input');

    const shell = findComposerShell(textBox, main);
    if (shell) {
        shell.classList.add('ie-composer-shell');
    }

    const area = findComposerArea(shell || textBox, main);
    if (area) {
        area.classList.add('ie-composer-area');
    }
}

function findComposerShell(textBox, boundary) {
    let cursor = textBox;
    let fallback = textBox.parentElement;

    for (let depth = 0; depth < 8 && cursor && cursor !== boundary; depth += 1) {
        const rect = cursor.getBoundingClientRect();
        const looksLikeComposerSize = rect.width > 260 && rect.height < 180;
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

function findComposerArea(node, boundary) {
    let cursor = node;
    let fallback = node.parentElement;

    for (let depth = 0; depth < 6 && cursor && cursor !== boundary; depth += 1) {
        const rect = cursor.getBoundingClientRect();
        if (rect.width > 320 && rect.height < 220) {
            fallback = cursor;
        }
        if (cursor.querySelectorAll('button, [role="button"]').length >= 3) {
            return cursor;
        }
        cursor = cursor.parentElement;
    }

    return fallback;
}

function tagOverlaySurfaces() {
    document.querySelectorAll('[role="menu"], [role="dialog"]').forEach((overlay) => {
        overlay.classList.add('ie-overlay');
    });
}

function tagMessageBubbles(main) {
    const rows = Array.from(main.querySelectorAll('div[role="row"]'));
    rows.forEach((row) => {
        if (row.querySelector('div[role="textbox"]')) {
            return;
        }

        const textNodes = row.querySelectorAll('div[dir="auto"]');
        if (textNodes.length === 0) {
            return;
        }

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
                }, 360);
            }

            bubble.classList.remove('ie-bubble--in', 'ie-bubble--out', 'ie-bubble--media');
            const isMediaBubble = Boolean(bubble.querySelector('img, video, canvas'));
            if (isMediaBubble) {
                bubble.classList.add('ie-bubble--media');
            }

            const outgoing = isOutgoingRow(row, bubble);
            bubble.classList.add(outgoing ? 'ie-bubble--out' : 'ie-bubble--in');

            if (!isMediaBubble) {
                applyBubbleInlineColors(bubble, outgoing);
            }
        });
    });
}

function findBubbleElement(row, textNode) {
    const candidates = [
        textNode.closest('div[style*="border-radius"]'),
        textNode.closest('div[style*="background"]'),
        textNode.closest('div[style*="padding"]'),
        textNode.closest('div[style*="max-width"]'),
        textNode.parentElement,
        textNode.parentElement ? textNode.parentElement.parentElement : null
    ];

    for (const candidate of candidates) {
        if (isValidBubbleCandidate(row, candidate)) {
            return candidate;
        }
    }

    return null;
}

function isValidBubbleCandidate(row, candidate) {
    if (!candidate || candidate === row || !row.contains(candidate)) {
        return false;
    }

    const hasMessageContent = candidate.querySelector('div[dir="auto"], img, video, canvas, a[href]');
    if (!hasMessageContent) {
        return false;
    }

    const rowRect = row.getBoundingClientRect();
    const bubbleRect = candidate.getBoundingClientRect();
    if (!rowRect.width || !bubbleRect.width) {
        return false;
    }

    if (bubbleRect.width > rowRect.width * 0.92) {
        return false;
    }

    if (bubbleRect.height > 560 && bubbleRect.width > rowRect.width * 0.72) {
        return false;
    }

    return true;
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

function applyBubbleInlineColors(bubble, outgoing) {
    const incomingBg = asColor(RETRO_THEME_VARIABLES['--chat-incoming-message-bubble-background-color']);
    const outgoingBg = asColor(RETRO_THEME_VARIABLES['--chat-outgoing-message-bubble-background-color']);
    const incomingText = asColor(RETRO_THEME_VARIABLES['--ig-primary-text']);
    const incomingLink = asColor(RETRO_THEME_VARIABLES['--ig-link']) || incomingText;
    const outgoingText = RETRO_THEME_VARIABLES['--ie-outgoing-text-color'];
    const border = asColor(RETRO_THEME_VARIABLES['--ig-separator']);

    setPaint(bubble, {
        background: outgoing ? outgoingBg : incomingBg,
        color: outgoing ? outgoingText : incomingText,
        'border-color': border,
        'border-radius': '0px'
    });

    bubble.querySelectorAll('div[dir="auto"], span, a').forEach((node) => {
        const tagName = node.tagName ? node.tagName.toLowerCase() : '';
        const scopedColor = !outgoing && tagName === 'a' ? incomingLink : (outgoing ? outgoingText : incomingText);
        node.style.setProperty('color', scopedColor, 'important');
    });
}

function applySurfaceFallbacks() {
    const panelBg = asColor(RETRO_THEME_VARIABLES['--ig-elevated-background']);
    const menuBg = asColor(RETRO_THEME_VARIABLES['--ig-menu-background-color']);
    const separator = asColor(RETRO_THEME_VARIABLES['--ig-separator']);
    const textColor = asColor(RETRO_THEME_VARIABLES['--ig-primary-text']);
    const mutedText = asColor(RETRO_THEME_VARIABLES['--ig-secondary-text']);

    document.querySelectorAll('.ie-nav-shell, nav[role="navigation"]').forEach((navNode) => {
        setPaint(navNode, {
            'background-color': panelBg,
            'border-right': `1px solid ${separator}`,
            'border-radius': '0px'
        });
    });

    document.querySelectorAll('.ie-overlay, [role="menu"], [role="dialog"]').forEach((overlay) => {
        setPaint(overlay, {
            'background-color': menuBg,
            color: textColor,
            border: `1px solid ${separator}`,
            opacity: '1',
            'border-radius': '0px'
        });
    });

    document.querySelectorAll('.ie-composer-shell').forEach((shell) => {
        setPaint(shell, {
            'background-color': panelBg,
            border: `1px solid ${separator}`,
            color: textColor,
            'border-radius': '0px'
        });
    });

    document.querySelectorAll('time, [aria-label*="Seen" i], [aria-label*="typing" i]').forEach((node) => {
        node.style.setProperty('color', mutedText, 'important');
    });
}

function setPaint(element, styleMap) {
    if (!element || !styleMap) {
        return;
    }

    Object.entries(styleMap).forEach(([name, value]) => {
        if (value == null || value === '') {
            return;
        }
        element.style.setProperty(name, value, 'important');
    });
}

function asColor(value) {
    if (!value) {
        return '';
    }

    const raw = String(value).trim();
    if (/^(#|rgb|hsl|linear-gradient|var\()/i.test(raw)) {
        return raw;
    }

    if (/^[0-9\s.,]+$/.test(raw)) {
        return `rgb(${raw})`;
    }

    return raw;
}

function injectRuntimeStyles() {
    if (document.getElementById('ie-runtime-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'ie-runtime-style';
    style.textContent = `
html.ie-active .ie-thread-main { background: transparent !important; }
html.ie-active .ie-nav-shell,
html.ie-active .ie-chat-row,
html.ie-active .ie-chat-item,
html.ie-active .ie-composer-shell,
html.ie-active .ie-bubble,
html.ie-active .ie-overlay { border-radius: 0 !important; }
html.ie-active .ie-bubble { max-width: min(74ch, 76%); word-break: break-word; }
html.ie-active :focus-visible { outline: 2px solid var(--ie-accent) !important; outline-offset: 2px !important; }
`;

    (document.head || document.documentElement).appendChild(style);
}
