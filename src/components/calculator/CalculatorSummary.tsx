import React from 'react';
import { Box, Typography, Grid, Paper, useTheme, Skeleton, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import SavingsIcon from '@mui/icons-material/Savings';
import { CalculateRewardsResult } from '../../types/calculator';

interface CalculatorSummaryProps {
  result: CalculateRewardsResult | null;
  loading: boolean;
  tokenSymbol?: string;
}

export const CalculatorSummary: React.FC<CalculatorSummaryProps> = ({
  result,
  loading,
  tokenSymbol = 'TOKENS'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const cardBg = isDarkMode ? '#132228' : '#ffffff';
  const cardBorder = isDarkMode ? 'rgba(0, 219, 227, 0.2)' : 'rgba(0, 219, 227, 0.3)';

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper
              sx={{
                p: 2.5,
                background: cardBg,
                borderRadius: '12px',
                border: `1px solid ${cardBorder}`
              }}
            >
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={38} />
              <Skeleton variant="text" width="40%" height={20} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!result) return null;

  const hasUsd = typeof result.tokenPrice === 'number' && result.projectedBalanceUsd !== undefined;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* 1. Projected Final Balance */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: '100%',
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,219,227,0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Projected Balance
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 219, 227, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00dbe3'
              }}
            >
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#173039',
              fontSize: { xs: '20px', md: '22px' }
            }}
          >
            {result.projectedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <Typography component="span" sx={{ fontSize: '14px', ml: 0.5, color: '#00dbe3', fontWeight: 600 }}>
              {tokenSymbol}
            </Typography>
          </Typography>
          {hasUsd && (
            <Typography variant="body2" sx={{ color: '#2dd8c8', fontWeight: 600, mt: 0.5 }}>
              ≈ ${result.projectedBalanceUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* 2. Total Rewards Earned */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: '100%',
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,219,227,0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Rewards
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: 'rgba(45, 216, 200, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2dd8c8'
              }}
            >
              <TrendingUpIcon fontSize="small" />
            </Box>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#00dbe3',
              fontSize: { xs: '20px', md: '22px' }
            }}
          >
            +{result.totalRewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <Typography component="span" sx={{ fontSize: '14px', ml: 0.5, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              {tokenSymbol}
            </Typography>
          </Typography>
          {hasUsd && (
            <Typography variant="body2" sx={{ color: '#2dd8c8', fontWeight: 600, mt: 0.5 }}>
              ≈ +${result.totalRewardsUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* 3. Effective APY */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: '100%',
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,219,227,0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Effective APY
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: 'rgba(35, 162, 187, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#23a2bb'
              }}
            >
              <PercentIcon fontSize="small" />
            </Box>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#173039',
              fontSize: { xs: '20px', md: '22px' }
            }}
          >
            {result.effectiveApy.toFixed(2)}%
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={`${result.compoundingFrequency.toUpperCase()} COMPOUNDING`}
              size="small"
              sx={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'rgba(0, 219, 227, 0.15)',
                color: '#00dbe3',
                height: '20px'
              }}
            />
          </Box>
        </Paper>
      </Grid>

      {/* 4. Principal Staked */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: '100%',
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,219,227,0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Staked Principal
            </Typography>
            <Box
              width={32}
              height={32}
              borderRadius="8px"
              sx={{
                backgroundColor: 'rgba(23, 48, 57, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#173039'
              }}
            >
              <SavingsIcon fontSize="small" />
            </Box>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#173039',
              fontSize: { xs: '20px', md: '22px' }
            }}
          >
            {result.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <Typography component="span" sx={{ fontSize: '14px', ml: 0.5, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              {tokenSymbol}
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', mt: 0.5 }}>
            Period: {result.duration} {result.durationUnit} ({result.normalizedDurationYears}y)
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CalculatorSummary;

