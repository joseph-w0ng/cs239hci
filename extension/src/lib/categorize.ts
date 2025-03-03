export const cookieCategories: Record<
    cookieCategory,
    { name: string; description: string; color: string; canDelete: boolean }
> = {
    essential: {
        name: 'Essential',
        description: 'Necessary for the website to function properly',
        color: '#4CAF50',
        canDelete: false
    },
    functional: {
        name: 'Functional',
        description: 'Enable specific functionality and preferences',
        color: '#2196F3',
        canDelete: true
    },
    analytics: {
        name: 'Analytics',
        description: 'Help understand how visitors interact with the website',
        color: '#FFC107',
        canDelete: true
    },
    marketing: {
        name: 'Marketing',
        description: 'Used for advertising and tracking across websites',
        color: '#F44336',
        canDelete: true
    },
    unknown: {
        name: 'Unknown',
        description: 'Purpose could not be determined',
        color: '#9E9E9E',
        canDelete: true
    }
};

// Enhanced cookie categorization function
export default function categorizeCookie(cookie: chrome.cookies.Cookie): CookieWithCategory {
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
                '_ga'
            ],
            domains: ['analytics.', 'stats.', 'metrics.', 'logging.', 'monitor.', 'telemetry.'],
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
                'matomo_'
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
                'tiktok'
            ],
            domains: [
                'ads.',
                'ad.',
                'adserv',
                'doubleclick.',
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
                'outbrain.'
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
                '_gcl_'
            ]
        }
    };

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
        JSESSIONID: 'essential' // Java session
    };

    // First check for exact matches in known cookies
    if (knownCookies[name]) {
        return {
            ...cookie,
            category: knownCookies[name] as cookieCategory,
            description: getDescriptionForCookie(name, knownCookies[name] as cookieCategory)
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
                scores[category as keyof typeof scores] += 2;
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
        description: getDescriptionForCookie(name, highestCategory)
    };
}

// Get a more specific description based on the cookie name and category
export function getDescriptionForCookie(name: string, category: cookieCategory): string {
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
        MUID: 'Microsoft User Identifier for advertising'
    };

    // Return specific description if we have one
    if (specificDescriptions[name]) {
        return specificDescriptions[name];
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