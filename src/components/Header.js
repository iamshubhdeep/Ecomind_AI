'use client';

import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import styles from './Header.module.css';

const pageTitles = {
    '/': 'Dashboard',
    '/analyzer': 'Smart Waste Analyzer',
    '/predictor': 'Waste Predictor',
    '/routes': 'Route Optimizer',
    '/carbon': 'Carbon Engine',
    '/insights': 'AI Insights',
};

export default function Header() {
    const pathname = usePathname();
    const title = pageTitles[pathname] || 'EcoMind AI';

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <div>
                    <h3>{title}</h3>
                    <span className={styles.breadcrumb}>EcoMind AI / {title}</span>
                </div>
            </div>

            <div className={styles.headerRight}>
                <span className={styles.amdBadge}>⚡ AMD Optimized</span>

                <div className={styles.liveIndicator}>
                    <span className={styles.liveDot}></span>
                    Live Monitoring
                </div>

                <button className={styles.headerBtn} aria-label="Notifications">
                    <Bell size={16} />
                    <span className={styles.notifBadge}>3</span>
                </button>

                <button className={styles.headerBtn} aria-label="Settings">
                    <Settings size={16} />
                </button>

                <div className={styles.avatar} title="Admin">A</div>
            </div>
        </header>
    );
}
