export const cookieCategories: Record<
    cookieCategory,
    { name: string; description: string; color: string; secondaryColor: string, canDelete: boolean }
> = {

    marketing: {
        name: 'Marketing',
        description: 'Used for advertising and tracking across websites',
        color: 'oklch(0.637 0.237 25.331)',
        secondaryColor: 'oklch(0.936 0.032 17.717)',
        canDelete: true
    },
    analytics: {
        name: 'Analytics',
        description: 'Help understand how visitors interact with the website',
        color: 'oklch(0.606 0.25 292.717)',
        secondaryColor: 'oklch(0.943 0.029 294.588)',
        canDelete: true
    },
    functional: {
        name: 'Functional',
        description: 'Enable specific functionality and preferences',
        color: 'oklch(0.685 0.169 237.323)',
        secondaryColor: 'oklch(0.951 0.026 236.824)',
        canDelete: true
    },
    essential: {
        name: 'Necessary',
        description: 'Necessary for the website to function properly, these cookies cannot be deleted',
        color: 'oklch(0.627 0.194 149.214)',
        secondaryColor: 'oklch(0.962 0.044 156.743)',
        canDelete: false
    },
    unknown: {
        name: 'Unknown',
        description: 'Purpose could not be determined',
        color: 'oklch(0.769 0.188 70.08)',
        secondaryColor: 'oklch(0.962 0.059 95.617)',
        canDelete: true
    }
};

export default function categorizeCookie(cookie: chrome.cookies.Cookie, activeDomain: string): CookieWithCategory {
    const name = cookie.name.toLowerCase();
    const domain = cookie.domain.toLowerCase();
    const path = cookie.path.toLowerCase();

    // Create a score-based system for more accurate categorization
    let scores = {
        essential: 0,
        functional: 0,
        analytics: 0,
        marketing: 0
    };

    // Common cookie patterns database
    const patterns = {
        essential: {
            names: [
                'sess',
                'auth',
                'token',
                'csrf',
                'xsrf',
                'login',
                'secure',
                'phpsessid',
                'jsessionid',
                'aspsessionid',
                'asp.net',
                'remember',
                'reqtoken',
                'security',
                'user',
                'account',
                'member',
                '^sid$',
                'sessionid',
                'connect.sid'
            ],
            domains: ['auth.', 'login.', 'accounts.', 'account.', 'secure.'],
            common: [
                'csrf_token',
                'xsrf_token',
                'auth_token',
                'session_id',
                'req_token',
                'security_token',
                '__Host-',
                '__Secure-'
            ]
        },
        functional: {
            names: [
                'pref',
                'setting',
                'config',
                'lang',
                'locale',
                'region',
                'timezone',
                'ui_',
                'consent',
                'notice',
                'cookie',
                'gdpr',
                'ccpa',
                'theme',
                'mode',
                'layout',
                'customize',
                'a11y',
                'accessibility'
            ],
            domains: ['preferences.', 'settings.', 'config.', 'ui.'],
            common: [
                'language_',
                'country_',
                'currency_',
                'ui_pref',
                'cookie_consent',
                'gdpr_consent',
                'ccpa_consent',
                'cookie_notice',
                'dark_mode',
                'theme_'
            ]
        },
        analytics: {
            names: [
                'ga',
                'gtm',
                '_utm',
                'analytics',
                'stat',
                'metric',
                'measurement',
                'monitor',
                'track',
                'event',
                'perf',
                'log',
                'gauge',
                'ping',
                'pixel',
                'count',
                'optimize',
                'hotjar',
                'clarity',
                'plausible',
                'fathom',
                '_ga',
                'adobemc',
                'adobe_mc',
                'omtrdc',
                'mbox',
                'sc_',
                's_',
                'amplitude',
                'mixpanel',
                'kissmetrics',
                'heap',
                'segment',
                'hubspot',
                'intercom',
                'ap_',
                'at_'
            ],
            domains: [
                'analytics.',
                'stats.',
                'metrics.',
                'logging.',
                'monitor.',
                'telemetry.',
                'google-analytics.com',
                'googletagmanager.com',
                'hotjar.com',
                'clarity.ms',
                'plausible.io',
                'fathom.com',
                'amplitude.com',
                'mixpanel.com',
                'kissmetrics.com',
                'heapanalytics.com',
                'segment.com',
                'segment.io',
                'adobe.com',
                'adobedtm.com',
                'omtrdc.net',
                'hubspot.com',
                'intercom.io',
                'quantserve.com',
                'newrelic.com',
                'dynatrace.com',
                'matomo.cloud',
                'chartbeat.com',
                'parsely.com',
                'alexametrics.com',
                'crazyegg.com'
            ],
            common: [
                'google_analytics',
                'ga_session',
                'gtm_',
                '_ga_',
                '_gid',
                'utm_source',
                'utm_medium',
                'utm_campaign',
                '_hjSession',
                '_clck',
                'mp_',
                'amplitude_',
                'mixpanel_',
                'matomo_',
                'adobe_mc',
                'sc.ASP.NET_'
            ]
        },
        marketing: {
            names: [
                'ad',
                'ads',
                'advert',
                'promo',
                'promotion',
                'campaign',
                'offer',
                'market',
                'recommendation',
                'remarketing',
                'retargeting',
                'affiliate',
                'partner',
                'sponsor',
                'doubleclick',
                'taboola',
                'outbrain',
                'criteo',
                'fb',
                'fbp',
                'pinterest',
                'twitter',
                'linked',
                'tiktok',
                'bing',
                'yahoo',
                'amazon-adsystem',
                'adroll',
                'adnxs',
                'mediamath',
                'pubmatic',
                'rubiconproject',
                'openx',
                'tradedesk',
                'msn',
                'verizon',
                'liveramp',
                'snapchat',
                'reddit'
            ],
            domains: [
                'ads.',
                'ad.',
                'adserv',
                'doubleclick.',
                'doubleverify.',
                'facebook.',
                'fbcdn.',
                'twitter.',
                'linkedin.',
                'pinterest.',
                'tiktok.',
                'snapchat.',
                'amazon-adsystem.',
                'adnxs.',
                'criteo.',
                'taboola.',
                'outbrain.',
                'instagram.',
                'reddit.',
                'adroll.com',
                'demdex.net',
                'bluekai.com',
                'rubiconproject.com',
                'casalemedia.com',
                'pubmatic.com',
                'openx.net',
                'smartadserver.com',
                'advertising.com',
                'bidswitch.net',
                'media.net',
                'yahoo.com',
                'bing.com',
                'msn.com',
                'linkedin.com',
                'pinterest.com',
                'snapchat.com',
                'facebook.net',
                'tiktok.com',
                'adsrvr.org',
                'sharethis.com',
                'addthis.com',
                'spotxchange.com',
                'innovid.com',
                'moatads.com',
                'serving-sys.com',
                'sizmek.com',
                'turn.com',
                'eyeota.com',
                'exelator.com',
                'crwdcntrl.net',
                'liveramp.com',
                'ipredictive.com',
                'rlcdn.com',
                'quantcast.com',
                'dotomi.com',
                'amgdgt.com',
                'glam.com',
                'admantx.com',
                'contextweb.com',
                'adform.net',
                'cloudfront.net'
            ],
            common: [
                '_fbp',
                '_fbc',
                'lidc',
                'anj',
                'fr',
                'impression',
                'conversion',
                'uuid',
                'visitor_id',
                'dc_',
                'MUID',
                'IDE',
                'NID',
                'DSID',
                '_gcl_',
                '_kuid_',
                '_lc2_',
                '_rdt_',
                'ATN',
                'PREF',
                'SID',
                'TAID',
                'test_cookie',
                'tuuid',
                'uid',
                'UIDR',
                'UserMatchHistory',
                'obuid',
                '__gads',
                '__qca',
                'TapAd_',
                '_pinterest_',
                '_twitter_',
                '_li_'
            ]
        }
    };

    // Common third-party domain categorization
    // These are domains that should always be categorized a certain way
    const domainCategories = [
        // Social media platforms (typically marketing)
        { domain: 'facebook.com', category: 'marketing' },
        { domain: 'facebook.net', category: 'marketing' },
        { domain: 'fbcdn.net', category: 'marketing' },
        { domain: 'instagram.com', category: 'marketing' },
        { domain: 'twitter.com', category: 'marketing' },
        { domain: 'linkedin.com', category: 'marketing' },
        { domain: 'pinterest.com', category: 'marketing' },
        { domain: 'reddit.com', category: 'marketing' },
        { domain: 'tiktok.com', category: 'marketing' },
        { domain: 'snapchat.com', category: 'marketing' },

        // Google advertising domains
        { domain: 'doubleclick.net', category: 'marketing' },
        { domain: 'googlesyndication.com', category: 'marketing' },
        { domain: 'googleadservices.com', category: 'marketing' },

        // Google analytics domains
        { domain: 'google-analytics.com', category: 'analytics' },
        { domain: 'googletagmanager.com', category: 'analytics' },

        // Adobe domains
        { domain: 'omtrdc.net', category: 'analytics' },
        { domain: 'demdex.net', category: 'marketing' },
        { domain: 'adobedtm.com', category: 'analytics' },

        // Major ad networks
        { domain: 'criteo.com', category: 'marketing' },
        { domain: 'criteo.net', category: 'marketing' },
        { domain: 'taboola.com', category: 'marketing' },
        { domain: 'outbrain.com', category: 'marketing' },
        { domain: 'adnxs.com', category: 'marketing' },
        { domain: 'rubiconproject.com', category: 'marketing' },
        { domain: 'openx.net', category: 'marketing' },
        { domain: 'pubmatic.com', category: 'marketing' },

        // Analytics services
        { domain: 'hotjar.com', category: 'analytics' },
        { domain: 'amplitude.com', category: 'analytics' },
        { domain: 'mixpanel.com', category: 'analytics' },
        { domain: 'segment.com', category: 'analytics' },
        { domain: 'segment.io', category: 'analytics' },
        { domain: 'clarity.ms', category: 'analytics' },
        { domain: 'quantserve.com', category: 'analytics' },
        { domain: 'matomo.cloud', category: 'analytics' },
        { domain: 'newrelic.com', category: 'analytics' }
    ];

    // Known cookie services - exact matching
    const knownCookies: Record<string, string> = {
        // Google cookies
        sid: 'essential',
        hsid: 'essential',
        ssid: 'essential',
        apisid: 'essential',
        sapisid: 'essential',
        nid: 'functional',
        ogpc: 'functional',
        consent: 'functional',
        '1p_jar': 'analytics',
        _ga: 'analytics',
        _gid: 'analytics',
        _gat: 'analytics',
        dv: 'functional',
        ide: 'marketing',

        // Facebook cookies
        c_user: 'essential',
        xs: 'essential',
        fr: 'marketing',
        datr: 'functional',
        _fbp: 'marketing',

        // Common third-party cookies
        _hjid: 'analytics', // Hotjar
        _hjSession: 'analytics', // Hotjar
        _clck: 'analytics', // Microsoft Clarity
        _uetsid: 'marketing', // Microsoft UET
        _uetvid: 'marketing', // Microsoft UET
        MUID: 'marketing', // Microsoft
        ANONCHK: 'marketing', // Microsoft
        _gcl_au: 'marketing', // Google Conversion Linker
        _pin_unauth: 'marketing', // Pinterest
        _routing_id: 'essential', // Generic routing
        AWSALB: 'essential', // AWS load balancer
        JSESSIONID: 'essential', // Java session

        // Adobe cookies
        AMCV_: 'analytics', // Adobe Marketing Cloud
        AMCVS_: 'analytics', // Adobe Marketing Cloud session
        s_cc: 'analytics', // Adobe Analytics cookie consent
        s_sq: 'analytics', // Adobe Analytics previous page
        s_vi: 'analytics', // Adobe Analytics visitor ID
        s_fid: 'analytics', // Adobe Analytics fallback visitor ID
        mbox: 'marketing', // Adobe Target

        // More marketing/advertising cookies
        __gads: 'marketing', // Google Advertising
        __gac: 'marketing', // Google Ads Conversion
        _gac_: 'marketing', // Google Ads Conversion
        _gcl_aw: 'marketing', // Google Ads Conversion Linker
        _fbc: 'marketing', // Facebook Click ID
        _pinterest_ct: 'marketing', // Pinterest conversion tracking
        _pinterest_sess: 'marketing', // Pinterest session
        _rdt_uuid: 'marketing', // Reddit

        // More analytics cookies
        _pk_id: 'analytics', // Matomo/Piwik
        _pk_ses: 'analytics', // Matomo/Piwik session
        amp_: 'analytics', // Amplitude
        mp_: 'analytics', // Mixpanel
        ajs_user_id: 'analytics', // Segment
        ajs_anonymous_id: 'analytics', // Segment
        _ym_uid: 'analytics', // Yandex Metrica
        _ym_d: 'analytics', // Yandex Metrica
        __hstc: 'analytics', // HubSpot
        __hssc: 'analytics', // HubSpot session
        __hsfp: 'analytics', // HubSpot
        'intercom-id': 'analytics', // Intercom
        'intercom-session': 'analytics' // Intercom session
    };

    // First check if the domain is in our known domain categories list
    for (const domainCategory of domainCategories) {
        if (domain.includes(domainCategory.domain)) {
            // Add a high score to make sure this domain categorization is prioritized
            scores[domainCategory.category as keyof typeof scores] += 10;
        }
    }

    // Check for exact matches in known cookies
    if (knownCookies[name]) {
        return {
            ...cookie,
            category: knownCookies[name] as cookieCategory,
            description: getDescriptionForCookie(name, knownCookies[name] as cookieCategory, activeDomain)
        };
    }

    // Then assess patterns for each category and assign scores
    Object.keys(patterns).forEach((category) => {
        const catPatterns = patterns[category as keyof typeof patterns];

        // Check name patterns
        catPatterns.names.forEach((pattern) => {
            if (name.includes(pattern) || new RegExp(pattern).test(name)) {
                scores[category as keyof typeof scores] += 3;
            }
        });

        // Check domain patterns
        catPatterns.domains.forEach((pattern) => {
            if (domain.includes(pattern)) {
                scores[category as keyof typeof scores] += 5; // Increased weight for domain matches
            }
        });

        // Check common exact matches
        catPatterns.common.forEach((common) => {
            if (name === common || name.startsWith(common)) {
                scores[category as keyof typeof scores] += 5;
            }
        });
    });

    // Special case: First-party cookies with session in path are often essential
    if (path.includes('/session') || path === '/') {
        scores.essential += 1;
    }

    // Special case: Secure and HttpOnly cookies are more likely to be essential
    if (cookie.secure && cookie.httpOnly) {
        scores.essential += 2;
    }

    // Special case: Third-party cookies are more likely to be marketing/analytics
    if (domain.indexOf('.') !== domain.lastIndexOf('.') && domain.startsWith('.')) {
        scores.marketing += 1;
        scores.analytics += 1;
    }

    // Special case: Social media domains detected in the cookie domain
    const socialMediaDomains = ['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'tiktok', 'snapchat', 'reddit'];
    for (const social of socialMediaDomains) {
        if (domain.includes(social)) {
            scores.marketing += 3;
        }
    }

    // Special case: Common ad tech subdomains
    const adTechSubdomains = ['ads', 'adserver', 'adservice', 'pixel', 'track', 'tracker', 'targeting', 'retargeting'];
    for (const subDomain of adTechSubdomains) {
        if (domain.includes(subDomain)) {
            scores.marketing += 3;
        }
    }

    // Determine the category with the highest score
    let highestCategory: keyof typeof scores = 'essential';
    let highestScore = 0;

    Object.keys(scores).forEach((category) => {
        if (scores[category as keyof typeof scores] > highestScore) {
            highestScore = scores[category as keyof typeof scores];
            highestCategory = category as keyof typeof scores;
        }
    });

    // If no clear category was found, mark as unknown
    if (highestScore === 0) {
        return {
            ...cookie,
            category: 'unknown',
            description: 'Purpose could not be determined'
        };
    }

    return {
        ...cookie,
        category: highestCategory,
        description: getDescriptionForCookie(name, highestCategory, activeDomain, domain)
    };
}

// Get a more specific description based on the cookie name, category, and domain
export function getDescriptionForCookie(name: string, category: cookieCategory, activeDomain: string, domain?: string): string {
    // Well-known cookies with specific descriptions
    const specificDescriptions: Record<string, string> = {
        _ga: 'Google Analytics cookie that distinguishes users',
        _gid: 'Google Analytics cookie that identifies user sessions',
        _gat: 'Google Analytics cookie used to throttle request rate',
        _fbp: 'Facebook pixel tracking cookie for advertising',
        fr: 'Facebook cookie for advertisement delivery and measurement',
        nid: 'Google preference cookie that remembers your preferences',
        sid: 'Session identifier cookie for authentication',
        hsid: 'Security cookie to verify user authentication',
        ssid: 'Security cookie used with HSID to protect user data',
        _hjid: 'Hotjar cookie that identifies the visitor across visits',
        consent: 'Stores user cookie consent preferences',
        datr: 'Facebook security cookie to identify the browser',
        csrftoken: 'Helps prevent Cross-Site Request Forgery attacks',
        AWSALB: 'Amazon Web Services load balancer cookie',
        MUID: 'Microsoft User Identifier for advertising',
        IDE: 'Doubleclick cookie used for targeted advertising',
        __gads: 'Google advertising cookie used to measure interactions',
        AMCV_: 'Adobe Marketing Cloud visitor identification cookie',
        s_vi: 'Adobe Analytics visitor identification cookie',
        mbox: 'Adobe Target cookie for personalization',
        _pin_unauth: 'Pinterest cookie for guest user identification',
        _rdt_uuid: 'Reddit cookie for tracking and advertising',
        _uetsid: 'Microsoft Advertising (Bing) session tracking',
        mp_: 'Mixpanel analytics cookie that tracks user behavior',
        ajs_user_id: 'Segment analytics cookie that identifies users',
        __hstc: 'HubSpot analytics cookie tracking visitors',
        'intercom-id': 'Intercom cookie for visitor identification'
    };

    // Return specific description if we have one
    if (specificDescriptions[name]) {
        return specificDescriptions[name];
    }

    // Create domain-specific description
    if (domain) {
        // Check for well-known domains and give more specific descriptions
        if (domain.includes('facebook')) {
            return `Facebook ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('google') || domain.includes('doubleclick')) {
            return `Google ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('twitter')) {
            return `Twitter ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('linkedin')) {
            return `LinkedIn ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('pinterest')) {
            return `Pinterest ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('tiktok')) {
            return `TikTok ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('reddit')) {
            return `Reddit ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('adobe') || domain.includes('omtrdc') || domain.includes('demdex')) {
            return `Adobe ${getCategoryPurpose(category)} cookie from ${domain}`;
        }
        if (domain.includes('criteo')) {
            return `Criteo advertising cookie from ${domain}`;
        }
        if (domain.includes('hotjar')) {
            return `Hotjar analytics cookie from ${domain}`;
        }
        if (domain.includes('clarity')) {
            return `Microsoft Clarity analytics cookie from ${domain}`;
        }

        const currentDomain = extractRootDomain(activeDomain);
        const cookieDomain = extractRootDomain(domain);

        if (currentDomain !== cookieDomain) {
            return `Third-party ${getCategoryPurpose(category)} cookie from ${domain} (Debugging: ${currentDomain} - ${activeDomain}, ${cookieDomain} - ${domain})`;
        }
    }

    // Generic description based on category
    const categoryDescriptions = {
        essential: 'Required cookie for site functionality and security',
        functional: 'Stores preferences and enhances user experience',
        analytics: 'Helps analyze website usage and performance',
        marketing: 'Used for advertising and cross-site tracking',
        unknown: 'Purpose could not be determined'
    };

    return categoryDescriptions[category];
}

// Helper function to extract the root domain from a hostname
function extractRootDomain(hostname: string): string {
    // Handle IP addresses
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        return hostname;
    }

    // Remove any leading dots
    hostname = hostname.replace(/^\./, '');

    // Split the hostname by dots
    const parts = hostname.split('.');

    // Check if it's a simple domain (e.g., 'example.com')
    if (parts.length <= 2) {
        return hostname;
    }

    // Handle special TLDs like .co.uk, .com.au, etc.
    const specialTLDs = [
        'co.uk', 'com.au', 'com.br', 'co.jp', 'co.nz', 'co.za',
        'com.sg', 'com.hk', 'org.uk', 'net.au', 'org.au', 'ac.uk'
    ];

    const lastTwoParts = parts.slice(-2).join('.');
    if (specialTLDs.includes(lastTwoParts)) {
        // If it's a special TLD, get the last three parts
        return parts.slice(-3).join('.');
    }

    // Otherwise, get the last two parts
    return parts.slice(-2).join('.');
}

// Helper to get a purpose description based on category
function getCategoryPurpose(category: cookieCategory): string {
    switch (category) {
        case 'essential':
            return 'essential';
        case 'functional':
            return 'preference';
        case 'analytics':
            return 'analytics';
        case 'marketing':
            return 'advertising';
        default:
            return '';
    }
}