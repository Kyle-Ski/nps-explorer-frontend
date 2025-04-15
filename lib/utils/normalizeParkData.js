/**
 * Normalizes the data from the nps, weather, and rec.gov api's. Also strips data that we don't need like excessive park images, other facility park hours, only 3 facilities.
 * @param {object} npsPark Data we get back from the NPS api
 * @param {object} weather Data we get back from the  weather api
 * @param {object} recGovData Data we get back from the rec.gov api
 * @returns {object}
 */
export function normalizeParkData(npsPark, weather, recGovData) {
    // Normalize NPS entrance fees into simplified buckets
    const fees = {
      vehicleFee: null,
      personFee: null,
      commercialFee: null,
      freeAccess: false,
    };
  
    (npsPark.entranceFees || []).forEach(fee => {
      const title = fee.title.toLowerCase();
      const cost = parseFloat(fee.cost);
  
      if (title.includes('vehicle')) {
        fees.vehicleFee = cost;
      } else if (title.includes('person') || title.includes('individual')) {
        fees.personFee = cost;
      } else if (title.includes('commercial')) {
        fees.commercialFee = cost;
      } else if (title.includes('free') || cost === 0) {
        fees.freeAccess = true;
      }
    });
  
    // Normalize images: only keep the first 3
    const images = (npsPark.images || []).slice(0, 3).map(img => ({
      url: img.url,
      alt: img.altText || img.title || '',
    }));
  
    // Normalize activities to just the name
    const activities = (npsPark.activities || []).map(a => a.name);
  
    // Normalize operating hours (first entry only)
    const operatingHours = npsPark.operatingHours?.[0] || null;
  
    // Normalize weather to current for now (TODO: change this to the forecast even though it only gives us 3 days under the free plan)
    const weatherSummary = weather?.current
      ? {
          temp_f: weather.current.temp_f,
          condition: weather.current.condition.text,
          icon: weather.current.condition.icon,
        }
      : null;
  
    // Normalize Rec.gov facilities — keep 3 with basic info
    const nearbyFacilities = (recGovData?.RECDATA || [])
      .slice(0, 3)
      .map(facility => ({
        name: facility.FacilityName,
        type: facility.FacilityTypeDescription,
        description: facility.FacilityDescription,
        lat: facility.RecAreaLatitude || facility.FacilityLatitude,
        lng: facility.RecAreaLongitude || facility.FacilityLongitude,
        image:
          facility.MEDIA?.find(m => m.IsPrimary)?.URL || facility.MEDIA?.[0]?.URL || null,
      }));
  
    return {
      park: {
        id: npsPark.id,
        name: npsPark.fullName,
        description: npsPark.description,
        images,
        activities,
        fees,
        operatingHours,
        location: {
          lat: parseFloat(npsPark.latitude),
          lng: parseFloat(npsPark.longitude),
          website: npsPark.url,
          directionsUrl: npsPark.directionsUrl,
        },
      },
      weather: weatherSummary,
      nearbyFacilities,
    };
  }
  