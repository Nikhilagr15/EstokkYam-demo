const http = require('http');
const axios = require('axios');
const app = require('../../server');

describe('API Integration - POST /api/calculate-rewards', () => {
  let server;
  let baseURL;

  beforeAll((done) => {
    // Start temporary test server on random available port
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseURL = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Success Cases (200 OK)', () => {
    test('successfully calculates rewards for standard request', async () => {
      const payload = {
        principal: 1000,
        apy: 5,
        duration: 365,
        durationUnit: 'days',
        compoundingFrequency: 'daily'
      };

      const response = await axios.post(`${baseURL}/api/calculate-rewards`, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const data = response.data.data;
      expect(data.principal).toBe(1000);
      expect(data.apy).toBe(5);
      expect(data.compoundingFrequency).toBe('daily');
      expect(data.compoundingPeriodsPerYear).toBe(365);
      expect(data.projectedBalance).toBeCloseTo(1051.27, 2);
      expect(data.totalRewards).toBeCloseTo(51.27, 2);
      expect(data.effectiveApy).toBeCloseTo(5.127, 2);
      expect(Array.isArray(data.chartData)).toBe(true);
      expect(data.chartData.length).toBeGreaterThan(0);
    });

    test('successfully calculates USD valuations when tokenPrice is supplied', async () => {
      const payload = {
        principal: 2000,
        apy: 10,
        duration: 1,
        durationUnit: 'years',
        compoundingFrequency: 'annually',
        tokenPrice: 2.5
      };

      const response = await axios.post(`${baseURL}/api/calculate-rewards`, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const data = response.data.data;
      expect(data.projectedBalance).toBeCloseTo(2200, 2);
      expect(data.totalRewards).toBeCloseTo(200, 2);
      expect(data.projectedBalanceUsd).toBeCloseTo(2200 * 2.5, 2);
      expect(data.totalRewardsUsd).toBeCloseTo(200 * 2.5, 2);
    });

    test('handles numeric strings gracefully by coercing them to numbers', async () => {
      const payload = {
        principal: '500',
        apy: '8',
        duration: '180',
        durationUnit: 'days',
        compoundingFrequency: 'weekly',
        tokenPrice: '1.25'
      };

      const response = await axios.post(`${baseURL}/api/calculate-rewards`, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.principal).toBe(500);
      expect(response.data.data.apy).toBe(8);
      expect(response.data.data.tokenPrice).toBe(1.25);
    });
  });

  describe('Validation & Error Handling (400 Bad Request)', () => {
    test('returns 400 when principal is missing or <= 0', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: -50,
          apy: 5,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.error).toBe('Validation Error');
        expect(err.response.data.details.some(d => d.includes('Principal'))).toBe(true);
      }
    });

    test('returns 400 when APY is negative', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: 1000,
          apy: -1,
          duration: 365,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.details.some(d => d.includes('APY'))).toBe(true);
      }
    });

    test('returns 400 when duration is 0 or negative', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: 1000,
          apy: 5,
          duration: 0,
          durationUnit: 'days',
          compoundingFrequency: 'daily'
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.details.some(d => d.includes('Duration'))).toBe(true);
      }
    });

    test('returns 400 when compoundingFrequency is unsupported', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: 1000,
          apy: 5,
          duration: 1,
          durationUnit: 'years',
          compoundingFrequency: 'per-second'
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.details.some(d => d.includes('Compounding frequency'))).toBe(true);
      }
    });

    test('returns 400 when durationUnit is unsupported', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: 1000,
          apy: 5,
          duration: 6,
          durationUnit: 'centuries',
          compoundingFrequency: 'monthly'
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.details.some(d => d.includes('Duration unit'))).toBe(true);
      }
    });

    test('returns 400 when tokenPrice is negative', async () => {
      try {
        await axios.post(`${baseURL}/api/calculate-rewards`, {
          principal: 1000,
          apy: 5,
          duration: 1,
          durationUnit: 'years',
          compoundingFrequency: 'daily',
          tokenPrice: -5.0
        });
        throw new Error('Expected request to fail with 400');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.success).toBe(false);
        expect(err.response.data.details.some(d => d.includes('Token price'))).toBe(true);
      }
    });
  });
});

