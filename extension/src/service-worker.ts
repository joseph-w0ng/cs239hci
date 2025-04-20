/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import categorizeCookie, { cookieCategories } from './lib/categorize';

let isLoading: boolean = false;

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'unknown domain';
  }
}

async function getResourceUrls(tabId: number): Promise<string[]> {
  function getPerformanceEntries(): string[] {
    return performance.getEntriesByType('resource').map((r) => r.name);
  }

  try {
    const results = await chrome.scripting.executeScript<[], string[]>({
      target: { tabId },
      func: getPerformanceEntries,
    });

    return results[0]?.result ?? [];
  } catch (error) {
    console.error('Error getting performance entries:', error);
    return [];
  }
}

interface CookieInfo {
  url: string;
  cookies: chrome.cookies.Cookie[];
}

// Function to get all cookies from all resources
async function getAllResourceCookies(tabId: number): Promise<void> {
  try {
    const resourceUrls : any = await getResourceUrls(tabId);

    const origins = resourceUrls
      .map((url) => {
        try {
          return new URL(url).origin;
        } catch (e) {
          return null;
        }
      })
      .filter((url): url is string => Boolean(url) && url !== 'null');

    const uniqueOrigins = new Set<string>(origins);

    if (activeDomain) {
      uniqueOrigins.add(`http://${activeDomain}`);
      uniqueOrigins.add(`https://${activeDomain}`);
    }

    const getCookiesPromises: Promise<CookieInfo>[] = [];

    for (const url of uniqueOrigins) {
      if (url) {
        const promise = chrome.cookies.getAll({ url }).then((cookies) => ({
          url,
          cookies,
        }));
        getCookiesPromises.push(promise);
      }
    }

    const urlCookies = await Promise.all(getCookiesPromises);

    const filtered = urlCookies.filter((c) => c.cookies.length > 0);

    const allCookies: chrome.cookies.Cookie[] = [];
    const cookieNames = new Set<string>();

    for (const { cookies: originCookies } of filtered) {
      for (const cookie of originCookies) {
        const cookieKey = `${cookie.domain}|${cookie.name}|${cookie.path}`;
        if (!cookieNames.has(cookieKey)) {
          cookieNames.add(cookieKey);
          allCookies.push(cookie);
        }
      }
    }

    const size = allCookies.length.toString();
    chrome.action.setBadgeText({ text: size });

    console.log('Found cookies from all resources:', allCookies.length);

    isLoading = false;
  } catch (error) {
    console.error('Error getting all resource cookies:', error);
    isLoading = false;
  }
}

let activeDomain = '';

chrome.cookies.onChanged.addListener((changeInfo: chrome.cookies.CookieChangeInfo) => {
  isLoading = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) return;
    const tab = tabs[0];
    const url = tab.url;
    if (!url) return;

    activeDomain = extractDomain(url);
  });

  if (!changeInfo.removed) {
    console.log('Cookies changed: current domain - ', activeDomain);
    chrome.storage.local.get(['siteData'], (result) => {
      const blockedCookies = result.siteData as Record<string, any[]>;

      if (blockedCookies && blockedCookies[activeDomain]) {
        const foundObject = blockedCookies[activeDomain].find(
          (item) =>
            changeInfo.cookie.domain === item.domain &&
            changeInfo.cookie.name === item.name
        );

        console.log('Found object: ', foundObject);

        if (foundObject) {
          chrome.cookies.remove({
            url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
            name: changeInfo.cookie.name,
          }, () => {
            console.log(`Blocked and removed cookie: ${changeInfo.cookie.name}`);
          });
        }
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      const url = tab.url;
      console.log('Active Tab URL:', url);

      chrome.cookies.getAll({ url }, (cookies) => {
        const size = cookies.length.toString();
        chrome.action.setBadgeText({ text: size });
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (tab && tab.url) {
    const url = tab.url;

    chrome.cookies.getAll({ url }, (cookies) => {
      const size = cookies.length.toString();
      chrome.action.setBadgeText({ text: size });
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '0' });

  chrome.storage.local.get(['siteData'], (result) => {
    if (!Object.hasOwn(result, 'siteData')) {
      console.log("Site data doesn't exist, initializing now...");
      chrome.storage.local.set({ siteData: {} });
    }
  });
});

// Run every second
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs.length) return;
    const tab = tabs[0];
    const url = tab.url;
    if (!url) return;

    activeDomain = extractDomain(url);
    await getAllResourceCookies(tab.id ?? 0);
  });
}, 1000);
