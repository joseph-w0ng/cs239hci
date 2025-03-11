export function extractDomain(url: string) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return 'unknown domain';
    }
}

export function getFavicon(isChrome: boolean) {
    if (isChrome) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];

            if (activeTab.favIconUrl) {
                return activeTab.favIconUrl;
            }
        });
    }
    return '/favicon.png';
}