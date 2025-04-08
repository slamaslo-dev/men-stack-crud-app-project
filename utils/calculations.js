calculateColumnTotals = function(matrixEntries, participantCount) {
    // Initialize totals for each participant
    const participantTotals = {};
    for (let i = 0; i < participantCount; i++) {
      participantTotals[i] = {
        positiveTotal: 0,
        negativeTotal: 0,
        neutralTotal: 0
      };
    }
    
    // Process matrix entries to calculate totals
    matrixEntries.forEach(entry => {
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

calculateMutualities = function(perceptionEntries, participantCount) {
    const mutualities = {};
    for (let i = 0; i < participantCount; i++) {
      mutualities[i] = 0;
    }
    
    // Create a map of positive perceptions
    const positivePerceptions = new Map();
    
    perceptionEntries.forEach(entry => {
      if (entry.sentiment === "positive") {
        const key = `${entry.from}-${entry.to}`;
        positivePerceptions.set(key, true);
      }
    });
    
    // Check for mutual positive perceptions
    perceptionEntries.forEach(entry => {
      if (entry.sentiment === "positive") {
        const reverseKey = `${entry.to}-${entry.from}`;
        
        // If there's a mutual positive perception
        if (positivePerceptions.has(reverseKey)) {
          mutualities[entry.from]++;
        }
      }
    });
    
    return mutualities;
  };
  
  calculateIncongruities = function(perceptionEntries, emissionEntries, participantCount) {
    const incongruities = {};
    for (let i = 0; i < participantCount; i++) {
      incongruities[i] = 0;
    }
    
    // Create a map of perceptions (how A perceives B)
    const perceptions = new Map();
    perceptionEntries.forEach(entry => {
      const key = `${entry.from}-${entry.to}`;
      perceptions.set(key, entry.sentiment);
    });
    
    // Check for mismatches between emission and perception
    emissionEntries.forEach(entry => {
      // In emission, entry.from thinks entry.to perceives them as entry.sentiment
      // The actual perception is how entry.to perceives entry.from
      const perceptionKey = `${entry.to}-${entry.from}`;
      const actualPerception = perceptions.get(perceptionKey);
      
      // If there's a mismatch between what they think and reality
      if (actualPerception && entry.sentiment !== actualPerception) {
        incongruities[entry.from]++;
      }
    });
    
    return incongruities;
  };
  

  calculatePerceptionIndices = function(perceptionEntries, emissionEntries, participantCount) {
    const indices = {};
    
    // Create maps for perceptions and emissions
    const perceptions = new Map();
    perceptionEntries.forEach(entry => {
      const key = `${entry.from}-${entry.to}`;
      perceptions.set(key, entry.sentiment);
    });
    
    const emissions = new Map();
    emissionEntries.forEach(entry => {
      const key = `${entry.from}-${entry.to}`;
      emissions.set(key, entry.sentiment);
    });
    
    // Calculate perception index for each participant
    for (let i = 0; i < participantCount; i++) {
      let accuratePerceptions = 0;
      let totalPerceptions = 0;
      
      for (let j = 0; j < participantCount; j++) {
        if (i === j) continue; // Skip self
        
        totalPerceptions++;
        
        // What i thinks about j
        const perceptionKey = `${i}-${j}`;
        const perception = perceptions.get(perceptionKey);
        
        // What i thinks j thinks about them
        const emissionKey = `${i}-${j}`;
        const emission = emissions.get(emissionKey);
        
        // What j actually thinks about i
        const actualKey = `${j}-${i}`;
        const actual = perceptions.get(actualKey);
        
        // If i's perception of what j thinks matches what j actually thinks
        if (emission === actual) {
          accuratePerceptions++;
        }
      }
      
      indices[i] = accuratePerceptions / (participantCount - 1);
    }
    
    return indices;
  };
  

  calculateEmissionIndices = function(perceptionEntries, emissionEntries, participantCount) {
    const indices = {};
    
    // Create maps for perceptions and emissions
    const perceptions = new Map();
    perceptionEntries.forEach(entry => {
      const key = `${entry.from}-${entry.to}`;
      perceptions.set(key, entry.sentiment);
    });
    
    const emissions = new Map();
    emissionEntries.forEach(entry => {
      const key = `${entry.from}-${entry.to}`;
      emissions.set(key, entry.sentiment);
    });
    
    // Calculate emission index for each participant
    for (let i = 0; i < participantCount; i++) {
      let accurateEmissions = 0;
      
      for (let j = 0; j < participantCount; j++) {
        if (i === j) continue; // Skip self
        
        // What j thinks about i
        const perceptionKey = `${j}-${i}`;
        const perception = perceptions.get(perceptionKey);
        
        // What j thinks i thinks about them
        const emissionKey = `${j}-${i}`;
        const emission = emissions.get(emissionKey);
        
        // What i actually thinks about j
        const actualKey = `${i}-${j}`;
        const actual = perceptions.get(actualKey);
        
        // If j's perception of what i thinks matches what i actually thinks
        if (emission === actual) {
          accurateEmissions++;
        }
      }
      
      indices[i] = accurateEmissions / (participantCount - 1);
    }
    
    return indices;
  };
  
  calculateTelicIndices = function(perceptionIndices, emissionIndices) {
    const telicIndices = {};
    
    for (const position in perceptionIndices) {
      telicIndices[position] = (perceptionIndices[position] + emissionIndices[position]) / 2;
    }
    
    return telicIndices;
  };
  
  calculateGroupTelicIndex = function(telicIndices) {
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