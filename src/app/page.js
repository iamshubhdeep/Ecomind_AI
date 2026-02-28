'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Trash2, Recycle, CloudSun, AlertTriangle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  getDashboardStats, getWasteTrend, getWasteComposition, getAlerts,
} from '@/lib/api';
import {
  dashboardStats as fallbackStats, wasteComposition as fallbackComp,
  recentAlerts as fallbackAlerts, generateHistoricalData, sustainabilityScores,
} from '@/data/mockData';
import styles from './dashboard.module.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.stroke || p.fill }}>
          {p.name}: {p.value} kg
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [composition, setComposition] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [s, t, c, a] = await Promise.all([
          getDashboardStats(),
          getWasteTrend(14),
          getWasteComposition(),
          getAlerts(),
        ]);
        setStats(s);
        setTrendData(t.map(d => ({ ...d, dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));
        setComposition(c);
        setAlerts(a);
      } catch (err) {
        console.warn('API unavailable, using fallback data:', err.message);
        setStats(fallbackStats);
        setTrendData(generateHistoricalData(14).map(d => ({ ...d })));
        setComposition(fallbackComp);
        setAlerts(fallbackAlerts);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const displayStats = stats || fallbackStats;
  const displayComp = composition.length ? composition : fallbackComp;
  const displayAlerts = alerts.length ? alerts : fallbackAlerts;

  const statCards = [
    {
      label: 'Total Waste Today',
      value: `${displayStats.totalWasteToday} kg`,
      icon: Trash2,
      trend: '+5.2%',
      trendDir: 'up',
      color: '#f472b6',
      bg: 'rgba(244, 114, 182, 0.12)',
    },
    {
      label: 'Recycling Rate',
      value: `${displayStats.recyclingRate}%`,
      icon: Recycle,
      trend: '+4.1%',
      trendDir: 'up',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
    },
    {
      label: 'CO₂ Saved',
      value: `${displayStats.co2Saved} kg`,
      icon: CloudSun,
      trend: '+8.3%',
      trendDir: 'up',
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)',
    },
    {
      label: 'Overflow Risk',
      value: displayStats.overflowRisk,
      icon: AlertTriangle,
      trend: '-2 bins',
      trendDir: 'down',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.12)',
    },
  ];

  const circumference = 2 * Math.PI * 64;
  const scoreOffset = circumference - (sustainabilityScores.overall / 100) * circumference;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Real-time waste management intelligence powered by AI {loading ? '' : '· Live from API'}</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              className="stat-card"
              key={stat.label}
              style={{ animationDelay: `${i * 80}ms`, animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}
            >
              <div className="icon-wrap" style={{ background: stat.bg }}>
                <Icon size={22} color={stat.color} />
              </div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className={`stat-trend ${stat.trendDir === 'up' ? 'up' : 'down'}`}>
                  {stat.trendDir === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>
            <span className={styles.chartDot}></span>
            Waste Generation Trend (14 Days)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="plastic" stroke="#f472b6" strokeWidth={1.5} dot={false} opacity={0.6} />
              <Line type="monotone" dataKey="organic" stroke="#60a5fa" strokeWidth={1.5} dot={false} opacity={0.6} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>
            <span className={styles.chartDot}></span>
            Waste Composition
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={displayComp}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {displayComp.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.compositionLegend}>
            {displayComp.map((item) => (
              <div key={item.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: item.color }}></span>
                <span className={styles.legendLabel}>{item.name}</span>
                <span className={styles.legendValue}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>
            <span className={styles.chartDot}></span>
            Recent Alerts
          </div>
          <div className={styles.alertsList}>
            {displayAlerts.map((alert) => (
              <div key={alert.id} className={styles.alertItem}>
                <span className={styles.alertIcon}>{alert.icon}</span>
                <div className={styles.alertContent}>
                  <p>{alert.message}</p>
                  <span>{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>
            <span className={styles.chartDot}></span>
            Sustainability Score
          </div>
          <div className={styles.scoreCenter}>
            <div className={styles.scoreRing}>
              <svg width="160" height="160">
                <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={scoreOffset}
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.scoreValue}>
                <span className={styles.number}>{sustainabilityScores.overall}</span>
                <span className={styles.grade}>{sustainabilityScores.grade}</span>
              </div>
            </div>
            <div className={styles.scoreMeta}>
              <div className={styles.trend}>↑ {sustainabilityScores.trend} this week</div>
              <div className={styles.target}>Target: {sustainabilityScores.target}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
