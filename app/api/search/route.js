import { NextResponse } from 'next/server';
import { enrichContext } from '@/lib/mcp/enrichContext';
import { getNPSData } from '@/lib/services/nps';
import { getRecGovData } from '@/lib/services/recgov';
import { getWeatherData } from '@/lib/services/weather';

/**
 * GET /api/search?query=...&lat=...&lng=...&otherParams=...
 * serves as the central aggregator and context enhancer for incoming search requests
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    // Additional parameters (like activity type, season, etc.) can be extracted as needed.
    const activity = searchParams.get('activity') || '';

    // Use MCP middleware (or helper) to enrich the context.
    const context = await enrichContext({ query, lat, lng, activity });
    // 'enrichContext' will add things like current season, user preference defaults, etc.

    // Fetch data from external APIs concurrently.
    const [npsData, recgovData, weatherData] = await Promise.all([
      getNPSData(context),
      getRecGovData(context),
      getWeatherData(context)
    ]);

    // Combine and process the responses as needed.
    const aggregatedResults = {
      nps: npsData,
      recgov: recgovData,
      weather: weatherData,
      context, // returning context could help with debugging or frontend display
    };

    return NextResponse.json(aggregatedResults);
  } catch (error) {
    console.error('Error in /api/search:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
