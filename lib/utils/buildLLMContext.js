/***
 * This function aggregates all of the data from our third party API requests into a more succinct piece of data for use to feed into our LLM
 * @param {object} normalized the large object created by all of our api requests (NPS, rec.gov, and weather)
 * @param {object} userPrefs user's saved preferences/settings
 * @returns {object}
 */
export function buildLLMContext(normalized, userPrefs = {}) {
    const { park, weather, nearbyFacilities } = normalized;
  
    const context = {
      park_summary: `${park.name} is a national park located at latitude ${park.location.lat}, longitude ${park.location.lng}. ${park.description}`,
  
      activities_available: park.activities.join(', ') || 'No listed activities',
  
      entrance_fees: park.fees.freeAccess
        ? 'Free to enter'
        : [
            park.fees.vehicleFee ? `Vehicle: $${park.fees.vehicleFee}` : null,
            park.fees.personFee ? `Per person: $${park.fees.personFee}` : null,
            park.fees.commercialFee ? `Commercial: $${park.fees.commercialFee}` : null,
          ]
            .filter(Boolean)
            .join(' | ') || 'No fee information available',
  
      operating_hours: park.operatingHours?.description || 'No operating hours info available',
  
      weather_summary: weather
        ? `${weather.temp_f}°F, ${weather.condition}`
        : 'No current weather data',
  
      nearby_facilities: nearbyFacilities.length
        ? nearbyFacilities.map(f => `${f.name} (${f.type})`).join(', ')
        : 'None listed nearby',
  
      ...(userPrefs && Object.keys(userPrefs).length && {
        user_preferences: `User prefers ${userPrefs.preferredActivities?.join(', ') || 'any activities'}, `
          + `with hikes up to ${userPrefs.hikingDuration || '?'} hours, `
          + `within ${userPrefs.travelDistance || '?'} miles, `
          + `and a budget of up to $${userPrefs.budget || '?'} `
          + `during the ${userPrefs.seasonalPreference || 'current season'}.`,
      }),
    };
  
    return context;
  }
  