import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, useTheme, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TollIcon from '@mui/icons-material/Toll';
import { ChartDataPoint } from '../../types/calculator';

interface GrowthChartProps {
  data: ChartDataPoint[];
  hasUsd: boolean;
  tokenSymbol?: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  hasUsd,
  tokenSymbol = 'TOKENS'
}) => {
  const theme = useTheme();
  const [currencyMode, setCurrencyMode] = useState<'token' | 'usd'>('token');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDarkMode = theme.palette.mode === 'dark';

  // SVG coordinate system dimensions
  const width = 720;
  const height = 300;
  const padding = { top: 30, right: 35, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Extracted values depending on token vs usd
  const isUsd = currencyMode === 'usd' && hasUsd;

  const { minVal, maxVal, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minVal: 0, maxVal: 100, points: [] };
    }

    const values = data.map((d) => (isUsd && d.balanceUsd !== undefined ? d.balanceUsd : d.balance));
    const minRaw = Math.min(...values);
    const maxRaw = Math.max(...values);
    const margin = (maxRaw - minRaw) * 0.1 || (maxRaw * 0.1) || 10;
    const min = Math.max(0, minRaw - margin);
    const max = maxRaw + margin;

    const computedPoints = data.map((d, index) => {
      const val = isUsd && d.balanceUsd !== undefined ? d.balanceUsd : d.balance;
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((val - min) / (max - min || 1)) * chartHeight;
      return { x, y, raw: d, val };
    });

    return { minVal: min, maxVal: max, points: computedPoints };
  }, [data, isUsd, chartWidth, chartHeight, padding.left, padding.top]);

  // Construct SVG Path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    const lineCommands = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const bottomY = padding.top + chartHeight;
    const firstX = points[0].x.toFixed(2);
    const lastX = points[points.length - 1].x.toFixed(2);
    const areaCommands = `${lineCommands} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: lineCommands, areaPath: areaCommands };
  }, [points, padding.top, chartHeight]);

  // Handle pointer interactions
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    // Find closest data point
    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[points.length - 1];

  // Grid tick lines (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = minVal + pct * (maxVal - minVal);
    const y = padding.top + chartHeight - pct * chartHeight;
    return { val, y };
  });

  const axisTextColor = isDarkMode ? '#a0aec0' : '#64748b';
  const gridLineColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Box
      sx={{
        background: isDarkMode ? '#132228' : '#ffffff',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(0,219,227,0.2)' : 'rgba(0,219,227,0.3)'}`,
        p: { xs: 2, sm: 3 },
        boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,219,227,0.08)',
        position: 'relative'
      }}
    >
      {/* Chart Header with Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChartIcon sx={{ color: '#00dbe3', fontSize: '26px' }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '18px', sm: '20px' },
              color: isDarkMode ? '#ffffff' : '#173039'
            }}
          >
            Projected Balance Growth
          </Typography>
        </Box>

        {hasUsd && (
          <ToggleButtonGroup
            size="small"
            value={currencyMode}
            exclusive
            onChange={(_, val) => val && setCurrencyMode(val)}
            sx={{
              '& .MuiToggleButton-root': {
                py: 0.5,
                px: 1.5,
                fontSize: '12px',
                fontWeight: 600,
                color: isDarkMode ? '#cbd5e1' : '#173039',
                borderColor: '#00dbe3',
                '&.Mui-selected': {
                  backgroundColor: '#00dbe3',
                  color: '#173039',
                  '&:hover': {
                    backgroundColor: '#00c4cb'
                  }
                }
              }
            }}
          >
            <ToggleButton value="token">
              <TollIcon sx={{ fontSize: '15px', mr: 0.5 }} />
              {tokenSymbol}
            </ToggleButton>
            <ToggleButton value="usd">
              <AttachMoneyIcon sx={{ fontSize: '15px', mr: 0.2 }} />
              USD
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* SVG Canvas */}
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00dbe3" stopOpacity={isDarkMode ? 0.45 : 0.35} />
              <stop offset="60%" stopColor="#23a2bb" stopOpacity={isDarkMode ? 0.15 : 0.1} />
              <stop offset="100%" stopColor="#23a2bb" stopOpacity={0.0} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00dbe3" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke={gridLineColor}
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill={axisTextColor}
                fontFamily="sans-serif"
              >
                {isUsd ? `$${tick.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : tick.val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}

          {/* X Axis Bottom Line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke={gridLineColor}
          />

          {/* X Axis Labels (First, Middle, Last) */}
          {points.length > 0 && (
            <>
              <text
                x={points[0].x}
                y={height - 15}
                textAnchor="start"
                fontSize="11"
                fill={axisTextColor}
              >
                {points[0].raw.timeLabel}
              </text>
              <text
                x={points[Math.floor(points.length / 2)].x}
                y={height - 15}
                textAnchor="middle"
                fontSize="11"
                fill={axisTextColor}
              >
                {points[Math.floor(points.length / 2)].raw.timeLabel}
              </text>
              <text
                x={points[points.length - 1].x}
                y={height - 15}
                textAnchor="end"
                fontSize="11"
                fill={axisTextColor}
              >
                {points[points.length - 1].raw.timeLabel}
              </text>
            </>
          )}

          {/* Filled Area */}
          {areaPath && <path d={areaPath} fill="url(#growthAreaGradient)" />}

          {/* Stroke Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#00dbe3"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {/* Hover Crosshair & Indicator */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + chartHeight}
                stroke="#00dbe3"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#173039"
                stroke="#00dbe3"
                strokeWidth="3"
                filter="url(#glow)"
              />
            </g>
          )}
        </svg>
      </Box>

      {/* Floating Active Point Tooltip Bar */}
      {activePoint && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            fontSize: '13px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#00dbe3'
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' }}>
              {activePoint.raw.timeLabel}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: axisTextColor, display: 'block' }}>
                Balance
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#00dbe3' }}>
                {isUsd
                  ? `$${(activePoint.raw.balanceUsd ?? activePoint.val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${activePoint.raw.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${tokenSymbol}`}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: axisTextColor, display: 'block' }}>
                Rewards Earned
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2dd8c8' }}>
                +{isUsd
                  ? `$${(activePoint.raw.rewardsUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${activePoint.raw.rewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${tokenSymbol}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GrowthChart;

