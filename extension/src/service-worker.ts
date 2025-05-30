/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import categorizeCookie, { cookieCategories } from './lib/categorize';

let isLoading: boolean = false;

let blockingPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true
};

// async function createBlockingPreferencesStore() {
//   // Default values
//   const defaultPreferences = {
//     essential: true,
//     functional: true,
//     analytics: true,
//     marketing: true
//   };

//   let blockingPreferences = { ...defaultPreferences };

//   // Load from storage
//   function loadPreferences() {
//     (async () => {
//       try {
//         const result: any = await new Promise<{ siteData: any }>(
//           (resolve) => chrome.storage.local.get(['cookiePreferences'], resolve)
//         );
    
//         const storedPreferences = result.siteData;
//         if (storedPreferences) {
//           const preferences = JSON.parse(storedPreferences);
    
//           blockingPreferences = {
//             essential: true, // Always true
//             functional: preferences.functional !== undefined ? preferences.functional : defaultPreferences.functional,
//             analytics: preferences.analytics !== undefined ? preferences.analytics : defaultPreferences.analytics,
//             marketing: preferences.marketing !== undefined ? preferences.marketing : defaultPreferences.marketing,
//           };
//         }
//       } catch (error) {
//         console.error('Error loading preferences:', error);
//         blockingPreferences = { ...defaultPreferences };
//       }
//     })();
//   }

//   // Initial load
//   loadPreferences();

//   return blockingPreferences;
// }

async function loadBlockingPreferences() {
  const defaultPreferences = {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true
  };

  try {
    const result = await new Promise<{ cookiePreferences?: any }>((resolve) =>
      chrome.storage.sync.get(['cookiePreferences'], resolve)
    );

    const prefs = result.cookiePreferences || {};
    return {
      essential: true,
      functional: prefs.functional ?? defaultPreferences.functional,
      analytics: prefs.analytics ?? defaultPreferences.analytics,
      marketing: prefs.marketing ?? defaultPreferences.marketing
    };
  } catch (e) {
    console.error('[SW] Failed to load preferences:', e);
    return defaultPreferences;
  }
}

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

    const originCookies = filtered.flatMap(({ cookies }) => cookies);
    await updateDisplayBadge(originCookies);

    isLoading = false;
  } catch (error) {
    console.error('Error getting all resource cookies:', error);
    isLoading = false;
  }
}

let activeDomain = '';

chrome.cookies.onChanged.addListener((changeInfo: chrome.cookies.CookieChangeInfo) => {
  isLoading = true;
  let blockList: Record<string, any[]> = {};
  (async () => {
    const result: any = await new Promise<{ siteData: Record<string, any[]> }>(
      (resolve) => chrome.storage.local.get(['siteData'], resolve)
    );
    blockList = result.siteData;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      const tab = tabs[0];
      const url = tab.url;
      if (!url) return;
  
      activeDomain = extractDomain(url);
  
      if (!changeInfo.removed) {
        console.log('Cookie attempted to be added: current domain - ', activeDomain);
        const cookie: chrome.cookies.Cookie = changeInfo.cookie;
        const category: any = categorizeCookie(cookie, activeDomain);
        const foundObject = !!blockList?.[activeDomain]?.find(
          (item) =>
            cookie?.domain === item.domain &&
            cookie?.name === item.name
        ); // convert into a boolean
        const shouldBlock: boolean = !blockingPreferences[category.category as keyof typeof blockingPreferences] || foundObject;
        console.log("shouldBlock: ", shouldBlock);
        if (shouldBlock) {
          deleteCookie(cookie, activeDomain, category.category);
        }
      }
    });  
  })();
});


async function updateDisplayBadge(cookies: chrome.cookies.Cookie[]) {
  let blockList: Record<string, any[]> = {};
  (async () => {
    const result: any = await new Promise<{ siteData: Record<string, any[]> }>(
      (resolve) => chrome.storage.local.get(['siteData'], resolve)
    );
    blockList = result.siteData;
    console.log("blockList:", blockList);

    const cookieNames: Set<string> = new Set<string>();
    const cookiesToBlock: Set<chrome.cookies.Cookie> = new Set<chrome.cookies.Cookie>();
    let cookieCount: number = 0;
    for (const cookie of cookies) {
      const cookieKey = `${cookie.domain}|${cookie.name}|${cookie.path}`;
      const category: any = categorizeCookie(cookie, activeDomain);
      const foundObject = !!blockList?.[activeDomain]?.find(
        (item) =>
          cookie?.domain === item.domain &&
          cookie?.name === item.name
      ); // convert into a boolean
      const shouldBlock: boolean = !blockingPreferences[category.category as keyof typeof blockingPreferences] || foundObject;
      // const shouldBlock = false;
      if (shouldBlock) {
        deleteCookie(cookie, activeDomain, category.category);
      } else if (!cookieNames.has(cookieKey)) {
        cookieNames.add(cookieKey);
        cookieCount++;
      }
      chrome.action.setBadgeText({text: cookieCount.toString()});
    }
  })();
}

function deleteCookie(cookie: chrome.cookies.Cookie, activeDomain: string, category: string) {
  console.log('Found cookie to block: ', cookie.name, 'Category: ', category);
  chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
      }, () => {
        console.log(`Blocked and removed cookie: ${cookie.name}`);
      });
}

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
  // createBlockingPreferencesStore().then((prefs) => blockingPreferences = prefs); 

  chrome.storage.local.get(['siteData'], (result) => {
    if (!Object.hasOwn(result, 'siteData')) {
      console.log("Site data doesn't exist, initializing now...");
      chrome.storage.local.set({ siteData: {} });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('hi');
  if (msg.action === 'updateCookiePreferences') {
    console.log('[SW] Preferences updated via message:', msg.preferences);
    // Optionally update global state
    loadBlockingPreferences().then((prefs) => {
      blockingPreferences = prefs;
      console.log('[SW] Reloaded blockingPreferences:', blockingPreferences);
    });
  }
});

// Run every second
setInterval(() => {
  console.log(blockingPreferences);

  loadBlockingPreferences().then((prefs) => {
    blockingPreferences = prefs;
    console.log('[SW] Reloaded blockingPreferences:', blockingPreferences);
  });
  
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs.length) return;
    const tab = tabs[0];
    const url = tab.url;
    if (!url) return;
    
    activeDomain = extractDomain(url);
    console.log("active domain:", activeDomain);
    await getAllResourceCookies(tab.id ?? 0);
  });
}, 1000);