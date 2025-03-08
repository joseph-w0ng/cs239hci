function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'unknown domain';
  }
}

let activeDomain = '';

chrome.cookies.onChanged.addListener(changeInfo => {
    // Get the active tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const url = activeTab ? activeTab.url : null;
      activeDomain = extractDomain(url);

      chrome.cookies.getAll({ url }, (cookies) => {
        let size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size }); // Update badge
      });
    });

  if (!changeInfo.removed) {
    console.log("Cookies changed: current domain - ", activeDomain);
    let blockedCookies = null;
    chrome.storage.local.get(["siteData"], function(result) {
      blockedCookies = result.siteData;
      if (blockedCookies) {
        const foundObject = blockedCookies[activeDomain].find(item => changeInfo.cookie.domain == item.domain && changeInfo.cookie.name == item.name);
        console.log("Found object: ", foundObject);
        if (foundObject) {
          chrome.cookies.remove({
            url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
            name: changeInfo.cookie.name
          }, () => {
            console.log(`Blocked and removed cookie: ${changeInfo.cookie.name}`);
          });
        }
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      const url = tab.url;
      console.log("Active Tab URL:", url);

      // Fetch cookies for the active domain
      chrome.cookies.getAll({ url }, (cookies) => {
        let size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size }); // Update badge
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) {
      const url = tab.url;

      // Fetch cookies for the active domain
      chrome.cookies.getAll({ url  }, (cookies) => {
        let size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size }); // Update badge
      });
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  // Set the badge text to "0" when the extension is installed or initialized
  chrome.action.setBadgeText({ text: '0' });
  chrome.storage.local.get(["siteData"], function(result) {
    if (!Object.hasOwn(result, "siteData")) {
        console.log("Site data doesn't exist, initializing now...");
        chrome.storage.local.set({ siteData: {} })
    }
  });
});
