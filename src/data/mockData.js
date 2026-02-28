// ============================================================
// EcoMind AI – Central Mock Data Layer
// ============================================================

// ---------- Buildings & Zones ----------
export const buildings = [
  { id: 'hostel-a', name: 'Hostel A', lat: 28.6139, lng: 77.2090 },
  { id: 'hostel-b', name: 'Hostel B', lat: 28.6155, lng: 77.2105 },
  { id: 'canteen', name: 'Main Canteen', lat: 28.6125, lng: 77.2115 },
  { id: 'library', name: 'Central Library', lat: 28.6148, lng: 77.2078 },
  { id: 'admin', name: 'Admin Block', lat: 28.6162, lng: 77.2095 },
  { id: 'sports', name: 'Sports Complex', lat: 28.6130, lng: 77.2060 },
  { id: 'lab', name: 'Science Lab', lat: 28.6170, lng: 77.2082 },
  { id: 'workshop', name: 'Workshop', lat: 28.6118, lng: 77.2100 },
];

// ---------- Bin Locations with Fill Levels ----------
export const bins = [
  { id: 1, buildingId: 'hostel-a', lat: 28.6141, lng: 77.2092, fillLevel: 87, type: 'mixed', capacity: 120, label: 'HA-01' },
  { id: 2, buildingId: 'hostel-a', lat: 28.6137, lng: 77.2088, fillLevel: 45, type: 'recyclable', capacity: 80, label: 'HA-02' },
  { id: 3, buildingId: 'hostel-b', lat: 28.6157, lng: 77.2107, fillLevel: 92, type: 'mixed', capacity: 120, label: 'HB-01' },
  { id: 4, buildingId: 'canteen', lat: 28.6127, lng: 77.2117, fillLevel: 78, type: 'organic', capacity: 150, label: 'CT-01' },
  { id: 5, buildingId: 'canteen', lat: 28.6123, lng: 77.2113, fillLevel: 34, type: 'recyclable', capacity: 80, label: 'CT-02' },
  { id: 6, buildingId: 'library', lat: 28.6150, lng: 77.2080, fillLevel: 22, type: 'paper', capacity: 60, label: 'LB-01' },
  { id: 7, buildingId: 'admin', lat: 28.6164, lng: 77.2097, fillLevel: 56, type: 'mixed', capacity: 100, label: 'AD-01' },
  { id: 8, buildingId: 'sports', lat: 28.6132, lng: 77.2062, fillLevel: 95, type: 'mixed', capacity: 100, label: 'SP-01' },
  { id: 9, buildingId: 'lab', lat: 28.6172, lng: 77.2084, fillLevel: 41, type: 'hazardous', capacity: 50, label: 'SL-01' },
  { id: 10, buildingId: 'workshop', lat: 28.6120, lng: 77.2102, fillLevel: 68, type: 'metal', capacity: 80, label: 'WK-01' },
];

// ---------- Waste Categories & Emission Factors ----------
export const wasteCategories = [
  { key: 'plastic', label: 'Plastic', color: '#f472b6', emissionFactor: 6.0, recycleSavings: 1.5 },
  { key: 'paper', label: 'Paper', color: '#60a5fa', emissionFactor: 1.1, recycleSavings: 0.9 },
  { key: 'organic', label: 'Organic', color: '#34d399', emissionFactor: 0.5, recycleSavings: 0.3 },
  { key: 'metal', label: 'Metal', color: '#fbbf24', emissionFactor: 4.0, recycleSavings: 3.2 },
  { key: 'ewaste', label: 'E-Waste', color: '#a78bfa', emissionFactor: 20.0, recycleSavings: 15.0 },
];

// ---------- Generate Historical Waste Data ----------
export function generateHistoricalData(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1;
    const base = 180 + Math.sin(i * 0.3) * 40;
    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: Math.round((base + (Math.random() - 0.5) * 30) * weekendFactor),
      plastic: Math.round((35 + Math.random() * 15) * weekendFactor),
      paper: Math.round((25 + Math.random() * 12) * weekendFactor),
      organic: Math.round((55 + Math.random() * 20) * weekendFactor),
      metal: Math.round((10 + Math.random() * 8) * weekendFactor),
      ewaste: Math.round((3 + Math.random() * 4) * weekendFactor),
    });
  }
  return data;
}

// ---------- Generate Forecast Data ----------
export function generateForecast(historicalData, days = 7) {
  const last = historicalData[historicalData.length - 1];
  const lastDate = new Date(last.date);
  const forecast = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1;
    const trend = last.total + Math.sin(i * 0.5) * 25;
    forecast.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: Math.round((trend + (Math.random() - 0.5) * 20) * weekendFactor),
      upper: Math.round((trend + 30) * weekendFactor),
      lower: Math.round(Math.max(50, (trend - 30) * weekendFactor)),
    });
  }
  return forecast;
}

// ---------- Dashboard KPI Stats ----------
export const dashboardStats = {
  totalWasteToday: 247,
  recyclingRate: 62,
  co2Saved: 112,
  activeBins: bins.length,
  overflowRisk: bins.filter(b => b.fillLevel > 85).length,
  collectionEfficiency: 89,
};

// ---------- Waste Composition ----------
export const wasteComposition = [
  { name: 'Plastic', value: 28, color: '#f472b6' },
  { name: 'Paper', value: 18, color: '#60a5fa' },
  { name: 'Organic', value: 35, color: '#34d399' },
  { name: 'Metal', value: 12, color: '#fbbf24' },
  { name: 'E-Waste', value: 7, color: '#a78bfa' },
];

// ---------- Recent Alerts ----------
export const recentAlerts = [
  { id: 1, type: 'critical', message: 'Bin SP-01 at Sports Complex is 95% full', time: '5 min ago', icon: '🔴' },
  { id: 2, type: 'critical', message: 'Bin HB-01 at Hostel B overflowing (92%)', time: '12 min ago', icon: '🔴' },
  { id: 3, type: 'warning', message: 'Bin HA-01 approaching capacity (87%)', time: '25 min ago', icon: '🟡' },
  { id: 4, type: 'info', message: 'Route optimization saved 2.3 km today', time: '1 hr ago', icon: '🟢' },
  { id: 5, type: 'info', message: 'Weekly recycling rate up by 4%', time: '2 hr ago', icon: '🟢' },
];

// ---------- Insight Templates ----------
export const insightTemplates = [
  {
    id: 1,
    category: 'trend',
    severity: 'warning',
    title: 'Rising Plastic Waste in Hostel A',
    insight: 'Hostel A shows a 23% increase in plastic waste over the past 2 weeks. This correlates with increased food delivery activity.',
    recommendation: 'Install dedicated plastic recycling bins near hostel entrance. Consider partnering with local delivery services for reusable containers.',
    impact: 'Could reduce plastic waste by 18-25%',
    building: 'hostel-a',
  },
  {
    id: 2,
    category: 'opportunity',
    severity: 'positive',
    title: 'Composting Potential Identified',
    insight: 'The Canteen generates 55+ kg of organic waste daily. Only 12% currently reaches composting facilities.',
    recommendation: 'Switching to on-site composting can reduce landfill waste by 32% and generate usable compost for campus gardens.',
    impact: 'Estimated 112 kg CO₂ reduction per week',
    building: 'canteen',
  },
  {
    id: 3,
    category: 'anomaly',
    severity: 'critical',
    title: 'E-Waste Spike Detected in Lab',
    insight: 'Science Lab has generated 3x normal e-waste volume this week, possibly from equipment replacement cycle.',
    recommendation: 'Coordinate with IT department for proper e-waste disposal. Contact certified e-waste recyclers.',
    impact: 'Proper disposal prevents 45 kg CO₂ equivalent toxic emissions',
    building: 'lab',
  },
  {
    id: 4,
    category: 'efficiency',
    severity: 'info',
    title: 'Paper Consumption Declining',
    insight: 'Library paper waste has decreased by 31% since digital resource adoption last month.',
    recommendation: 'Continue digital transition. Share success metrics with other departments to encourage similar adoption.',
    impact: 'Saving approximately 8 kg CO₂ per week',
    building: 'library',
  },
  {
    id: 5,
    category: 'behavioral',
    severity: 'warning',
    title: 'Weekend Waste Misclassification',
    insight: 'Weekend waste audits show 40% of recyclables ending up in general waste bins, primarily in hostels.',
    recommendation: 'Deploy color-coded signage and run awareness campaigns targeting weekend habits.',
    impact: 'Correct sorting could improve recycling rate by 15%',
    building: 'hostel-b',
  },
  {
    id: 6,
    category: 'prediction',
    severity: 'info',
    title: 'Exam Week Waste Pattern Predicted',
    insight: 'Based on historical data, upcoming exam week (Mar 5-12) is expected to see 25% increase in paper and packaging waste.',
    recommendation: 'Pre-position extra recycling bins near hostels and library. Schedule additional collection runs.',
    impact: 'Proactive planning can maintain 60%+ recycling rate during peak',
    building: 'library',
  },
];

// ---------- Weekly Carbon Data ----------
export const weeklyCarbonData = [
  { week: 'W1', saved: 98, emitted: 45 },
  { week: 'W2', saved: 105, emitted: 42 },
  { week: 'W3', saved: 112, emitted: 38 },
  { week: 'W4', saved: 118, emitted: 35 },
];

// ---------- Sustainability Scores ----------
export const sustainabilityScores = {
  overall: 78,
  grade: 'B+',
  breakdown: {
    recycling: 82,
    composting: 65,
    reduction: 71,
    awareness: 88,
    efficiency: 75,
  },
  trend: '+4.2%',
  target: 85,
};
