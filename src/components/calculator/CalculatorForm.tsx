import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid,
  Button,
  Slider,
  useTheme,
  FormHelperText
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CalculateRewardsRequest, CompoundingFrequency, DurationUnit } from '../../types/calculator';

interface FormErrors {
  principal?: string;
  apy?: string;
  duration?: string;
  tokenPrice?: string;
}

interface CalculatorFormProps {
  formData: CalculateRewardsRequest;
  errors: FormErrors;
  loading: boolean;
  onChange: (field: keyof CalculateRewardsRequest, value: any) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onReset: () => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  formData,
  errors,
  loading,
  onChange,
  onSubmit,
  onReset
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const inputBorderColor = isDarkMode ? 'rgba(0, 219, 227, 0.4)' : '#00dbe3';

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : '#cbd5e1'
      },
      '&:hover fieldset': {
        borderColor: inputBorderColor
      },
      '&.Mui-focused fieldset': {
        borderColor: '#00dbe3'
      }
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#00dbe3'
    }
  };

  const handleDurationPreset = (val: number, unit: DurationUnit) => {
    onChange('duration', val);
    onChange('durationUnit', unit);
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      sx={{
        background: isDarkMode ? '#132228' : '#ffffff',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(0,219,227,0.2)' : 'rgba(0,219,227,0.3)'}`,
        p: { xs: 2.5, sm: 3 },
        boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,219,227,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '18px',
            color: isDarkMode ? '#ffffff' : '#173039',
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CalculateIcon sx={{ color: '#00dbe3' }} />
          Staking Parameters
        </Typography>

        <Grid container spacing={2.5}>
          {/* 1. Principal Amount */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Principal Amount"
              type="number"
              value={formData.principal || ''}
              onChange={(e) => onChange('principal', e.target.value === '' ? '' : parseFloat(e.target.value))}
              error={!!errors.principal}
              helperText={errors.principal || 'Tokens to commit to staking'}
              InputProps={{
                endAdornment: <InputAdornment position="end">TOKENS</InputAdornment>
              }}
              inputProps={{ min: 0.000001, step: 'any' }}
              sx={inputStyle}
            />
          </Grid>

          {/* 2. Annual Percentage Yield (APY) */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                Annual Percentage Yield (APY)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#00dbe3' }}>
                {formData.apy}%
              </Typography>
            </Box>
            <Slider
              value={typeof formData.apy === 'number' ? formData.apy : 0}
              min={0}
              max={100}
              step={0.1}
              onChange={(_, val) => onChange('apy', val as number)}
              sx={{
                color: '#00dbe3',
                mb: 1,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(0, 219, 227, 0.16)'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              value={formData.apy ?? ''}
              onChange={(e) => onChange('apy', e.target.value === '' ? '' : parseFloat(e.target.value))}
              error={!!errors.apy}
              helperText={errors.apy || 'Nominal rate per annum'}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ min: 0, max: 10000, step: 0.1 }}
              sx={inputStyle}
            />
          </Grid>

          {/* 3. Duration & Unit */}
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              label="Staking Duration"
              type="number"
              value={formData.duration || ''}
              onChange={(e) => onChange('duration', e.target.value === '' ? '' : parseFloat(e.target.value))}
              error={!!errors.duration}
              helperText={errors.duration}
              inputProps={{ min: 0.01, step: 'any' }}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth sx={inputStyle}>
              <InputLabel id="duration-unit-label">Unit</InputLabel>
              <Select
                labelId="duration-unit-label"
                value={formData.durationUnit}
                label="Unit"
                onChange={(e) => onChange('durationUnit', e.target.value as DurationUnit)}
              >
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="years">Years</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Duration Presets */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { label: '30D', val: 30, unit: 'days' as DurationUnit },
                { label: '90D', val: 90, unit: 'days' as DurationUnit },
                { label: '180D', val: 180, unit: 'days' as DurationUnit },
                { label: '1 Year', val: 365, unit: 'days' as DurationUnit },
                { label: '1.5 Y', val: 1.5, unit: 'years' as DurationUnit },
                { label: '2 Years', val: 2, unit: 'years' as DurationUnit }
              ].map((preset) => {
                const isActive = formData.duration === preset.val && formData.durationUnit === preset.unit;
                return (
                  <Button
                    key={preset.label}
                    size="small"
                    variant={isActive ? 'contained' : 'outlined'}
                    onClick={() => handleDurationPreset(preset.val, preset.unit)}
                    sx={{
                      fontSize: '11px',
                      fontWeight: 700,
                      py: 0.4,
                      px: 1.2,
                      minWidth: 'auto',
                      borderRadius: '6px',
                      borderColor: '#00dbe3',
                      color: isActive ? '#173039' : '#00dbe3',
                      backgroundColor: isActive ? '#00dbe3' : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive ? '#00c4cb' : 'rgba(0, 219, 227, 0.08)',
                        borderColor: '#00dbe3'
                      }
                    }}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </Box>
          </Grid>

          {/* 4. Compounding Frequency */}
          <Grid item xs={12}>
            <FormControl fullWidth sx={inputStyle}>
              <InputLabel id="frequency-label">Compounding Frequency</InputLabel>
              <Select
                labelId="frequency-label"
                value={formData.compoundingFrequency}
                label="Compounding Frequency"
                onChange={(e) => onChange('compoundingFrequency', e.target.value as CompoundingFrequency)}
              >
                <MenuItem value="daily">Daily (365 times / year)</MenuItem>
                <MenuItem value="weekly">Weekly (52 times / year)</MenuItem>
                <MenuItem value="monthly">Monthly (12 times / year)</MenuItem>
                <MenuItem value="annually">Annually (1 time / year)</MenuItem>
              </Select>
              <FormHelperText>Calculates compound interest periodically</FormHelperText>
            </FormControl>
          </Grid>

          {/* 5. Optional Token Price */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Token Price (USD, Optional)"
              type="number"
              value={formData.tokenPrice ?? ''}
              onChange={(e) => onChange('tokenPrice', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              error={!!errors.tokenPrice}
              helperText={errors.tokenPrice || 'Provide to view projections in USD'}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">USD</InputAdornment>
              }}
              inputProps={{ min: 0, step: 'any' }}
              sx={inputStyle}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 3, pt: 2, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            backgroundColor: '#00dbe3',
            color: '#173039',
            fontWeight: 700,
            height: '46px',
            fontSize: '15px',
            borderRadius: '8px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#00c4cb'
            }
          }}
        >
          {loading ? 'Calculating...' : 'Recalculate'}
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={onReset}
          disabled={loading}
          sx={{
            borderColor: '#cbd5e1',
            color: isDarkMode ? '#cbd5e1' : '#64748b',
            minWidth: '46px',
            height: '46px',
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#00dbe3',
              color: '#00dbe3'
            }
          }}
        >
          <RefreshIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};

export default CalculatorForm;
