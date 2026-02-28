'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Cloud, Recycle, TreePine } from 'lucide-react';
import { getCarbonSummary, getWeeklyCarbon, getCarbonByCategory, getSustainabilityBreakdown } from '@/lib/api';
import { weeklyCarbonData as fallbackWeekly, wasteCategories, sustainabilityScores as fallbackScores } from '@/data/mockData';
import styles from './carbon.module.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <div className="label">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="value" style={{ color: p.fill }}>
                    {p.name}: {p.value} kg CO₂
                </div>
            ))}
        </div>
    );
};

export default function CarbonPage() {
    const [summary, setSummary] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [s, w, c, b] = await Promise.all([
                    getCarbonSummary(),
                    getWeeklyCarbon(),
                    getCarbonByCategory(),
                    getSustainabilityBreakdown(),
                ]);
                setSummary(s);
                setWeeklyData(w);
                setCategoryData(c);
                setBreakdown(b);
            } catch (err) {
                console.warn('API unavailable, using fallback:', err.message);
                const total = fallbackWeekly.reduce((a, b) => a + b.saved, 0);
                setSummary({
                    co2SavedTotal: total,
                    diversionRate: 68,
                    treesEquivalent: Math.round(total / 21),
                    sustainabilityScore: fallbackScores.overall,
                    grade: fallbackScores.grade,
                    weeklyTrend: fallbackScores.trend,
                    target: fallbackScores.target,
                });
                setWeeklyData(fallbackWeekly);
                setCategoryData(wasteCategories.map(c => ({
                    name: c.label, saved: Math.round(c.recycleSavings * (20 + Math.random() * 15)),
                    emitted: Math.round(c.emissionFactor * (5 + Math.random() * 5)), color: c.color,
                })));
                setBreakdown({
                    overall: fallbackScores.overall,
                    grade: fallbackScores.grade,
                    breakdown: fallbackScores.breakdown,
                    trend: fallbackScores.trend,
                    target: fallbackScores.target,
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const s = summary || { co2SavedTotal: 0, diversionRate: 0, treesEquivalent: 0 };
    const b = breakdown || { overall: 0, grade: 'C', breakdown: {}, trend: '+0%', target: 85 };

    const breakdownItems = [
        { label: 'Recycling', value: b.breakdown?.recycling || 0, color: '#34d399' },
        { label: 'Composting', value: b.breakdown?.composting || 0, color: '#2dd4bf' },
        { label: 'Waste Reduction', value: b.breakdown?.reduction || 0, color: '#22d3ee' },
        { label: 'Awareness', value: b.breakdown?.awareness || 0, color: '#60a5fa' },
        { label: 'Efficiency', value: b.breakdown?.efficiency || 0, color: '#a78bfa' },
    ];

    return (
        <div className={styles.carbon}>
            <div className={styles.header}>
                <h1>🌿 Carbon &amp; Sustainability Score Engine</h1>
                <p>Track environmental impact, CO₂ savings, and campus sustainability metrics</p>
            </div>

            <div className={styles.topStats}>
                <div className={styles.bigStat} style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0, animationDelay: '0ms' }}>
                    <div className={styles.bigStatIcon} style={{ background: 'rgba(52, 211, 153, 0.12)' }}>
                        <Cloud size={28} color="#34d399" />
                    </div>
                    <div className={styles.bigStatLabel}>CO₂ Saved This Month</div>
                    <div className={styles.bigStatValue} style={{ color: '#34d399' }}>{s.co2SavedTotal}</div>
                    <div className={styles.bigStatUnit}>kg CO₂ equivalent</div>
                </div>

                <div className={styles.bigStat} style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0, animationDelay: '100ms' }}>
                    <div className={styles.bigStatIcon} style={{ background: 'rgba(96, 165, 250, 0.12)' }}>
                        <Recycle size={28} color="#60a5fa" />
                    </div>
                    <div className={styles.bigStatLabel}>Landfill Diversion</div>
                    <div className={styles.bigStatValue} style={{ color: '#60a5fa' }}>{s.diversionRate}%</div>
                    <div className={styles.bigStatUnit}>waste diverted from landfill</div>
                </div>

                <div className={styles.bigStat} style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0, animationDelay: '200ms' }}>
                    <div className={styles.bigStatIcon} style={{ background: 'rgba(167, 139, 250, 0.12)' }}>
                        <TreePine size={28} color="#a78bfa" />
                    </div>
                    <div className={styles.bigStatLabel}>Trees Equivalent</div>
                    <div className={styles.bigStatValue} style={{ color: '#a78bfa' }}>{s.treesEquivalent}</div>
                    <div className={styles.bigStatUnit}>trees worth of CO₂ absorbed</div>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <span className={styles.chartDot}></span>
                        Weekly CO₂ Impact
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={weeklyData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="saved" fill="#34d399" radius={[4, 4, 0, 0]} name="CO₂ Saved" />
                            <Bar dataKey="emitted" fill="#f87171" radius={[4, 4, 0, 0]} name="CO₂ Emitted" opacity={0.7} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <span className={styles.chartDot}></span>
                        Savings by Waste Category
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={categoryData} layout="vertical" barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="saved" fill="#34d399" radius={[0, 4, 4, 0]} name="CO₂ Saved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                        <span className={styles.chartDot}></span>
                        Sustainability Breakdown
                    </div>
                    <div className={styles.breakdownGrid}>
                        {breakdownItems.map((item) => (
                            <div key={item.label} className={styles.breakdownItem}>
                                <div className={styles.breakdownLabel}>
                                    <span className={styles.breakdownName}>{item.label}</span>
                                    <span className={styles.breakdownValue}>{item.value}%</span>
                                </div>
                                <div className={styles.breakdownBar}>
                                    <div className={styles.breakdownFill} style={{ width: `${item.value}%`, background: item.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.scoreCard}>
                    <div className={styles.chartTitle} style={{ justifyContent: 'center' }}>
                        <span className={styles.chartDot}></span>
                        Overall Sustainability Grade
                    </div>
                    <div className={styles.gradeCircle}>{b.grade}</div>
                    <h3>Campus Score: {b.overall}/100</h3>
                    <div className={styles.scoreTrend}>↑ {b.trend} this week</div>
                    <div className={styles.scoreTarget}>Target: {b.target}/100</div>
                </div>
            </div>
        </div>
    );
}
