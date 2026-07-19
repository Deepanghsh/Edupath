// frontend/src/components/ml/SPIEScoreCard.jsx
// =============================================
// Displays the SPIE pipeline result:
//   - Animated score ring (0-100)
//   - Verdict badge ("Conditionally Ready", "Placement Ready", etc.)
//   - 4 aspect bars (Academic, Technical, MarketFit, Risk)
//   - Headline + top recommendation from explanation
//   - Refresh button to force re-run

import { useState, useEffect } from 'react';
import { getMLInsights, refreshMLInsights } from '../../utils/mlApi';

const VERDICT_COLORS = {
  'Placement Ready':    { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  'Strong Candidate':   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Conditionally Ready':{ bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'Needs Improvement':  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  'High Risk':          { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

const ASPECT_COLORS = {
  Academic:   '#1e5fa8',
  Technical:  '#0f766e',
  MarketFit:  '#7c3aed',
  Risk:       '#b45309',
};

export default function SPIEScoreCard() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [retryIn,  setRetryIn]  = useState(0);

  const load = async () => {
    setLoading(true); setError(null); setRetryIn(0);
    try {
      const res = await getMLInsights();
      setData(res.data);
    } catch (e) {
      const status = e.response?.status;
      if (status === 429) {
        setError('ML service is busy — retrying shortly…');
        // Auto-retry after 30 seconds
        setRetryIn(30);
      } else {
        setError(e.response?.data?.error || 'ML service is warming up. Please retry in a moment.');
      }
    } finally { setLoading(false); }
  };

  // Countdown + auto-retry when rate-limited
  useEffect(() => {
    if (retryIn <= 0) return;
    const t = setTimeout(() => {
      setRetryIn(prev => {
        if (prev <= 1) { load(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMLInsights().catch(() => {});
    await load();
    setRefreshing(false);
  };

  if (loading) return (
    <div style={styles.card}>
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={{ fontSize: 12, color: '#8d97aa', marginTop: 8 }}>
          Running SPIE pipeline…
        </span>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.card}>
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
        <div style={{ fontSize: 13, color: '#8d97aa', marginBottom: 8 }}>{error}</div>
        {retryIn > 0 ? (
          <div style={{ fontSize: 12, color: '#1e5fa8', fontWeight: 600 }}>
            Auto-retrying in {retryIn}s…
          </div>
        ) : (
          <button onClick={load} style={styles.retryBtn}>Retry</button>
        )}
      </div>
    </div>
  );

  const score    = Math.round(data.final_score || 0);
  const verdict  = data.verdict || 'Calculating…';
  const aspects  = data.aspect_results || [];
  const explain  = data.explanation || {};
  const vcol     = VERDICT_COLORS[verdict] || VERDICT_COLORS['Needs Improvement'];
  const radius   = 48;
  const circ     = 2 * Math.PI * radius;
  const progress = (score / 100) * circ;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>🎯 SPIE Intelligence Score</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {data.cache_hit && (
            <span style={styles.cachePill}>⚡ Cached</span>
          )}
          <button onClick={handleRefresh} disabled={refreshing} style={styles.refreshBtn}>
            {refreshing ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Score Ring */}
        <div style={styles.ringWrap}>
          <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={60} cy={60} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={10} />
            <circle cx={60} cy={60} r={radius} fill="none" stroke="#1e5fa8" strokeWidth={10}
              strokeDasharray={circ} strokeDashoffset={circ - progress}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
          </svg>
          <div style={styles.ringCenter}>
            <div style={styles.scoreNum}>{score}</div>
            <div style={styles.scoreOf}>/100</div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ flex: 1 }}>
          {/* Verdict badge */}
          <div style={{ ...styles.verdictBadge, background: vcol.bg, color: vcol.text, border: `1px solid ${vcol.border}` }}>
            {verdict}
          </div>

          {/* Headline */}
          {explain.headline && (
            <div style={styles.headline}>{explain.headline}</div>
          )}

          {/* Aspect bars */}
          <div style={{ marginTop: 12 }}>
            {aspects.map(a => (
              <div key={a.name} style={styles.aspectRow}>
                <span style={styles.aspectLabel}>{a.name}</span>
                <div style={styles.aspectTrack}>
                  <div style={{
                    ...styles.aspectBar,
                    width: `${Math.round(a.penalized_score * 100)}%`,
                    background: ASPECT_COLORS[a.name] || '#1e5fa8',
                  }} />
                </div>
                <span style={styles.aspectPct}>{Math.round(a.penalized_score * 100)}%</span>
                <span style={{
                  ...styles.aspectVerdict,
                  color: a.verdict === 'Strong' ? '#166534' : a.verdict === 'Average' ? '#854d0e' : '#991b1b',
                }}>{a.verdict}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation bar */}
      {explain.top_recommendation && (
        <div style={styles.recBar}>
          <span style={{ fontWeight: 600, color: '#1e5fa8' }}>💡</span>
          <span style={{ fontSize: 12, color: '#374151', marginLeft: 8 }}>
            {explain.top_recommendation}
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderTop: '3px solid #1e5fa8',
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', borderBottom: '1px solid #f3f4f6',
  },
  title: { fontSize: 13, fontWeight: 700, color: '#0d1b3e', letterSpacing: '0.3px' },
  cachePill: {
    fontSize: 10, background: '#dcfce7', color: '#166534',
    padding: '2px 7px', borderRadius: 3, fontWeight: 600,
  },
  refreshBtn: {
    fontSize: 11, color: '#1e5fa8', background: 'none', border: '1px solid #b0c6e8',
    padding: '3px 10px', cursor: 'pointer', fontWeight: 600,
  },
  retryBtn: {
    marginTop: 10, fontSize: 12, color: '#1e5fa8', background: '#eef3fb',
    border: '1px solid #b0c6e8', padding: '5px 14px', cursor: 'pointer',
  },
  body: { display: 'flex', alignItems: 'flex-start', gap: 20, padding: '18px 18px 14px' },
  ringWrap: { position: 'relative', width: 120, height: 120, flexShrink: 0 },
  ringCenter: {
    position: 'absolute', inset: 0, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 700, color: '#1e5fa8', lineHeight: 1 },
  scoreOf: { fontSize: 10, color: '#8d97aa', marginTop: 2 },
  verdictBadge: { display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 3 },
  headline: { fontSize: 12, color: '#374151', marginTop: 8, lineHeight: 1.5 },
  aspectRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  aspectLabel: { fontSize: 10, color: '#8d97aa', width: 68, flexShrink: 0 },
  aspectTrack: { flex: 1, height: 5, background: '#e5e7eb', overflow: 'hidden' },
  aspectBar: { height: '100%', transition: 'width 1s ease' },
  aspectPct: { fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#374151', width: 30, textAlign: 'right' },
  aspectVerdict: { fontSize: 10, fontWeight: 600, width: 50, flexShrink: 0 },
  recBar: {
    display: 'flex', alignItems: 'flex-start',
    background: '#f0f7ff', borderTop: '1px solid #dbeafe',
    padding: '10px 18px',
  },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 },
  spinner: {
    width: 28, height: 28,
    border: '3px solid #e5e7eb', borderTopColor: '#1e5fa8',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
};
