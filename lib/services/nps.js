import { httpFetch } from '@/lib/http';

/**
 * Retrieves data from the National Park Service API based on the provided context.
 *
 * @param {object} context - The enriched search context.
 * @param {object} [dependencies] - Optional dependency overrides (e.g., fetch).
 * @returns {Promise<object>} - NPS API JSON response
 */
export async function getNPSData(context, dependencies = {}) {
  const fetchFn = dependencies.fetch || httpFetch;
  const NPS_API_KEY = process.env.NEXT_PUBLIC_NPS_API_KEY;

  if (!NPS_API_KEY) {
    throw new Error('Missing NPS API key');
  }

  const searchParams = new URLSearchParams({
    api_key: NPS_API_KEY,
    limit: context.limit || '25',
  });

  if (context.query) searchParams.append('q', context.query);
  if (context.lat) searchParams.append('lat', context.lat);
  if (context.lng) searchParams.append('lng', context.lng);
  if (context.stateCode) searchParams.append('stateCode', context.stateCode);
  if (context.parkCode) searchParams.append('parkCode', context.parkCode);
  if (context.designation) searchParams.append('designation', context.designation);
  if (context.activityIds) {
    // Must be a comma-separated list of activity IDs (not names!)
    searchParams.append('activities', context.activityIds.join(','));
  }

  const url = `https://developer.nps.gov/api/v1/parks?${searchParams.toString()}`;

  try {
    return await fetchFn(url);
  } catch (error) {
    console.error('Error fetching NPS data:', error);
    throw error;
  }
}
