
import { SurveyResponse } from './types';

// Players directly from the PDF "Numeric scoring table"
const localManufacturers = [
  { name: 'Korica', price: 7.5, mva: 6.5, lead: 8.5, composite: 7.5, cluster: 'Cluster A: Speed & Value' },
  { name: 'Nile Transformers', price: 5.0, mva: 9.0, lead: 4.0, composite: 6.0, cluster: 'Cluster B: Scale & Capacity' },
  { name: 'ECS', price: 7.0, mva: 5.0, lead: 7.0, composite: 6.3, cluster: 'Cluster C: Distribution Specialists' },
  { name: 'Elolam', price: 6.5, mva: 6.0, lead: 6.0, composite: 6.2, cluster: 'Cluster C: Distribution Specialists' },
  { name: 'PowerAfrica', price: 8.5, mva: 4.0, lead: 9.0, composite: 7.2, cluster: 'Cluster A: Speed & Value' }
];

export const generateMockData = (): SurveyResponse[] => {
  const data: SurveyResponse[] = [];

  // 1. Generate Utility Data (Baseline from Market Volume Overlay PDF)
  for (let i = 0; i < 10; i++) {
    data.push({
      id: `util-${i}`,
      stakeholder_type: 'utility',
      util_dist_units_12m: Math.floor(Math.random() * 100) + 400, // Matching 400-600 units/year range
      util_mid_units_12m: Math.floor(Math.random() * 30) + 40,   // Matching 40-70 units/year
      util_high_units_12m: Math.floor(Math.random() * 5) + 5,    // Matching 5-10 units/year
      util_total_spend_usd: Math.floor(Math.random() * 10000000) + 40000000, // Total market 40-50m
      util_replacement_pct: 35,
      util_expansion_pct: 65,
    });
  }

  // 2. Generate C&I Data
  for (let i = 0; i < 25; i++) {
    data.push({
      id: `ci-${i}`,
      stakeholder_type: 'ci',
      ci_installed_units: Math.floor(Math.random() * 10) + 2,
      ci_future_units_3y: Math.floor(Math.random() * 5) + 1,
      ci_max_lead_weeks: Math.floor(Math.random() * 12) + 4,
      ci_budget_mid_usd: Math.floor(Math.random() * 50000) + 15000,
    });
  }

  // 3. Generate Supplier Data (The core Positioning Model players)
  localManufacturers.forEach((player, i) => {
    data.push({
      id: `sup-${i}`,
      stakeholder_type: 'supplier',
      supplier_name: player.name,
      // Map scores back to realistic values based on PDF logic
      sup_price_mid_usd: player.price > 7 ? 25000 : 45000, 
      sup_max_mva: player.mva > 8 ? 50 : 5, 
      sup_lead_time_weeks: player.lead > 8 ? 5 : 15,
      
      supplier_composite_score: player.composite,
      price_score: player.price,
      mva_score: player.mva,
      lead_time_score: player.lead,
      reliability_score: 7.5, // Filler
      sup_main_constraint: player.cluster // Store cluster here
    });
  });

  return data;
};
