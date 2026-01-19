import React from 'react';
import './analytics.css';

export default function AnalyticsDashboard(){
  return (
    <section className="analytics">
      <div className="analytics-inner">
        <h3>Analytics & Insights — Preview</h3>
        <div className="analytics-grid">
          <div className="card">Total cápsulas: 42</div>
          <div className="card">Views: 12.3k</div>
          <div className="card">Likes: 1.2k</div>
        </div>
      </div>
    </section>
  );
}
