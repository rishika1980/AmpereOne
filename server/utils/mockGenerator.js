const getKwForFlat = (hour, multiplier = 1.0) => {
  let base;
  // Following MVP Spec: 0.2 to 4.5 kW range
  if (hour >= 0 && hour < 5)        base = 0.2 + Math.random() * 0.3;  // Late Night: 0.2 - 0.5
  else if (hour >= 5 && hour < 7)   base = 0.5 + Math.random() * 0.8;  // Early Morning: 0.5 - 1.3
  else if (hour >= 7 && hour < 10)  base = 2.5 + Math.random() * 2.0;  // Morning Peak: 2.5 - 4.5
  else if (hour >= 10 && hour < 17) base = 0.8 + Math.random() * 1.2;  // Mid Day: 0.8 - 2.0
  else if (hour >= 17 && hour < 18) base = 1.5 + Math.random() * 1.5;  // Early Evening: 1.5 - 3.0
  else if (hour >= 18 && hour < 22) base = 3.0 + Math.random() * 1.5;  // Evening Peak: 3.0 - 4.5
  else                              base = 0.6 + Math.random() * 0.6;  // Night: 0.6 - 1.2

  return parseFloat((base * multiplier).toFixed(2));
};

const getKwForCommonArea = (hour, category) => {
  // Following MVP Spec: 0.5 to 15 kW range
  const base = {
    'Vertical Transport': hour >= 7 && hour <= 22 ? 4.0 + Math.random() * 6.0 : 0.5 + Math.random() * 0.5, // 0.5 - 10.0
    'Water Systems':      hour >= 5 && hour <= 9 || hour >= 18 && hour <= 22 ? 8.0 + Math.random() * 7.0 : 1.5 + Math.random() * 1.5, // 1.5 - 15.0
    'Lighting':           hour >= 18 || hour <= 6 ? 6.0 + Math.random() * 4.0 : 0.5 + Math.random() * 0.3, // 0.5 - 10.0
    'Recreational':       hour >= 6 && hour <= 22 ? 3.0 + Math.random() * 4.0 : 0.5
  };
  return parseFloat((base[category] || 1.5).toFixed(2));
};

module.exports = { getKwForFlat, getKwForCommonArea };
