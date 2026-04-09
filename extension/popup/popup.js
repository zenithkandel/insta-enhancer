document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('applyBtn');
    const status = document.getElementById('status');

    if (!applyBtn || !status) {
        return;
    }

    applyBtn.addEventListener('click', () => {
        status.textContent = '';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs && tabs.length > 0 ? tabs[0] : null;
            if (!activeTab || !activeTab.id) {
                status.textContent = 'No active tab found.';
                return;
            }

            const currentUrl = activeTab.url || '';
            if (!currentUrl.includes('instagram.com/direct/')) {
                status.textContent = 'Open Instagram Direct, then try again.';
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: 'applyRetroTheme' }, () => {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Tab is still loading. Retry in a second.';
                    return;
                }

                status.textContent = 'Retro dark theme applied.';
            });
        });
    });
});
