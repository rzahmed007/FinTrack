import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import type { CategoryBreakdownItem, YearlyMonthRow } from '@/utils/calculations';
import { formatINR } from '@/utils/currency';

function useGrayscalePalette() {
  const { theme } = useTheme();
  if (theme === 'dark') {
    return {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      tertiary: '#737373',
      grid: '#2A2A2A',
      axis: '#A3A3A3',
      tooltipBg: '#171717',
      tooltipBorder: '#303030',
      tooltipText: '#FFFFFF',
      slices: ['#FFFFFF', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#383838'],
    };
  }
  return {
    primary: '#000000',
    secondary: '#525252',
    tertiary: '#A3A3A3',
    grid: '#E5E5E5',
    axis: '#737373',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E5E5E5',
    tooltipText: '#171717',
    slices: ['#000000', '#333333', '#666666', '#8C8C8C', '#B3B3B3', '#D9D9D9'],
  };
}

export function SpendingTrendChart({
  data,
  hideBalances = false,
}: {
  data: Array<{ day: number; label: string; expensePaise: number; incomePaise: number }>;
  hideBalances?: boolean;
}) {
  const palette = useGrayscalePalette();

  const chartData = data.map((d) => ({
    label: d.label,
    expense: d.expensePaise,
    income: d.incomePaise,
  }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ftExpenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={palette.primary} stopOpacity={0.22} />
            <stop offset="95%" stopColor={palette.primary} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: palette.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tick={{ fill: palette.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) =>
            hideBalances ? '••' : formatINR(v, { compact: true })
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            borderColor: palette.tooltipBorder,
            borderRadius: '14px',
            color: palette.tooltipText,
            fontSize: '12px',
          }}
          formatter={(value) => [
            formatINR(Number(value ?? 0), { hideValue: hideBalances }),
            'Spent',
          ]}
          labelFormatter={(label) => `Day ${String(label)}`}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke={palette.primary}
          strokeWidth={2}
          fill="url(#ftExpenseGrad)"
          activeDot={{ r: 4, fill: palette.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({
  items,
  hideBalances = false,
}: {
  items: CategoryBreakdownItem[];
  hideBalances?: boolean;
}) {
  const palette = useGrayscalePalette();
  const topItems = items.slice(0, 6);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topItems}
              dataKey="totalPaise"
              nameKey="categoryName"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {topItems.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={palette.slices[idx % palette.slices.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                borderColor: palette.tooltipBorder,
                borderRadius: '14px',
                color: palette.tooltipText,
                fontSize: '12px',
              }}
              formatter={(value) =>
                formatINR(Number(value ?? 0), { hideValue: hideBalances })
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-2 text-xs">
        {topItems.map((item, idx) => (
          <li
            key={item.categoryId}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: palette.slices[idx % palette.slices.length],
                }}
              />
              <span className="truncate font-medium text-foreground">
                {item.categoryName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="font-bold text-foreground">
                {formatINR(item.totalPaise, { hideValue: hideBalances })}
              </span>
              <span className="text-muted-foreground w-10 text-right">
                {item.percentage}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function IncomeVsExpenseBarChart({
  months,
  hideBalances = false,
}: {
  months: YearlyMonthRow[];
  hideBalances?: boolean;
}) {
  const palette = useGrayscalePalette();

  const data = months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    income: m.incomePaise,
    expenses: m.expensesPaise,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: palette.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: palette.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) =>
            hideBalances ? '••' : formatINR(v, { compact: true })
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            borderColor: palette.tooltipBorder,
            borderRadius: '14px',
            color: palette.tooltipText,
            fontSize: '12px',
          }}
          formatter={(value, name) => [
            formatINR(Number(value ?? 0), { hideValue: hideBalances }),
            name === 'income' ? 'Income' : 'Expenses',
          ]}
        />
        <Bar
          dataKey="income"
          fill={palette.primary}
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="expenses"
          fill={palette.tertiary}
          radius={[6, 6, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
