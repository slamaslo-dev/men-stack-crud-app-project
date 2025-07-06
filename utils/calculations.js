calculateColumnTotals = function (participantPreferences, participantCount) {
  // Initialize totals for each participant
  const participantTotals = {};
  for (let i = 0; i < participantCount; i++) {
    participantTotals[i] = {
      positiveTotal: 0,
      negativeTotal: 0,
      neutralTotal: 0,
    };
  }

  // Process matrix entries to calculate totals
  participantPreferences.forEach((entry) => {
    const { to, sentiment, value } = entry;

    if (sentiment === "positive") {
      participantTotals[to].positiveTotal += value;
    } else if (sentiment === "negative") {
      participantTotals[to].negativeTotal += value;
    } else if (sentiment === "neutral") {
      participantTotals[to].neutralTotal += value;
    }
  });

  return participantTotals;
};

calculateMutualities = function (participantPreferences, participantCount) {
  const mutualities = {};
  for (let i = 0; i < participantCount; i++) {
    mutualities[i] = 0;
  }

  // Create a map of all preferences (not just positive)
  const preferences = new Map();

  participantPreferences.forEach((entry) => {
    const key = `${entry.from}-${entry.to}`;
    preferences.set(key, entry.sentiment);
  });

  // Check for mutual preferences of ANY sentiment
  participantPreferences.forEach((entry) => {
    const reverseKey = `${entry.to}-${entry.from}`;
    const mutualSentiment = preferences.get(reverseKey);

    // If there's a mutual preference (same sentiment both ways)
    if (mutualSentiment && entry.sentiment === mutualSentiment) {
      mutualities[entry.from]++;
    }
  });

  return mutualities;
};

calculateIncongruities = function (participantPreferences, perceivedByOthers, participantCount) {
  const incongruities = {};
  for (let i = 0; i < participantCount; i++) {
    incongruities[i] = 0;
  }

  // Create a map of participant preferences (how A feels about B)
  const preferences = new Map();
  participantPreferences.forEach((entry) => {
    const key = `${entry.from}-${entry.to}`;
    preferences.set(key, entry.sentiment);
  });

  // Check for mismatches between perceived and actual preferences
  perceivedByOthers.forEach((entry) => {
    // In perceivedByOthers: entry.from thinks entry.to feels entry.sentiment about them
    // The actual preference is how entry.to feels about entry.from
    const actualPreferenceKey = `${entry.to}-${entry.from}`;
    const actualPreference = preferences.get(actualPreferenceKey);

    // If there's a mismatch between what they think and reality
    if (actualPreference && entry.sentiment !== actualPreference) {
      incongruities[entry.from]++;
    }
  });

  return incongruities;
};

calculatePerceptionIndices = function(participantPreferences, perceivedByOthers, participantCount) {
  const perceptionIndices = {};
  
  // Create maps
  const preferences = new Map();
  participantPreferences.forEach(entry => {
    const key = `${entry.from}-${entry.to}`;
    preferences.set(key, entry.sentiment);
  });
  
  const perceived = new Map();
  perceivedByOthers.forEach(entry => {
    const key = `${entry.from}-${entry.to}`;
    perceived.set(key, entry.sentiment);
  });
  
  // For each participant i
  for (let i = 0; i < participantCount; i++) {
    let accuratePerceptions = 0;
    
    for (let j = 0; j < participantCount; j++) {
      if (i === j) continue;
      
      // What i thinks j feels about them
      const perceivedKey = `${i}-${j}`;
      const whatIThinkJFeels = perceived.get(perceivedKey);
      
      // What j actually feels about i  
      const actualKey = `${j}-${i}`;
      const whatJActuallyFeels = preferences.get(actualKey);
      
      // If they match, i perceived correctly
      if (whatIThinkJFeels === whatJActuallyFeels) {
        accuratePerceptions++;
      }
    }
    
    perceptionIndices[i] = accuratePerceptions; // Return numerator
  }
  
  return perceptionIndices;
};

calculateEmissionIndices = function(participantPreferences, perceivedByOthers, participantCount) {
  const emissionIndices = {};
  
  // Create maps
  const preferences = new Map();
  participantPreferences.forEach(entry => {
    const key = `${entry.from}-${entry.to}`;
    preferences.set(key, entry.sentiment);
  });
  
  const perceived = new Map();
  perceivedByOthers.forEach(entry => {
    const key = `${entry.from}-${entry.to}`;
    perceived.set(key, entry.sentiment);
  });
  
  // For each participant i
  for (let i = 0; i < participantCount; i++) {
    let accurateEmissions = 0;
    
    for (let j = 0; j < participantCount; j++) {
      if (i === j) continue;
      
      // What i actually feels about j
      const actualKey = `${i}-${j}`;
      const whatIActuallyFeels = preferences.get(actualKey);
      
      // What j thinks i feels about them
      const perceivedKey = `${j}-${i}`;
      const whatJThinksIFeel = perceived.get(perceivedKey);
      
      // If they match, j accurately perceived i's feelings
      if (whatIActuallyFeels === whatJThinksIFeel) {
        accurateEmissions++;
      }
    }
    
    emissionIndices[i] = accurateEmissions; // Return numerator
  }
  
  return emissionIndices;
};

calculateTelicIndices = function (perceptionIndices, emissionIndices) {
  const telicIndices = {};

  for (const position in perceptionIndices) {
    telicIndices[position] = (perceptionIndices[position] + emissionIndices[position]) / 2;
  }

  return telicIndices;
};

calculateGroupTelicIndex = function (telicIndices) {
  let sum = 0;
  let count = 0;

  for (const position in telicIndices) {
    sum += telicIndices[position];
    count++;
  }

  return count > 0 ? sum / count : 0;
};

module.exports = {
  calculateColumnTotals,
  calculateMutualities,
  calculateIncongruities,
  calculatePerceptionIndices,
  calculateEmissionIndices,
  calculateTelicIndices,
  calculateGroupTelicIndex,
};