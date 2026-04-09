const APP_CLASS = 'ie-active';
const THEME_ATTRIBUTE = 'data-ie-theme';
const VALID_THEMES = new Set(['minimal-beige', 'dark-glass', 'cyberpunk']);
const LEGACY_ROOT_CLASSES = [
    'enhancer-active',
    'enhancer-theme-minimal-beige',
    'enhancer-theme-dark-glass',
    'enhancer-theme-cyberpunk'
];

const THEME_VARIABLES = {
    'minimal-beige': {
        '--ie-outgoing-text-color': '#f7f4ef',
        '--accent': '#aa5d42',
        '--ig-primary-background': '241, 238, 232',
        '--ig-secondary-background': '233, 226, 214',
        '--ig-elevated-background': '236, 230, 221',
        '--ig-highlight-background': '241, 236, 227',
        '--ig-primary-text': '23, 23, 23',
        '--ig-secondary-text': '94, 91, 87',
        '--ig-tertiary-text': '127, 123, 119',
        '--ig-primary-icon': '22, 22, 22',
        '--ig-secondary-icon': '102, 97, 90',
        '--ig-link': '91, 73, 56',
        '--ig-separator': '198, 189, 177',
        '--ig-stroke': '198, 189, 177',
        '--ig-menu-background-color': '247, 242, 234',
        '--ig-menu-text-color': '22, 22, 22',
        '--ig-secondary-button': '30, 30, 30',
        '--ig-secondary-button-background': '227, 220, 209',
        '--ig-secondary-button-hover': '214, 206, 194',
        '--chat-incoming-message-bubble-background-color': '#e6ddd1',
        '--chat-outgoing-message-bubble-background-color': '#1f1d1b',
        '--ig-incoming-message-bubble': '230, 221, 209',
        '--ig-outgoing-message-bubble': '31, 29, 27'
    },
    'dark-glass': {
        '--ie-outgoing-text-color': '#f8fbff',
        '--accent': '#7bc2ff',
        '--ig-primary-background': '15, 20, 30',
        '--ig-secondary-background': '30, 36, 49',
        '--ig-elevated-background': '28, 34, 46',
        '--ig-highlight-background': '34, 42, 58',
        '--ig-primary-text': '245, 247, 251',
        '--ig-secondary-text': '166, 176, 193',
        '--ig-tertiary-text': '128, 139, 160',
        '--ig-primary-icon': '245, 247, 251',
        '--ig-secondary-icon': '168, 178, 196',
        '--ig-link': '138, 185, 255',
        '--ig-separator': '72, 82, 102',
        '--ig-stroke': '73, 85, 107',
        '--ig-menu-background-color': '26, 31, 43',
        '--ig-menu-text-color': '242, 246, 251',
        '--ig-secondary-button': '242, 246, 251',
        '--ig-secondary-button-background': '52, 62, 82',
        '--ig-secondary-button-hover': '62, 74, 98',
        '--chat-incoming-message-bubble-background-color': '#344058',
        '--chat-outgoing-message-bubble-background-color': '#2f6ef0',
        '--ig-incoming-message-bubble': '52, 64, 88',
        '--ig-outgoing-message-bubble': '47, 110, 240'
    },
    cyberpunk: {
        '--ie-outgoing-text-color': '#f7f8ff',
        '--accent': '#ff4fd8',
        '--ig-primary-background': '9, 12, 20',
        '--ig-secondary-background': '16, 24, 37',
        '--ig-elevated-background': '13, 19, 32',
        '--ig-highlight-background': '21, 31, 49',
        '--ig-primary-text': '185, 255, 232',
        '--ig-secondary-text': '100, 209, 182',
        '--ig-tertiary-text': '72, 162, 143',
        '--ig-primary-icon': '185, 255, 232',
        '--ig-secondary-icon': '96, 200, 175',
        '--ig-link': '142, 245, 255',
        '--ig-separator': '45, 163, 147',
        '--ig-stroke': '45, 163, 147',
        '--ig-menu-background-color': '11, 17, 29',
        '--ig-menu-text-color': '194, 255, 237',
        '--ig-secondary-button': '194, 255, 237',
        '--ig-secondary-button-background': '26, 44, 63',
        '--ig-secondary-button-hover': '35, 60, 85',
        '--chat-incoming-message-bubble-background-color': '#102334',
        '--chat-outgoing-message-bubble-background-color': 'linear-gradient(135deg, #f6009b 0%, #a400ff 100%)',
        '--ig-incoming-message-bubble': '16, 35, 52',
        '--ig-outgoing-message-bubble': '172, 0, 255'
    }
};

const THEME_VARIABLE_NAMES = Array.from(
    new Set(Object.values(THEME_VARIABLES).flatMap((themeMap) => Object.keys(themeMap)))
);

const processedBubbles = new WeakSet();
let observer = null;
let scheduled = false;
let debounceTimer = null;
let currentTheme = 'minimal-beige';

bootstrap();

function bootstrap() {
    if (!location.pathname.startsWith('/direct/')) {
        return;
    }

    injectRuntimeStyles();

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
        currentTheme = 'minimal-beige';
        clearThemeVariables();
        root.classList.remove(APP_CLASS);
        root.removeAttribute(THEME_ATTRIBUTE);
        return;
    }

    currentTheme = normalizedTheme;
    root.classList.add(APP_CLASS);
    root.setAttribute(THEME_ATTRIBUTE, normalizedTheme);
    applyThemeVariables(normalizedTheme);
    scheduleEnhance();
}

function applyThemeVariables(themeName) {
    const root = document.documentElement;
    const themeMap = THEME_VARIABLES[themeName] || THEME_VARIABLES['minimal-beige'];

    clearThemeVariables();
    Object.entries(themeMap).forEach(([name, value]) => {
        root.style.setProperty(name, value);
    });

    root.style.setProperty('color-scheme', themeName === 'minimal-beige' ? 'light' : 'dark');
}

function clearThemeVariables() {
    const root = document.documentElement;
    THEME_VARIABLE_NAMES.forEach((varName) => {
        root.style.removeProperty(varName);
    });
    root.style.removeProperty('color-scheme');
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
    for (let depth = 0; depth < 6 && cursor; depth += 1) {
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
    for (let depth = 0; depth < 5 && cursor; depth += 1) {
        const rect = cursor.getBoundingClientRect();
        if (rect.height > 40 && rect.height < 120 && rect.width > 180) {
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
                }, 420);
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
    const themeMap = THEME_VARIABLES[currentTheme] || THEME_VARIABLES['minimal-beige'];
    const incomingBg = asColor(themeMap['--chat-incoming-message-bubble-background-color']);
    const outgoingBg = asColor(themeMap['--chat-outgoing-message-bubble-background-color']);
    const incomingText = asColor(themeMap['--ig-primary-text']);
    const outgoingText = themeMap['--ie-outgoing-text-color'] || '#ffffff';
    const border = asColor(themeMap['--ig-separator']);

    setPaint(bubble, {
        background: outgoing ? outgoingBg : incomingBg,
        color: outgoing ? outgoingText : incomingText,
        'border-color': border
    });

    bubble.querySelectorAll('div[dir="auto"], span, a').forEach((node) => {
        node.style.setProperty('color', outgoing ? outgoingText : incomingText, 'important');
    });
}

function applySurfaceFallbacks() {
    const themeMap = THEME_VARIABLES[currentTheme] || THEME_VARIABLES['minimal-beige'];
    const panelBg = asColor(themeMap['--ig-elevated-background']);
    const menuBg = asColor(themeMap['--ig-menu-background-color']);
    const separator = asColor(themeMap['--ig-separator']);
    const textColor = asColor(themeMap['--ig-primary-text']);
    const mutedText = asColor(themeMap['--ig-secondary-text']);

    document.querySelectorAll('.ie-nav-shell, nav[role="navigation"]').forEach((navNode) => {
        setPaint(navNode, {
            'background-color': panelBg,
            'border-right': `1px solid ${separator}`
        });
    });

    document.querySelectorAll('.ie-overlay, [role="menu"], [role="dialog"]').forEach((overlay) => {
        setPaint(overlay, {
            'background-color': menuBg,
            color: textColor,
            border: `1px solid ${separator}`,
            opacity: '1'
        });
    });

    document.querySelectorAll('.ie-composer-shell').forEach((shell) => {
        setPaint(shell, {
            'background-color': panelBg,
            border: `1px solid ${separator}`,
            color: textColor
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
html.ie-active .ie-nav-shell { transition: background-color 180ms ease, box-shadow 180ms ease; }
html.ie-active .ie-overlay { backdrop-filter: none !important; }
html.ie-active .ie-bubble { max-width: min(74ch, 76%); word-break: break-word; }
html.ie-active .ie-chat-item, html.ie-active .ie-chat-row { transition: transform 180ms ease, box-shadow 180ms ease; }
`;

    (document.head || document.documentElement).appendChild(style);
}
