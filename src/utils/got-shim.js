// Simple fetch-based shim for 'got' library
// Adapts bing-translate-api to work in browser extension background scripts

async function got(url, options = {}) {
    console.log('got-shim: Request to', url, 'with options:', options);
    
    const method = (options.method || 'GET').toUpperCase();
    const headers = {};
    
    // Handle search params / query string
    const urlObj = new URL(url);
    if (options.searchParams) {
        if (options.searchParams instanceof URLSearchParams) {
            options.searchParams.forEach((v, k) => urlObj.searchParams.append(k, v));
        } else {
            Object.entries(options.searchParams).forEach(([k, v]) => {
                if (Array.isArray(v)) {
                    v.forEach(val => urlObj.searchParams.append(k, val));
                } else {
                    urlObj.searchParams.append(k, v);
                }
            });
        }
    }

    // Build request body
    let body = undefined;
    if (options.body) {
        body = options.body;
    } else if (options.form) {
        body = new URLSearchParams(options.form).toString();
        headers['content-type'] = 'application/x-www-form-urlencoded';
    } else if (options.json) {
        body = JSON.stringify(options.json);
        headers['content-type'] = 'application/json';
    }

    // Copy safe headers only
    if (options.headers) {
        const forbiddenHeaders = [
            'user-agent', 'accept-charset', 'accept-encoding', 'access-control-request-headers', 
            'access-control-request-method', 'connection', 'content-length', 'cookie', 'cookie2', 
            'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'te', 'trailer', 
            'transfer-encoding', 'upgrade', 'via'
        ];
        
        for (const [key, value] of Object.entries(options.headers)) {
            if (!forbiddenHeaders.includes(key.toLowerCase())) {
                headers[key] = value;
            }
        }
    }

    const response = await fetch(urlObj.toString(), {
        method,
        headers,
        body,
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow'
    });

    console.log('got-shim: Response status:', response.status, response.statusText);
    console.log('got-shim: Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is OK
    if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, response.statusText);
        console.error('Error response body (first 500):', errorText.substring(0, 500));
        
        // Create error that mimics got's error structure
        const error = new Error(`Request failed with status code ${response.status}`);
        error.response = {
            statusCode: response.status,
            statusMessage: response.statusText,
            body: errorText
        };
        throw error;
    }

    const responseText = await response.text();
    console.log('got-shim: Response text (first 200 chars):', responseText.substring(0, 200));
    
    let responseBody = responseText;

    // Parse JSON ONLY if explicitly requested via responseType
    // Do NOT auto-parse based on content-type if caller wants text
    if (options.responseType === 'json') {
        try {
            responseBody = JSON.parse(responseText);
            console.log('got-shim: Parsed JSON successfully');
        } catch (e) {
            console.error('JSON parse error:', e.message);
            console.error('Response text (first 500 chars):', responseText.substring(0, 500));
            // Keep as text if parse fails
        }
    } else {
        console.log('got-shim: Returning as text (responseType:', options.responseType, ')');
    }

    // Return got-like response object
    return {
        body: responseBody,
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        request: {
            redirects: response.redirected ? [response.url] : []
        },
        url: response.url
    };
}

// Support got.get() and got.post() syntax
got.get = (url, options) => got(url, { ...options, method: 'GET' });
got.post = (url, options) => got(url, { ...options, method: 'POST' });

module.exports = got;
