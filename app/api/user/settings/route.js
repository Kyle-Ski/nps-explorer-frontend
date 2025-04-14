import { NextResponse } from 'next/server';

// Simulated in-memory store (replacing with Cloudflare KV or D1 in production)
let userSettingsStore = {}; // TODO: later this should be persistent and keyed by user id/session

// Default settings object
const defaultSettings = {
  hikingDuration: 4, // hours
  travelDistance: 50, // miles
  budget: 50, // dollars
  preferredActivities: ['hiking', 'camping'],
  seasonalPreference: 'fall',
  accessabilityOptions: '',
};

/**
 * GET /api/user/settings
 * Returns the current user settings, or default settings if none exist.
 */
export async function GET(request) {
  // TODO: For demo purposes, assume a dummy user id or use session/cookie if available.
  const userId = 'default-user';

  // Get user settings or fallback to defaults
  const settings = userSettingsStore[userId] || defaultSettings;
  return NextResponse.json(settings);
}

/**
 * POST /api/user/settings
 * Updates the user settings.
 */
export async function POST(request) {
  try {
    const userId = 'default-user'; // TODO: Replace with actual user identification logic
    const body = await request.json();

    // Simple validation
    if (typeof body.hikingDuration !== 'number' || body.hikingDuration < 1 || body.hikingDuration > 12) {
      return NextResponse.json({ error: 'Invalid hikingDuration' }, { status: 400 });
    }
    if (typeof body.travelDistance !== 'number' || body.travelDistance <= 0) {
      return NextResponse.json({ error: 'Invalid travelDistance' }, { status: 400 });
    }
    if (typeof body.budget !== 'number' || body.budget < 0) {
      return NextResponse.json({ error: 'Invalid budget' }, { status: 400 });
    }
    if (!Array.isArray(body.preferredActivities)) {
      return NextResponse.json({ error: 'preferredActivities must be an array' }, { status: 400 });
    }
    if (!['fall', 'winter', 'summer', 'spring'].includes(body.seasonalPreference)) {
      return NextResponse.json({ error: 'Invalid seasonalPreference' }, { status: 400 });
    }

    // Update the settings in the store (TODO: replace with persistence logic)
    userSettingsStore[userId] = { ...defaultSettings, ...body };

    return NextResponse.json({ message: 'Settings updated', settings: userSettingsStore[userId] });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
