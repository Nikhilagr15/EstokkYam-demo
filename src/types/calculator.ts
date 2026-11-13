export type CompoundingFrequency = 'daily' | 'weekly' | 'monthly' | 'annually';

export type DurationUnit = 'days' | 'years';

export interface CalculateRewardsRequest {
  principal: number;
  apy: number;
  duration: number;
  durationUnit: DurationUnit;
  compoundingFrequency: CompoundingFrequency;
  tokenPrice?: number;
}

export interface ChartDataPoint {
  step: number;
  timeLabel: string;
  timeInYears: number;
  balance: number;
  rewards: number;
  balanceUsd?: number;
  rewardsUsd?: number;
}

export interface CalculateRewardsResult {
  principal: number;
  apy: number;
  effectiveApy: number;
  duration: number;
  durationUnit: DurationUnit;
  normalizedDurationYears: number;
  compoundingFrequency: CompoundingFrequency;
  compoundingPeriodsPerYear: number;
  projectedBalance: number;
  totalRewards: number;
  tokenPrice?: number;
  projectedBalanceUsd?: number;
  totalRewardsUsd?: number;
  chartData: ChartDataPoint[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

