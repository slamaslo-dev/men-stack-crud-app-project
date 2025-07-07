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
  
  const preferences = new Map();
  participantPreferences.forEach((entry) => {
    const key = `${entry.from}-${entry.to}`;
    preferences.set(key, entry.sentiment);
  });
  
  participantPreferences.forEach((entry) => {
    const reverseKey = `${entry.to}-${entry.from}`;
    const mutualSentiment = preferences.get(reverseKey);
    
    if (mutualSentiment && entry.sentiment === mutualSentiment) {
      mutualities[entry.from]++;
    }
  });
  
  return mutualities;
};

// ✅ CORRECTED: Calculate incongruities based on mutualities
calculateIncongruities = function (mutualities, participantCount) {
  const incongruities = {};
  
  for (let i = 0; i < participantCount; i++) {
    // Incongruities = Total possible relationships - 1 (self) - Mutualities
    incongruities[i] = (participantCount - 1) - mutualities[i];
  }
  
  return incongruities;
};

calculatePerceptionIndices = function(participantPreferences, perceivedByOthers, participantCount) {
  const perceptionIndices = {};
  
  // Create maps for faster lookup
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
      if (i === j) continue; // Skip self
      
      // What participant i thinks participant j feels about them
      const perceivedKey = `${i}-${j}`;
      const whatIThinkJFeels = perceived.get(perceivedKey);
      
      // What participant j actually feels about participant i  
      const actualKey = `${j}-${i}`;
      const whatJActuallyFeels = preferences.get(actualKey);
      
      // If they match, participant i perceived correctly
      if (whatIThinkJFeels === whatJActuallyFeels) {
        accuratePerceptions++;
      }
    }
    
    perceptionIndices[i] = accuratePerceptions;
  }
  
  return perceptionIndices;
};

calculateEmissionIndices = function(participantPreferences, perceivedByOthers, participantCount) {
  const emissionIndices = {};
  
  // Create maps for faster lookup
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
      if (i === j) continue; // Skip self
      
      // What participant i actually feels about participant j
      const actualKey = `${i}-${j}`;
      const whatIActuallyFeels = preferences.get(actualKey);
      
      // What participant j thinks participant i feels about them
      const perceivedKey = `${j}-${i}`;
      const whatJThinksIFeel = perceived.get(perceivedKey);
      
      // If they match, participant j accurately perceived participant i's feelings
      if (whatIActuallyFeels === whatJThinksIFeel) {
        accurateEmissions++;
      }
    }
    
    emissionIndices[i] = accurateEmissions;
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

calculateGroupTelicIndex = function(telicIndices, participantCount) {
  let sum = 0;
  let count = 0;
  
  for (const position in telicIndices) {
    // Convert to percentage (0-1 scale)
    const percentage = telicIndices[position] / (participantCount - 1);
    sum += percentage;
    count++;
  }
  
  return count > 0 ? sum / count : 0;
};

calculateAllMetrics = function(participantPreferences, perceivedByOthers, participants) {
  const participantCount = participants.length;
  
  // Calculate all metrics in sequence
  const participantTotals = calculateColumnTotals(participantPreferences, participantCount);
  const mutualities = calculateMutualities(participantPreferences, participantCount);
  const incongruities = calculateIncongruities(mutualities, participantCount);
  const perceptionIndices = calculatePerceptionIndices(participantPreferences, perceivedByOthers, participantCount);
  const emissionIndices = calculateEmissionIndices(participantPreferences, perceivedByOthers, participantCount);
  const telicIndices = calculateTelicIndices(perceptionIndices, emissionIndices);
  const groupTelicIndex = calculateGroupTelicIndex(telicIndices, participantCount);
  
  // Structure results for easy access
  const participantResults = participants.map((participant, index) => ({
    ...participant.toObject(),
    positiveTotal: participantTotals[index]?.positiveTotal || 0,
    negativeTotal: participantTotals[index]?.negativeTotal || 0,
    neutralTotal: participantTotals[index]?.neutralTotal || 0,
    mutualitiesCount: mutualities[index] || 0,
    incongruitiesCount: incongruities[index] || 0,
    perceptionIndex: perceptionIndices[index] || 0,
    emissionIndex: emissionIndices[index] || 0,
    telicIndex: telicIndices[index] || 0,
  }));
  
  return {
    participants: participantResults,
    groupResults: {
      groupTelicIndex,
    }
  };
};

module.exports = {
  calculateColumnTotals,
  calculateMutualities,
  calculateIncongruities,
  calculatePerceptionIndices,
  calculateEmissionIndices,
  calculateTelicIndices,
  calculateGroupTelicIndex,
  calculateAllMetrics
};