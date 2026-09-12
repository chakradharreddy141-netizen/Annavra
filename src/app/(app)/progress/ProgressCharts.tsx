"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';

export function WeightChart({ data }: { data: { date: string, weight: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-[#6b7280] py-8 text-center">No weight data available yet.</div>;
  }

  // Format date for X-axis (e.g. "Sep 12")
  const formattedData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })).reverse(); // chronological order

  // Find min/max for Y-axis scaling
  const weights = data.map(d => d.weight);
  const minWeight = Math.floor(Math.min(...weights) - 2);
  const maxWeight = Math.ceil(Math.max(...weights) + 2);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232738" vertical={false} />
          <XAxis 
            dataKey="displayDate" 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            domain={[minWeight, maxWeight]} 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}kg`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#181b26', borderColor: '#232738', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0b0c10' }}
            activeDot={{ r: 6, fill: '#34d399', stroke: '#0b0c10' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Consistency Calendar Heatmap (simple grid approximation)
export function ConsistencyHeatmap({ 
  data 
}: { 
  data: { date: string; calories: number; workedOut: boolean; target: number }[] 
}) {
  // We'll just show the last 28 days
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const days = [];
  const todayDate = new Date(today);
  
  // Start from 27 days ago
  const startDate = new Date(todayDate);
  startDate.setDate(todayDate.getDate() - 27);
  
  // Calculate padding (Mon=1, Tue=2, ..., Sun=7)
  // JS getDay(): Sun=0, Mon=1, ..., Sat=6
  let startDayOfWeek = startDate.getDay();
  // Convert JS day to ISO day (1-7 where Mon=1)
  startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;
  const emptyPadding = startDayOfWeek - 1; // Number of empty cells before the first day

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const summary = data.find(item => item.date === dateStr);
    let status = 'none'; // none, partial, perfect
    
    if (summary) {
      const hitCalories = summary.calories > 0 && Math.abs(summary.calories - summary.target) <= 200; // Within 200 kcal of target
      const hitWorkout = summary.workedOut;
      
      if (hitCalories && hitWorkout) status = 'perfect';
      else if (hitCalories || hitWorkout) status = 'partial';
      else if (summary.calories > 0) status = 'poor';
    }
    
    days.push({ date: dateStr, status });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'partial': return 'bg-emerald-500/50';
      case 'poor': return 'bg-red-500/50';
      default: return 'bg-[#fafafa] border border-[#1a1a1a]/10';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-[10px] text-center text-[#6b7280] font-semibold uppercase">{day}</div>
        ))}
        {Array.from({ length: emptyPadding }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-md opacity-0" />
        ))}
        {days.map((day, i) => (
          <div 
            key={i} 
            className={`aspect-square rounded-md ${getStatusColor(day.status)}`}
            title={`${day.date}: ${day.status}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4 text-[10px] text-[#6b7280] font-medium">
        <span className="uppercase">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#fafafa] border border-[#1a1a1a]/10" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span className="uppercase">More</span>
      </div>
    </div>
  );
}

export function StepChart({ 
  data, 
  target 
}: { 
  data: { date: string, steps: number }[],
  target: number
}) {
  const [view, setView] = React.useState<'weekly' | 'monthly'>('weekly');

  if (!data || data.length === 0) {
    return <div className="text-sm text-[#6b7280] py-8 text-center">No step data available yet.</div>;
  }

  // Filter data based on view
  const daysToShow = view === 'weekly' ? 7 : 30;
  
  // Create an array of the last N days to ensure blanks are 0
  const today = new Date();
  today.setHours(0,0,0,0);
  const chartData = [];
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = data.find(item => item.date === dateStr);
    
    chartData.push({
      date: dateStr,
      displayDate: new Date(dateStr).toLocaleDateString(undefined, { 
        month: view === 'monthly' ? 'short' : undefined,
        weekday: view === 'weekly' ? 'short' : undefined,
        day: 'numeric' 
      }),
      steps: existing ? existing.steps : 0
    });
  }

  // Calculate average
  const totalSteps = chartData.reduce((sum, d) => sum + d.steps, 0);
  const avgSteps = Math.round(totalSteps / daysToShow);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="text-sm text-[#6b7280]">Avg: <span className="text-[#1a1a1a] font-bold">{avgSteps.toLocaleString()}</span> / day</div>
        <div className="flex bg-[#fafafa] border border-[#1a1a1a]/10 rounded-lg p-0.5">
          <button 
            onClick={() => setView('weekly')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'weekly' ? 'bg-[#232738] text-[#1a1a1a]' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'monthly' ? 'bg-[#232738] text-[#1a1a1a]' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}
          >
            Monthly
          </button>
        </div>
      </div>
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232738" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#6b7280" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={15}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#181b26', borderColor: '#232738', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#60a5fa' }}
              formatter={(value: any) => [Number(value).toLocaleString(), 'Steps']}
            />
            {/* Target Line */}
            <Line 
              type="step" 
              dataKey={() => target} 
              stroke="#fbbf24" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={false}
              activeDot={false} 
              name="Target"
            />
            <Bar 
              dataKey="steps" 
              fill="#60a5fa" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
