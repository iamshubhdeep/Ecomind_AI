import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata = {
  title: 'EcoMind AI – Intelligent Waste Prediction & Carbon Optimization',
  description: 'AI-powered decision intelligence system for waste classification, prediction, route optimization, carbon tracking, and sustainability insights. Optimized for AMD hardware.',
  keywords: 'waste management, AI, carbon optimization, sustainability, recycling, smart campus',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <Header />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
