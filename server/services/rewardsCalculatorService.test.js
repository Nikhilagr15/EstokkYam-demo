const {
  calculateRewards,
  validateCalculationParams,
  normalizeDurationToYears,
  calculateCompoundBalance,
  calculateEffectiveApy,
  generateTimeSeriesData,
  COMPOUNDING_PERIODS
} = require('./rewardsCalculatorService');

describe('Rewards Calculator Service - Mathematical Engine', () => {

  describe('Standard Compound Interest Calculations', () => {
    test('calculates 1-year annual compounding accurately (P=1000, APY=10%, 1 year, annually)', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 10,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'annually'
      });

      expect(result.principal).toBe(1000);
      expect(result.projectedBalance).toBeCloseTo(1100, 2);
      expect(result.totalRewards).toBeCloseTo(100, 2);
      expect(result.effectiveApy).toBeCloseTo(10, 2);
      expect(result.normalizedDurationYears).toBe(1);
    });

    test('calculates 1-year daily compounding accurately (P=1000, APY=5%, 365 days, daily)', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 5,
        duration: 365,
        durationUnit: 'days',
        compoundingFrequency: 'daily'
      });

      // A = 1000 * (1 + 0.05 / 365)^365 ≈ 1051.27
      expect(result.projectedBalance).toBeCloseTo(1051.27, 2);
      expect(result.totalRewards).toBeCloseTo(51.27, 2);
      expect(result.effectiveApy).toBeCloseTo(5.127, 3);
      expect(result.normalizedDurationYears).toBe(1);
    });

    test('calculates monthly compounding accurately (P=1000, APY=12%, 1 year, monthly)', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 12,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'monthly'
      });

      // A = 1000 * (1 + 0.12 / 12)^12 = 1000 * (1.01)^12 ≈ 1126.83
      expect(result.projectedBalance).toBeCloseTo(1126.83, 2);
      expect(result.totalRewards).toBeCloseTo(126.83, 2);
      expect(result.effectiveApy).toBeCloseTo(12.68, 2);
    });

    test('calculates weekly compounding accurately (P=1000, APY=5.2%, 1 year, weekly)', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 5.2,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'weekly'
      });

      // A = 1000 * (1 + 0.052 / 52)^52 = 1000 * (1.001)^52 ≈ 1053.35
      expect(result.projectedBalance).toBeCloseTo(1053.35, 2);
      expect(result.totalRewards).toBeCloseTo(53.35, 2);
    });
  });

  describe('Fractional Durations', () => {
    test('supports 1.5 years duration (annual compounding)', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 10,
        duration: 1.5,
        durationUnit: 'years',
        compoundingFrequency: 'annually'
      });

      // A = 1000 * (1 + 0.1)^1.5 ≈ 1153.69
      expect(result.normalizedDurationYears).toBe(1.5);
      expect(result.projectedBalance).toBeCloseTo(1153.69, 2);
      expect(result.totalRewards).toBeCloseTo(153.69, 2);
    });

    test('supports fractional days duration (e.g. 182.5 days ≈ 0.5 years)', () => {
      const result = calculateRewards({
        principal: 2000,
        apy: 8,
        duration: 182.5,
        durationUnit: 'days',
        compoundingFrequency: 'daily'
      });

      expect(result.normalizedDurationYears).toBe(0.5);
      expect(result.projectedBalance).toBeGreaterThan(2000);
      expect(result.totalRewards).toBeGreaterThan(0);
    });
  });

  describe('Zero APY & Boundary Values', () => {
    test('handles zero APY cleanly with zero rewards and unchanged balance', () => {
      const result = calculateRewards({
        principal: 5000,
        apy: 0,
        duration: 2,
        durationUnit: 'years',
        compoundingFrequency: 'daily'
      });

      expect(result.projectedBalance).toBe(5000);
      expect(result.totalRewards).toBe(0);
      expect(result.effectiveApy).toBe(0);
    });

    test('handles small fractional principal (e.g. 0.005 tokens)', () => {
      const result = calculateRewards({
        principal: 0.005,
        apy: 10,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'monthly'
      });

      expect(result.projectedBalance).toBeGreaterThan(0.005);
      expect(result.totalRewards).toBeGreaterThan(0);
    });
  });

  describe('USD Projections', () => {
    test('correctly calculates USD balance and rewards when tokenPrice is supplied', () => {
      const tokenPrice = 2.5;
      const result = calculateRewards({
        principal: 1000,
        apy: 10,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'annually',
        tokenPrice
      });

      expect(result.tokenPrice).toBe(2.5);
      expect(result.projectedBalanceUsd).toBeCloseTo(1100 * tokenPrice, 2);
      expect(result.totalRewardsUsd).toBeCloseTo(100 * tokenPrice, 2);
    });

    test('omits USD fields when tokenPrice is not supplied', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 5,
        duration: 365,
        durationUnit: 'days',
        compoundingFrequency: 'daily'
      });

      expect(result.tokenPrice).toBeUndefined();
      expect(result.projectedBalanceUsd).toBeUndefined();
      expect(result.totalRewardsUsd).toBeUndefined();
    });
  });

  describe('Growth Chart Time-Series Dataset', () => {
    test('generates valid time series with correct starting and ending points', () => {
      const result = calculateRewards({
        principal: 1000,
        apy: 10,
        duration: 365,
        durationUnit: 'days',
        compoundingFrequency: 'daily'
      });

      expect(Array.isArray(result.chartData)).toBe(true);
      expect(result.chartData.length).toBeGreaterThan(1);

      const firstPoint = result.chartData[0];
      const lastPoint = result.chartData[result.chartData.length - 1];

      // Starting point: balance = principal, rewards = 0
      expect(firstPoint.step).toBe(0);
      expect(firstPoint.balance).toBe(1000);
      expect(firstPoint.rewards).toBe(0);

      // Final point: balance = projectedBalance, rewards = totalRewards
      expect(lastPoint.balance).toBeCloseTo(result.projectedBalance, 2);
      expect(lastPoint.rewards).toBeCloseTo(result.totalRewards, 2);
    });

    test('time-series is monotonically increasing over time', () => {
      const result = calculateRewards({
        principal: 500,
        apy: 15,
        duration: 2,
        durationUnit: 'years',
        compoundingFrequency: 'weekly'
      });

      for (let i = 1; i < result.chartData.length; i++) {
        expect(result.chartData[i].balance).toBeGreaterThanOrEqual(result.chartData[i - 1].balance);
        expect(result.chartData[i].rewards).toBeGreaterThanOrEqual(result.chartData[i - 1].rewards);
      }
    });

    test('includes USD values in chart points when tokenPrice is provided', () => {
      const result = calculateRewards({
        principal: 100,
        apy: 10,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'monthly',
        tokenPrice: 5.0
      });

      const lastPoint = result.chartData[result.chartData.length - 1];
      expect(lastPoint.balanceUsd).toBeCloseTo(lastPoint.balance * 5.0, 2);
      expect(lastPoint.rewardsUsd).toBeCloseTo(lastPoint.rewards * 5.0, 2);
    });
  });

  describe('Validation & Error Rejection', () => {
    test('rejects negative principal', () => {
      expect(() => {
        calculateRewards({
          principal: -100,
          apy: 5,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects zero principal', () => {
      expect(() => {
        calculateRewards({
          principal: 0,
          apy: 5,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects negative APY', () => {
      expect(() => {
        calculateRewards({
          principal: 1000,
          apy: -2,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects zero or negative duration', () => {
      expect(() => {
        calculateRewards({
          principal: 1000,
          apy: 5,
          duration: 0,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects invalid compounding frequency', () => {
      expect(() => {
        calculateRewards({
          principal: 1000,
          apy: 5,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'hourly' // unsupported
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects invalid duration unit', () => {
      expect(() => {
        calculateRewards({
          principal: 1000,
          apy: 5,
          duration: 12,
          durationUnit: 'months', // only days and years allowed
          compoundingFrequency: 'daily'
        });
      }).toThrow('Invalid calculation parameters.');
    });

    test('rejects negative token price', () => {
      expect(() => {
        calculateRewards({
          principal: 1000,
          apy: 5,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily',
          tokenPrice: -10
        });
      }).toThrow('Invalid calculation parameters.');
    });
  });
});
