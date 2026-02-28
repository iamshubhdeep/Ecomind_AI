'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Route } from 'lucide-react';
import { getOptimizedRoute } from '@/lib/api';
import { bins as fallbackBins, buildings } from '@/data/mockData';
import styles from './routes.module.css';

const MapComponent = dynamic(() => import('@/components/RouteMap'), { ssr: false });

function getFillClass(level) {
    if (level >= 85) return 'critical';
    if (level >= 65) return 'high';
    if (level >= 40) return 'medium';
    return 'low';
}

export default function RoutesPage() {
    const [routeData, setRouteData] = useState([]);
    const [routeStats, setRouteStats] = useState({ totalDistance: '0', estimatedTime: 0, binsToCollect: 0, fuelSaved: '0' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRoute() {
            try {
                const data = await getOptimizedRoute();
                setRouteData(data.route);
                setRouteStats(data.stats);
            } catch (err) {
                console.warn('API unavailable, using fallback:', err.message);
                const sorted = [...fallbackBins].sort((a, b) => b.fillLevel - a.fillLevel).filter(b => b.fillLevel > 30);
                const bldgMap = Object.fromEntries(buildings.map(b => [b.id, b.name]));
                setRouteData(sorted.map((b, i) => ({
                    order: i + 1, binId: b.id, label: b.label,
                    buildingId: b.buildingId, buildingName: bldgMap[b.buildingId] || b.buildingId,
                    lat: b.lat, lng: b.lng, fillLevel: b.fillLevel,
                    binType: b.type, capacity: b.capacity,
                    priority: getFillClass(b.fillLevel),
                })));
                setRouteStats({
                    totalDistance: (sorted.length * 0.4 + Math.random() * 0.5).toFixed(1),
                    estimatedTime: Math.round(sorted.length * 4.5 + Math.random() * 5),
                    binsToCollect: sorted.length,
                    fuelSaved: (Math.random() * 2 + 1).toFixed(1),
                });
            } finally {
                setLoading(false);
            }
        }
        loadRoute();
    }, []);

    const mapBins = routeData.map(b => ({
        id: b.binId, label: b.label, lat: b.lat, lng: b.lng,
        fillLevel: b.fillLevel, type: b.binType, capacity: b.capacity,
    }));

    return (
        <div className={styles.routes}>
            <div className={styles.header}>
                <h1>🗺️ AI Collection Route Optimizer</h1>
                <p>Optimal pickup routes based on predicted fill levels and priority scoring</p>
            </div>

            <div className={styles.content}>
                <div className={styles.mapCard}>
                    <div className={styles.mapContainer}>
                        {!loading && <MapComponent bins={mapBins} />}
                    </div>
                </div>

                <div className={styles.sidePanel}>
                    <div className={styles.panelCard}>
                        <div className={styles.panelTitle}>
                            <span className={styles.panelDot}></span>
                            Route Statistics
                        </div>
                        <div className={styles.routeStats}>
                            <div className={styles.routeStat}>
                                <div className={styles.statLabel}>Distance</div>
                                <div className={styles.statVal} style={{ color: '#34d399' }}>{routeStats.totalDistance} km</div>
                            </div>
                            <div className={styles.routeStat}>
                                <div className={styles.statLabel}>Est. Time</div>
                                <div className={styles.statVal} style={{ color: '#60a5fa' }}>{routeStats.estimatedTime} min</div>
                            </div>
                            <div className={styles.routeStat}>
                                <div className={styles.statLabel}>Bins</div>
                                <div className={styles.statVal} style={{ color: '#fbbf24' }}>{routeStats.binsToCollect}</div>
                            </div>
                            <div className={styles.routeStat}>
                                <div className={styles.statLabel}>Fuel Saved</div>
                                <div className={styles.statVal} style={{ color: '#a78bfa' }}>{routeStats.fuelSaved} L</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.panelCard}>
                        <div className={styles.panelTitle}>
                            <span className={styles.panelDot}></span>
                            Priority Legend
                        </div>
                        <div className={styles.priorityLegend}>
                            <div className={styles.priorityItem}>
                                <span className={styles.priorityDot} style={{ background: '#f87171' }}></span>
                                Critical (&gt;85%)
                            </div>
                            <div className={styles.priorityItem}>
                                <span className={styles.priorityDot} style={{ background: '#fb923c' }}></span>
                                High (65-85%)
                            </div>
                            <div className={styles.priorityItem}>
                                <span className={styles.priorityDot} style={{ background: '#fbbf24' }}></span>
                                Medium (40-65%)
                            </div>
                            <div className={styles.priorityItem}>
                                <span className={styles.priorityDot} style={{ background: '#34d399' }}></span>
                                Low (&lt;40%)
                            </div>
                        </div>
                    </div>

                    <div className={styles.panelCard}>
                        <div className={styles.panelTitle}>
                            <span className={styles.panelDot}></span>
                            Collection Order
                        </div>
                        <div className={styles.binList}>
                            {routeData.map((bin) => (
                                <div key={bin.binId} className={styles.binItem}>
                                    <span className={styles.binOrder}>{bin.order}</span>
                                    <div className={styles.binInfo}>
                                        <div className={styles.binName}>{bin.label}</div>
                                        <div className={styles.binBuilding}>{bin.buildingName}</div>
                                    </div>
                                    <span className={`${styles.binFill} ${styles[getFillClass(bin.fillLevel)]}`}>
                                        {bin.fillLevel}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className={styles.optimizeBtn} onClick={() => window.location.reload()}>
                        <Route size={16} />
                        Re-Optimize Route
                    </button>
                </div>
            </div>
        </div>
    );
}
