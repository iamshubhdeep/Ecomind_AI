'use client';

import { useMemo, useState, useEffect } from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, Calendar, AlertTriangle, Brain } from 'lucide-react';
import { getHistoricalData, getForecast, getBuildings } from '@/lib/api';
import { buildings as fallbackBuildings, generateHistoricalData, generateForecast } from '@/data/mockData';
import styles from './predictor.module.css';

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

export default function PredictorPage() {
    const [selectedBuilding, setSelectedBuilding] = useState('all');
    const [buildings, setBuildings] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [forecastData, setForecastData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load buildings list
    useEffect(() => {
        async function loadBuildings() {
            try {
                const b = await getBuildings();
                setBuildings(b);
            } catch {
                setBuildings(fallbackBuildings);
            }
        }
        loadBuildings();
    }, []);

    // Load data when building changes
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [hist, fc] = await Promise.all([
                    getHistoricalData(selectedBuilding, 30),
                    getForecast(selectedBuilding, 7),
                ]);
                setHistoricalData(hist.map(d => ({
                    ...d,
                    dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                })));
                setForecastData(fc.forecast.map(d => ({ ...d })));
                setSummary(fc.summary);
            } catch (err) {
                console.warn('API unavailable, using fallback:', err.message);
                const hist = generateHistoricalData(30);
                const fc = generateForecast(hist, 7);
                setHistoricalData(hist);
                setForecastData(fc);
                setSummary({
                    tomorrowVolume: fc[0]?.predicted || 0,
                    peakDay: fc.reduce((m, d) => d.predicted > m.predicted ? d : m, fc[0])?.dateLabel || '',
                    peakVolume: fc.reduce((m, d) => d.predicted > m.predicted ? d : m, fc[0])?.predicted || 0,
                    overflowRiskDays: fc.filter(d => d.predicted > 220).length,
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedBuilding]);

    // Combine data for chart
    const combinedData = useMemo(() => {
        if (!historicalData.length) return [];
        const hist = historicalData.slice(-14).map(d => ({
            ...d,
            predicted: null,
            upper: null,
            lower: null,
        }));
        if (forecastData.length) {
            const bridgePoint = {
                ...hist[hist.length - 1],
                predicted: hist[hist.length - 1].total,
                upper: hist[hist.length - 1].total,
                lower: hist[hist.length - 1].total,
            };
            const forecast = forecastData.map(d => ({
                ...d,
                total: null,
                plastic: null,
                paper: null,
                organic: null,
                metal: null,
                ewaste: null,
            }));
            return [...hist, bridgePoint, ...forecast];
        }
        return hist;
    }, [historicalData, forecastData]);

    const tomorrowPrediction = summary?.tomorrowVolume || 0;
    const peakDay = summary?.peakDay || '';
    const peakVolume = summary?.peakVolume || 0;
    const overflowRiskDays = summary?.overflowRiskDays || 0;

    return (
        <div className={styles.predictor}>
            <div className={styles.header}>
                <h1>📈 Waste Generation Predictor</h1>
                <p>LSTM-powered time-series forecasting for proactive waste management</p>
            </div>

            <div className={styles.controls}>
                <select
                    className="custom-select"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                >
                    <option value="all">All Buildings (Campus-wide)</option>
                    {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <div className={styles.modelTag}>
                    <Brain size={14} />
                    Powered by LSTM Model
                </div>
            </div>

            {/* Main Chart */}
            <div className={styles.chartSection}>
                <div className={styles.chartTitle}>
                    <span className={styles.chartDot}></span>
                    Historical + 7-Day Forecast {loading ? '(Loading...)' : ''}
                </div>
                <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="upper" fill="rgba(52, 211, 153, 0.08)" stroke="none" />
                        <Area type="monotone" dataKey="lower" fill="rgba(52, 211, 153, 0.0)" stroke="none" />
                        <Line type="monotone" dataKey="total" stroke="#60a5fa" strokeWidth={2.5} dot={false} name="Actual" />
                        <Line type="monotone" dataKey="predicted" stroke="#34d399" strokeWidth={2.5} strokeDasharray="6 3" dot={false} name="Predicted" />
                    </AreaChart>
                </ResponsiveContainer>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendLine} style={{ background: '#60a5fa' }}></span>
                        Actual
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendLine} style={{ background: '#34d399' }}></span>
                        Predicted
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendLine} style={{ background: 'rgba(52, 211, 153, 0.2)' }}></span>
                        Confidence Interval
                    </div>
                </div>
            </div>

            {/* Prediction Cards */}
            <div className={styles.predictionCards}>
                <div className={styles.predCard} style={{ animationDelay: '0ms', animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
                    <div className={styles.predIcon} style={{ background: 'rgba(52, 211, 153, 0.12)' }}>
                        <Calendar size={22} color="#34d399" />
                    </div>
                    <h4>Tomorrow&apos;s Volume</h4>
                    <div className={styles.predValue} style={{ color: '#34d399' }}>{tomorrowPrediction} kg</div>
                    <div className={styles.predSub}>±15 kg confidence range</div>
                </div>

                <div className={styles.predCard} style={{ animationDelay: '100ms', animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
                    <div className={styles.predIcon} style={{ background: 'rgba(251, 191, 36, 0.12)' }}>
                        <TrendingUp size={22} color="#fbbf24" />
                    </div>
                    <h4>Peak Day</h4>
                    <div className={styles.predValue} style={{ color: '#fbbf24' }}>{peakDay}</div>
                    <div className={styles.predSub}>{peakVolume} kg expected</div>
                </div>

                <div className={styles.predCard} style={{ animationDelay: '200ms', animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
                    <div className={styles.predIcon} style={{ background: 'rgba(248, 113, 113, 0.12)' }}>
                        <AlertTriangle size={22} color="#f87171" />
                    </div>
                    <h4>Overflow Risk Days</h4>
                    <div className={styles.predValue} style={{ color: '#f87171' }}>{overflowRiskDays}</div>
                    <div className={styles.predSub}>in next 7 days</div>
                </div>
            </div>
        </div>
    );
}
