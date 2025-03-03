let blocked_cookies = {};

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

  if (!changeInfo.removed && blocked_cookies[changeInfo.cookie.name] && blocked_cookies[changeInfo.cookie.name].has(changeInfo.cookie.domain)) {
    chrome.cookies.remove({
      url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
      name: changeInfo.cookie.name
    }, () => {
      console.log(`Blocked and removed cookie: ${changeInfo.cookie.name}`);
    });
  }
});