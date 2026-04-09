document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const saveBtn = document.getElementById('saveBtn');

    chrome.storage.local.get(['theme'], (result) => {
        if (result && result.theme) {
            themeSelect.value = result.theme;
        }
    });

    saveBtn.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        chrome.storage.local.set({ theme: selectedTheme }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs && tabs.length > 0 ? tabs[0] : null;
                if (!activeTab || !activeTab.id) {
                    return;
                }

                const currentUrl = activeTab.url || '';
                if (!currentUrl.includes('instagram.com/direct/')) {
                    return;
                }

                chrome.tabs.sendMessage(
                    activeTab.id,
                    { action: 'changeTheme', theme: selectedTheme },
                    () => {
                        // Ignore delivery errors (e.g., page still loading content script).
                        void chrome.runtime.lastError;
                    }
                );
            });

            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = 'Apply Changes';
            }, 1200);
        });
    });
});
