document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const saveBtn = document.getElementById('saveBtn');

    // Load saved theme
    chrome.storage.local.get(['theme'], (result) => {
        if (result.theme) {
            themeSelect.value = result.theme;
        }
    });

    saveBtn.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        chrome.storage.local.set({ theme: selectedTheme }, () => {
            // Send message to active tab to update theme dynamically
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0].url.includes('instagram.com/direct')) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'changeTheme', theme: selectedTheme });
                }
            });
            saveBtn.innerText = "Saved!";
            setTimeout(() => { saveBtn.innerText = "Apply Changes"; }, 2000);
        });
    });
});
