'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ScanSearch,
    TrendingUp,
    Route,
    Leaf,
    Lightbulb,
    Menu,
    X,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
    {
        section: 'Overview',
        items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        section: 'AI Modules',
        items: [
            { label: 'Waste Analyzer', href: '/analyzer', icon: ScanSearch },
            { label: 'Waste Predictor', href: '/predictor', icon: TrendingUp },
            { label: 'Route Optimizer', href: '/routes', icon: Route },
            { label: 'Carbon Engine', href: '/carbon', icon: Leaf },
            { label: 'AI Insights', href: '/insights', icon: Lightbulb },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>🌱</div>
                    <div className={styles.logoText}>
                        <h2>EcoMind AI</h2>
                        <span>Decision Intelligence</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((section) => (
                        <div key={section.section} className={styles.navSection}>
                            <div className={styles.navSectionLabel}>{section.section}</div>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <Icon className={styles.navIcon} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.footerCard}>
                        <p>Sustainability Score</p>
                        <div className={styles.footerScore}>78</div>
                        <div className={styles.footerGrade}>Grade B+</div>
                    </div>
                </div>
            </aside>

            {mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}

            <button
                className={styles.mobileToggle}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </>
    );
}
