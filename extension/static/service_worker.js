let blocked_cookies = {};

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'unknown domain';
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "blockCookies") {
        console.log("Received cookies to block from Svelte app:", message.cookieToBlock);

        // Process the cookie (e.g., block specific ones)
        if (!blocked_cookies[message.cookieToBlock.name]) {
            blocked_cookies[message.cookieToBlock.name] = new Set();   
        }
        blocked_cookies[message.cookieToBlock.name].add(message.cookieToBlock.domain);

        console.log("Updated blocked cookies: ", blocked_cookies);
    }
});

chrome.cookies.onChanged.addListener(changeInfo => {
    // Get the active tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const url = activeTab ? activeTab.url : null;
      
      // Now you have the URL of the active tab
      console.log("Active tab URL:", url);
  
      // Your code logic for the cookies change event
      console.log(changeInfo);

      chrome.cookies.getAll({ url }, (cookies) => {
        console.log("Cookies retrieved:", cookies);
        cookies.forEach((cookie) => {
          console.log(`Cookie: ${cookie.name}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite}`);
        });
        
        let size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size }); // Update badge
      });
    });

  if (!changeInfo.removed && blocked_cookies[changeInfo.cookie.name] && blocked_cookies[changeInfo.cookie.name].has(changeInfo.cookie.domain)) {
    chrome.cookies.remove({
      url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
      name: changeInfo.cookie.name
    }, () => {
      console.log(`Blocked and removed cookie: ${changeInfo.cookie.name}`);
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
        console.log("Cookies retrieved:", cookies);
        cookies.forEach((cookie) => {
          console.log(`Cookie: ${cookie.name}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite}`);
        });
        
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
      let domain = url.hostname; // Extract domain from URL

      console.log("Active Tab Domain:", domain);

      // Fetch cookies for the active domain
      chrome.cookies.getAll({ url  }, (cookies) => {
        console.log("Cookies retrieved:", cookies);
        cookies.forEach((cookie) => {
          console.log(`Cookie: ${cookie.name}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite}`);
        });
        
        let size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size }); // Update badge
      });
    }
  });
});

