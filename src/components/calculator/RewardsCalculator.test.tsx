import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import RewardsCalculator from './RewardsCalculator';
import { calculateRewardsApi } from '../../services/calculatorApi';

jest.mock('../../services/calculatorApi', () => ({
  calculateRewardsApi: jest.fn()
}));

const mockApi = calculateRewardsApi as jest.Mock;

describe('RewardsCalculator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.mockResolvedValue({
      principal: 1000,
      apy: 8.5,
      effectiveApy: 8.87,
      duration: 365,
      durationUnit: 'days',
      normalizedDurationYears: 1,
      compoundingFrequency: 'daily',
      compoundingPeriodsPerYear: 365,
      projectedBalance: 1088.71,
      totalRewards: 88.71,
      tokenPrice: 2.0,
      projectedBalanceUsd: 2177.42,
      totalRewardsUsd: 177.42,
      chartData: [
        { step: 0, timeLabel: 'Day 0', timeInYears: 0, balance: 1000, rewards: 0, balanceUsd: 2000, rewardsUsd: 0 },
        { step: 1, timeLabel: 'Day 365', timeInYears: 1, balance: 1088.71, rewards: 88.71, balanceUsd: 2177.42, rewardsUsd: 177.42 }
      ]
    });
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <RewardsCalculator />
      </ThemeProvider>
    );
  };

  test('renders widget title, inputs, presets and chart title', async () => {
    renderComponent();

    expect(screen.getByText(/Staking & Yield Rewards Calculator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Principal Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Staking Duration/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Compounding Frequency/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Projected Balance Growth/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledTimes(1);
    });
  });

  test('displays calculated balance and rewards stat cards on load', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/8\.87%/)).toBeInTheDocument();
      expect(screen.getByText(/Staking Parameters/i)).toBeInTheDocument();
    });
  });

  test('validates invalid principal and shows error message', async () => {
    renderComponent();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/8\.87%/)).toBeInTheDocument();
    });

    const principalInput = screen.getByLabelText(/Principal Amount/i);
    fireEvent.change(principalInput, { target: { value: '-10' } });

    const recalculateButton = await screen.findByRole('button', { name: /Recalculate/i });
    fireEvent.click(recalculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Principal must be greater than 0/i)).toBeInTheDocument();
    });
  });

  test('clicking duration preset button updates duration', async () => {
    renderComponent();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/8\.87%/)).toBeInTheDocument();
    });

    const preset180D = screen.getByRole('button', { name: /180D/i });
    fireEvent.click(preset180D);

    const durationInput = screen.getByLabelText(/Staking Duration/i) as HTMLInputElement;
    expect(durationInput.value).toBe('180');
  });

  test('renders graceful error alert when API call fails', async () => {
    mockApi.mockRejectedValueOnce(
      new Error('Network error connecting to calculation server.')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Network error connecting to calculation server/i)).toBeInTheDocument();
    });
  });
});
