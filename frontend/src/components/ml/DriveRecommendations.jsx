// frontend/src/components/ml/DriveRecommendations.jsx
// =====================================================
// Shows TF-IDF ranked drive recommendations for the logged-in student.

import { useState, useEffect } from 'react';
import { getRecommendations } from '../../utils/mlApi';

const LABEL_COLORS = {
  'Excellent Match': { bg: '#dcfce7', text: '#166534' },
  'Good Match':      { bg: '#dbeafe', text: '#1e40af' },
  'Fair Match':      { bg: '#fef9c3', text: '#854d0e' },
  'Low Match':       { bg: '#fee2e2', text: '#991b1b' },
};

export default function DriveRecommendations() {
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getRecommendations(6)
      .then(r => setRecs(r.data.recommendations || []))
      .catch(e => setError(e.response?.data?.error || 'Could not load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>🏢 AI Drive Recommendations</span>
        <span style={styles.sub}>Ranked by your skill match</span>
      </div>

      {loading && <div style={styles.msg}>Analysing your skills…</div>}
      {error   && <div style={{ ...styles.msg, color: '#991b1b' }}>{error}</div>}

      {!loading && !error && recs.length === 0 && (
        <div style={styles.msg}>No recommendations yet — complete your profile first.</div>
      )}

      {recs.map((r, i) => {
        const lc = LABEL_COLORS[r.match_label] || LABEL_COLORS['Low Match'];
        return (
          <div key={r.drive_id || i} style={styles.row}>
            {/* Rank */}
            <div style={styles.rank}>#{i + 1}</div>

            {/* Logo abbr */}
            <div style={styles.logo}>
              {r.company_name?.substring(0, 4).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={styles.company}>{r.company_name}</div>
              <div style={styles.role}>{r.job_role}</div>
              {/* Match bar */}
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${r.match_score}%`,
                  background: r.match_score > 60 ? '#166534' : r.match_score > 30 ? '#1e5fa8' : '#854d0e',
                }} />
              </div>
            </div>

            {/* Right: score + label + eligibility */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, fontWeight: 700, color: '#0d1b3e' }}>
                {r.match_score}%
              </div>
              <div style={{ ...styles.badge, background: lc.bg, color: lc.text }}>
                {r.match_label}
              </div>
              <div style={{ fontSize: 10, color: r.eligible ? '#166534' : '#991b1b', marginTop: 3, fontWeight: 600 }}>
                {r.eligible ? '✓ Eligible' : '✗ Check CGPA/backlogs'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderTop: '3px solid #7c3aed', marginBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f3f4f6' },
  title: { fontSize: 13, fontWeight: 700, color: '#0d1b3e' },
  sub: { fontSize: 11, color: '#8d97aa' },
  msg: { padding: '20px', textAlign: 'center', fontSize: 12, color: '#8d97aa' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid #f3f4f6' },
  rank: { fontSize: 11, fontWeight: 700, color: '#8d97aa', width: 20, flexShrink: 0 },
  logo: { background: '#0d1b3e', color: '#b8902a', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fontWeight: 700, padding: '4px 6px', flexShrink: 0 },
  company: { fontSize: 13, fontWeight: 600, color: '#0d1b3e' },
  role: { fontSize: 11, color: '#8d97aa', marginBottom: 4 },
  barTrack: { height: 4, background: '#e5e7eb', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width 1s ease' },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', display: 'inline-block', marginTop: 4 },
};
