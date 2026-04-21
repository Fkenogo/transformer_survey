
export type StakeholderType = 'utility' | 'ci' | 'supplier' | 'epc' | 'regulator';

export interface SurveyResponse {
  id: string;
  stakeholder_type: StakeholderType;
  
  // Utility Fields
  util_dist_units_12m?: number;
  util_mid_units_12m?: number;
  util_high_units_12m?: number;
  util_total_spend_usd?: number;
  util_replacement_pct?: number;
  util_expansion_pct?: number;
  util_local_accept_mid?: 'yes' | 'no';
  util_confidence?: string;

  // C&I Fields
  ci_installed_units?: number;
  ci_largest_mva?: number;
  ci_purchases_5y?: number;
  ci_future_units_3y?: number;
  ci_budget_mid_usd?: number;
  ci_max_lead_weeks?: number;
  ci_pay_premium?: 'yes' | 'no';
  ci_premium_pct?: number;

  // Supplier Fields
  supplier_name?: string;
  sup_max_mva?: number;
  sup_capacity_dist?: number;
  sup_capacity_mid?: number;
  sup_price_mid_usd?: number;
  sup_lead_time_weeks?: number; // New field
  sup_main_constraint?: string;
  supplier_composite_score?: number;
  price_score?: number;
  mva_score?: number;
  lead_time_score?: number;
  reliability_score?: number;

  // EPC Fields
  epc_projects_5y?: number;
  epc_typical_mva_distribution?: number;
  epc_typical_mva_mid?: number;
  epc_typical_mva_high?: number;
  epc_top3_suppliers?: string; // Comma separated list for dummy data
  epc_leadtime_mid?: number;
  epc_price_mid?: number;

  // Regulator Fields
  reg_local_content?: 'yes' | 'no';
  reg_local_content_weight?: number;
  reg_enforcement?: string;
}

export interface KPIStats {
  totalUnits: number;
  avgLeadTime: number;
  totalMarketValue: number;
}
