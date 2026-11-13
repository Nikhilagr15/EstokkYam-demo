import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Alert, AlertTitle, Grid, useTheme } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { CalculateRewardsRequest, CalculateRewardsResult } from '../../types/calculator';
import { calculateRewardsApi } from '../../services/calculatorApi';
import CalculatorForm from './CalculatorForm';
import CalculatorSummary from './CalculatorSummary';
import GrowthChart from './GrowthChart';

const INITIAL_FORM_DATA: CalculateRewardsRequest = {
  principal: 1000,
  apy: 8.5,
  duration: 365,
  durationUnit: 'days',
  compoundingFrequency: 'daily',
  tokenPrice: 2.0
};

interface FormErrors {
  principal?: string;
  apy?: string;
  duration?: string;
  tokenPrice?: string;
}

export const RewardsCalculator: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState<CalculateRewardsRequest>(INITIAL_FORM_DATA);
  const [result, setResult] = useState<CalculateRewardsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Validate form client-side before dispatching
  const validate = useCallback((data: CalculateRewardsRequest): boolean => {
    const newErrors: FormErrors = {};

    if (data.principal === undefined || data.principal === null || isNaN(data.principal) || data.principal <= 0) {
      newErrors.principal = 'Principal must be greater than 0.';
    }

    if (data.apy === undefined || data.apy === null || isNaN(data.apy) || data.apy < 0) {
      newErrors.apy = 'APY cannot be negative.';
    }

    if (data.duration === undefined || data.duration === null || isNaN(data.duration) || data.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0.';
    }

    if (data.tokenPrice !== undefined && (isNaN(data.tokenPrice) || data.tokenPrice < 0)) {
      newErrors.tokenPrice = 'Token price cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Execute API calculation
  const runCalculation = useCallback(
    async (payload: CalculateRewardsRequest) => {
      if (!validate(payload)) return;

      setLoading(true);
      setApiError(null);

      try {
        const data = await calculateRewardsApi(payload);
        setResult(data);
      } catch (err: any) {
        setApiError(err.message || 'Failed to calculate rewards. Please verify inputs.');
      } finally {
        setLoading(false);
      }
    },
    [validate]
  );

  // Initial load calculation and cleanup
  useEffect(() => {
    runCalculation(INITIAL_FORM_DATA);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [runCalculation]);

  // Handle controlled input changes with debounced automatic recalculation
  const handleFieldChange = (field: keyof CalculateRewardsRequest, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Debounce auto-recalculate (500ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        runCalculation(updated);
      }, 500);

      return updated;
    });
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    runCalculation(formData);
  };

  const handleReset = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    runCalculation(INITIAL_FORM_DATA);
  };

  return (
    <Box
      sx={{
        width: '100%',
        my: 4,
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(23, 48, 57, 0.95) 0%, rgba(13, 30, 36, 0.95) 100%)'
          : 'linear-gradient(180deg, #f8fcfd 0%, #edf8fa 100%)',
        borderRadius: '16px',
        border: `1.5px solid ${isDarkMode ? 'rgba(0, 219, 227, 0.25)' : 'rgba(0, 219, 227, 0.35)'}`,
        boxShadow: isDarkMode ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,219,227,0.1)',
        p: { xs: 2.5, sm: 4 },
        transition: 'all 0.3s ease'
      }}
    >
      {/* Widget Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00dbe3, #23a2bb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 219, 227, 0.35)'
            }}
          >
            <AccountBalanceIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '20px', sm: '24px' },
                color: isDarkMode ? '#ffffff' : '#173039',
                letterSpacing: '-0.5px'
              }}
            >
              Staking & Yield Rewards Calculator
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? '#94a3b8' : '#64748b',
                fontSize: '13px'
              }}
            >
              Simulate compound growth, effective APY, and real-time yield trajectories
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Global Error Banner */}
      {apiError && (
        <Alert
          severity="error"
          onClose={() => setApiError(null)}
          sx={{ mb: 3, borderRadius: '8px' }}
        >
          <AlertTitle>Calculation Error</AlertTitle>
          {apiError}
        </Alert>
      )}

      {/* Metric Stat Cards */}
      <CalculatorSummary
        result={result}
        loading={loading && !result}
        tokenSymbol="TOKENS"
      />

      {/* Main 2-Column Responsive Layout */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Form Inputs (Left Column on Desktop, Full Width on Mobile) */}
        <Grid item xs={12} md={5} lg={4}>
          <CalculatorForm
            formData={formData}
            errors={errors}
            loading={loading}
            onChange={handleFieldChange}
            onSubmit={handleManualSubmit}
            onReset={handleReset}
          />
        </Grid>

        {/* Interactive Growth Chart (Right Column on Desktop, Full Width on Mobile) */}
        <Grid item xs={12} md={7} lg={8}>
          <GrowthChart
            data={result?.chartData || []}
            hasUsd={result?.projectedBalanceUsd !== undefined}
            tokenSymbol="TOKENS"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RewardsCalculator;
