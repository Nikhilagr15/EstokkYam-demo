/**
 * Reusable Compound Interest Calculation Engine for Staking Rewards
 * 
 * Formula: A = P * (1 + r / n)^(n * t)
 * 
 * Where:
 * - P = Initial principal
 * - r = Annual interest rate (nominal decimal, derived from input apy / 100)
 * - n = Compounding periods per year (daily = 365, weekly = 52, monthly = 12, annually = 1)
 * - t = Duration in years
 * - A = Projected final balance
 * - Rewards = A - P
 */

const COMPOUNDING_PERIODS = Object.freeze({
  daily: 365,
  weekly: 52,
  monthly: 12,
  annually: 1
});

const VALID_DURATION_UNITS = Object.freeze(['days', 'years']);

/**
 * Validate input parameters for calculation.
 * Returns array of error messages (empty if valid).
 */
function validateCalculationParams(params) {
  const errors = [];

  if (!params || typeof params !== 'object') {
    return ['Request payload must be an object.'];
  }

  const { principal, apy, duration, durationUnit, compoundingFrequency, tokenPrice } = params;

  // Principal validation
  if (principal === undefined || principal === null || typeof principal !== 'number' || isNaN(principal)) {
    errors.push('Principal must be a valid number.');
  } else if (principal <= 0) {
    errors.push('Principal must be greater than 0.');
  } else if (!isFinite(principal)) {
    errors.push('Principal must be finite.');
  }

  // APY validation
  if (apy === undefined || apy === null || typeof apy !== 'number' || isNaN(apy)) {
    errors.push('APY must be a valid number.');
  } else if (apy < 0) {
    errors.push('APY cannot be negative.');
  } else if (!isFinite(apy)) {
    errors.push('APY must be finite.');
  }

  // Duration validation
  if (duration === undefined || duration === null || typeof duration !== 'number' || isNaN(duration)) {
    errors.push('Duration must be a valid number.');
  } else if (duration <= 0) {
    errors.push('Duration must be greater than 0.');
  } else if (!isFinite(duration)) {
    errors.push('Duration must be finite.');
  }

  // Duration Unit validation
  if (!durationUnit || typeof durationUnit !== 'string' || !VALID_DURATION_UNITS.includes(durationUnit.toLowerCase())) {
    errors.push(`Duration unit must be one of: ${VALID_DURATION_UNITS.join(', ')}.`);
  }

  // Compounding Frequency validation
  if (!compoundingFrequency || typeof compoundingFrequency !== 'string' || !COMPOUNDING_PERIODS[compoundingFrequency.toLowerCase()]) {
    errors.push(`Compounding frequency must be one of: ${Object.keys(COMPOUNDING_PERIODS).join(', ')}.`);
  }

  // Optional Token Price validation
  if (tokenPrice !== undefined && tokenPrice !== null) {
    if (typeof tokenPrice !== 'number' || isNaN(tokenPrice) || tokenPrice < 0 || !isFinite(tokenPrice)) {
      errors.push('Token price must be a non-negative finite number if provided.');
    }
  }

  return errors;
}

/**
 * Round a number to specified decimal places with epsilon protection.
 */
function roundTo(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Normalizes duration to years.
 * @param {number} duration 
 * @param {'days'|'years'} unit 
 * @returns {number} duration in years
 */
function normalizeDurationToYears(duration, unit) {
  const normalizedUnit = unit.toLowerCase();
  if (normalizedUnit === 'days') {
    return duration / 365;
  }
  return duration; // 'years'
}

/**
 * Calculate single compound interest final balance.
 * A = P * (1 + r / n)^(n * t)
 * 
 * @param {number} P Principal
 * @param {number} r Nominal rate in decimal (e.g. 0.05 for 5%)
 * @param {number} n Compounding periods per year
 * @param {number} t Duration in years
 * @returns {number} Projected final balance
 */
function calculateCompoundBalance(P, r, n, t) {
  if (r === 0) {
    return P;
  }
  return P * Math.pow(1 + r / n, n * t);
}

/**
 * Calculate effective APY from nominal rate and compounding frequency.
 * Effective APY = ((1 + r / n)^n - 1) * 100
 * 
 * @param {number} r Nominal rate in decimal
 * @param {number} n Compounding periods per year
 * @returns {number} Effective APY percentage
 */
function calculateEffectiveApy(r, n) {
  if (r === 0) return 0;
  return (Math.pow(1 + r / n, n) - 1) * 100;
}

/**
 * Generate time-series data for the growth chart.
 * O(k) time and O(k) space where k is number of points (default max 60 points).
 * 
 * @param {Object} config
 * @returns {Array<Object>} Chart points
 */
function generateTimeSeriesData({
  principal,
  nominalRate,
  compoundingPeriodsPerYear,
  durationInYears,
  originalDuration,
  durationUnit,
  tokenPrice,
  maxPoints = 60
}) {
  const points = [];
  const P = principal;
  const r = nominalRate;
  const n = compoundingPeriodsPerYear;
  const t = durationInYears;

  // Determine total periods and number of sampling points k
  const totalCompoundingSteps = Math.max(1, Math.round(n * t));
  const k = Math.min(totalCompoundingSteps, maxPoints);

  const hasTokenPrice = typeof tokenPrice === 'number' && tokenPrice >= 0;

  for (let i = 0; i <= k; i++) {
    // Current fraction of duration
    const progress = i / k;
    const tCurrent = progress * t;
    const balance = calculateCompoundBalance(P, r, n, tCurrent);
    const rewards = Math.max(0, balance - P);

    // Format human-readable time label
    let timeLabel;
    if (durationUnit.toLowerCase() === 'days') {
      const currentDays = Math.round(progress * originalDuration);
      timeLabel = `Day ${currentDays}`;
    } else {
      const currentYears = progress * originalDuration;
      timeLabel = currentYears === 0 
        ? 'Start' 
        : currentYears === 1 
          ? 'Year 1' 
          : `Year ${roundTo(currentYears, 2)}`;
    }

    const point = {
      step: i,
      timeLabel,
      timeInYears: roundTo(tCurrent, 4),
      balance: roundTo(balance, 4),
      rewards: roundTo(rewards, 4)
    };

    if (hasTokenPrice) {
      point.balanceUsd = roundTo(balance * tokenPrice, 2);
      point.rewardsUsd = roundTo(rewards * tokenPrice, 2);
    }

    points.push(point);
  }

  return points;
}

/**
 * Main calculateRewards engine function.
 * 
 * @param {Object} params
 * @param {number} params.principal - Principal amount to stake
 * @param {number} params.apy - Stated annual percentage yield (interpreted as nominal annual rate r)
 * @param {number} params.duration - Duration value (days or years)
 * @param {'days'|'years'} params.durationUnit - Unit of duration
 * @param {'daily'|'weekly'|'monthly'|'annually'} params.compoundingFrequency - Compounding frequency
 * @param {number} [params.tokenPrice] - Optional token price in USD
 * @returns {Object} Calculation result including projected balance, rewards, and chart series
 */
function calculateRewards(params) {
  const errors = validateCalculationParams(params);
  if (errors.length > 0) {
    const error = new Error('Invalid calculation parameters.');
    error.validationErrors = errors;
    error.isValidationError = true;
    throw error;
  }

  const {
    principal,
    apy,
    duration,
    durationUnit,
    compoundingFrequency,
    tokenPrice
  } = params;

  const freqKey = compoundingFrequency.toLowerCase();
  const unitKey = durationUnit.toLowerCase();
  const n = COMPOUNDING_PERIODS[freqKey];
  const t = normalizeDurationToYears(duration, unitKey);
  const r = apy / 100;

  // Closed-form calculation
  const finalBalance = calculateCompoundBalance(principal, r, n, t);
  const totalRewards = Math.max(0, finalBalance - principal);
  const effectiveApy = calculateEffectiveApy(r, n);

  const hasTokenPrice = typeof tokenPrice === 'number' && tokenPrice >= 0;

  // Generate chart time-series
  const chartData = generateTimeSeriesData({
    principal,
    nominalRate: r,
    compoundingPeriodsPerYear: n,
    durationInYears: t,
    originalDuration: duration,
    durationUnit: unitKey,
    tokenPrice: hasTokenPrice ? tokenPrice : null
  });

  const result = {
    principal: roundTo(principal, 4),
    apy: roundTo(apy, 4),
    effectiveApy: roundTo(effectiveApy, 4),
    duration,
    durationUnit: unitKey,
    normalizedDurationYears: roundTo(t, 4),
    compoundingFrequency: freqKey,
    compoundingPeriodsPerYear: n,
    projectedBalance: roundTo(finalBalance, 4),
    totalRewards: roundTo(totalRewards, 4),
    chartData
  };

  if (hasTokenPrice) {
    result.tokenPrice = roundTo(tokenPrice, 4);
    result.projectedBalanceUsd = roundTo(finalBalance * tokenPrice, 2);
    result.totalRewardsUsd = roundTo(totalRewards * tokenPrice, 2);
  }

  return result;
}

module.exports = {
  calculateRewards,
  validateCalculationParams,
  normalizeDurationToYears,
  calculateCompoundBalance,
  calculateEffectiveApy,
  generateTimeSeriesData,
  COMPOUNDING_PERIODS,
  VALID_DURATION_UNITS,
  roundTo
};

