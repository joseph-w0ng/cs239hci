let isLoading = false;

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'unknown domain';
  }
}

async function getResourceUrls(tabId) {
  function getPerformanceEntries() {
    return performance.getEntriesByType('resource').map((r) => r.name);
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: getPerformanceEntries
    });

    return results[0].result;
  } catch (error) {
    console.error('Error getting performance entries:', error);
    return [];
  }
}

// Function to get all cookies from all resources
async function getAllResourceCookies(tabId) {

  try {
    const resourceUrls = await getResourceUrls(tabId);

    const origins = resourceUrls
      ?.map((url) => {
        try {
          return new URL(url).origin;
        } catch (e) {
          return null;
        }
      })
      .filter((url) => Boolean(url) && url !== 'null');

    const uniqueOrigins = new Set(origins);

    if (activeDomain) {
      uniqueOrigins.add(`http://${activeDomain}`);
      uniqueOrigins.add(`https://${activeDomain}`);
    }

    const getCookiesPromises = [];

    for (const url of uniqueOrigins) {
      if (url) {
        const promise = chrome.cookies.getAll({ url }).then((cookies) => ({
          url,
          cookies
        }));

        getCookiesPromises.push(promise);
      }
    }

    const urlCookies = await Promise.all(getCookiesPromises);

    const filtered = urlCookies.filter((c) => c.cookies.length);

    const allCookies = [];
    const cookieNames = new Set();

    for (const { cookies: originCookies } of filtered) {
      for (const cookie of originCookies) {
        const cookieKey = `${cookie.domain}|${cookie.name}|${cookie.path}`;
        if (!cookieNames.has(cookieKey)) {
          cookieNames.add(cookieKey);
          allCookies.push(cookie);
        }
      }
    }

    let size = allCookies.length.toString();
    chrome.action.setBadgeText({ text: size });

    console.log('Found cookies from all resources:', allCookies.length);

    isLoading = false;
  } catch (error) {
    console.error('Error getting all resource cookies:', error);
    isLoading = false;
  }
}

let activeDomain = '';

chrome.cookies.onChanged.addListener(changeInfo => {
    // Get the active tab's URL
    isLoading = true;
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs.length) return;
      const tab = tabs[0];
      const url = tab.url;
      if (!url) return;

      activeDomain = extractDomain(url);
      await getAllResourceCookies(tab.id || 0);
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
