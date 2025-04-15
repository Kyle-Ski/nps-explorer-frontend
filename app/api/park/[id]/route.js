import { NextResponse } from 'next/server';
import { normalizeParkData } from '@/lib/utils/normalizeParkData';
const NPS_API_KEY = process.env.NEXT_PUBLIC_NPS_API_KEY;
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
const REC_GOV_API_KEY = process.env.NEXT_PUBLIC_RECGOV_API_KEY;

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing park ID' }, { status: 400 });
  }

  try {
    // Step 1: Fetch park data from NPS API
    const npsRes = await fetch(`https://developer.nps.gov/api/v1/parks?parkCode=${id}&api_key=${NPS_API_KEY}`);
    const npsData = await npsRes.json();

    if (!npsData.data?.length) {
      return NextResponse.json({ error: 'Park not found' }, { status: 404 });
    }

    const park = npsData.data[0];
    const { latitude, longitude } = park;

    // Step 2: Fetch weather data using lat/lon
    const weatherRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`);
    const weather = await weatherRes.json();

    // Step 3: Fetch facilities/activities from Recreation.gov
    // Rec.gov API doesn’t use NPS park codes so need to search nearby
    const recGovRes = await fetch(
      `https://ridb.recreation.gov/api/v1/facilities?latitude=${latitude}&longitude=${longitude}&radius=10&limit=10`,
      {
        headers: {
          apikey: REC_GOV_API_KEY,
        },
      }
    );
    const recGovData = await recGovRes.json();

    // Step 4: Combine and normalize
    const normalized = normalizeParkData(park, weather, recGovData);
    
    return NextResponse.json(normalized);
  } catch (err) {
    console.error('Error in /api/park/:id', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
