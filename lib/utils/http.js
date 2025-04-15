/**
 * A lightweight HTTP client wrapper around fetch that provides:
 * - Timeout support via AbortController
 * - Finite retry mechanism (only for network errors or 5xx responses)
 * - Exponential backoff for retries
 * - Detailed error messages including response status and body when available
 *
 * @param {string} url The URL to fetch.
 * @param {object} options Standard fetch options.
 * @param {object} config Custom configuration options:
 *   - timeout: number (milliseconds) for the request timeout (default: 8000 ms).
 *   - retries: number of retries on failure (default: 2).
 *   - retryDelay: initial delay between retries in ms (default: 800 ms; doubles each retry).
 * @returns {Promise<Object>} The JSON-parsed response.
 */
export async function httpFetch(url, options = {}, config = {}) {
    const { timeout = 8000, retries = 2, retryDelay = 800 } = config;
    const controller = new AbortController();
    const { signal } = controller;
  
    // Set up a timeout to abort the request.
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
  
      // If response is not OK...
      if (!response.ok) {
        // If 4xx error (client error) or rate limit 429, do not retry.
        if (response.status >= 400 && response.status < 500 || response.status === 429) {
          let errorBody;
          try {
            errorBody = await response.text();
          } catch {
            errorBody = 'No response body';
          }
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}. Response: ${errorBody}`
          );
        }
        // For 5xx errors, throw to trigger retry logic.
        let errorBody;
        try {
          errorBody = await response.text();
        } catch {
          errorBody = 'No response body';
        }
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}. Response: ${errorBody}`
        );
      }
  
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
  
      // Determine if error is retryable:
      // Only retry if error is due to AbortError or a network-related error,
      // and if retries remain.
      if (
        retries > 0 &&
        (error.name === 'AbortError' || error.message.toLowerCase().includes('network') || error.message.includes('HTTP error 5'))
      ) {
        console.warn(
          `Request to ${url} failed: ${error.message}. Retrying in ${retryDelay} ms... (${retries} retries left)`
        );
        // Wait for the delay before retrying; use exponential backoff.
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return httpFetch(url, options, { timeout, retries: retries - 1, retryDelay: retryDelay * 2 });
      }
  
      console.error('HTTP fetch error:', error);
      throw error;
    }
  }
  