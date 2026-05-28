// frontend/src/components/ml/SkillGapWidget.jsx
// ===============================================
// Shows missing skills ranked by how many drives demand them.
// Green bar = skills you have. Red = missing.

import { useState, useEffect } from 'react';
import { getSkillGap } from '../../utils/mlApi';

export default function SkillGapWidget() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getSkillGap()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Could not load skill gap'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>📊 Skill Gap Analysis</span>
        {data && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            background: data.coverage_pct >= 70 ? '#dcfce7' : data.coverage_pct >= 40 ? '#fef9c3' : '#fee2e2',
            color: data.coverage_pct >= 70 ? '#166534' : data.coverage_pct >= 40 ? '#854d0e' : '#991b1b',
          }}>
            {data.coverage_pct}% Coverage
          </span>
        )}
      </div>

      {loading && <div style={styles.msg}>Analysing skill demand…</div>}
      {error   && <div style={{ ...styles.msg, color: '#991b1b' }}>{error}</div>}

      {data && (
        <div style={{ padding: '14px 18px' }}>
          {/* Skills you have */}
          {data.owned_skills?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={styles.sectionLabel}>✅ Skills You Have</div>
              <div style={styles.pillRow}>
                {data.owned_skills.map(sk => (
                  <span key={sk} style={styles.greenPill}>{sk}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {data.missing_skills?.length > 0 ? (
            <div>
              <div style={styles.sectionLabel}>🎯 Missing Skills (ranked by demand)</div>
              {data.missing_skills.slice(0, 8).map((m, i) => {
                const maxDemand = data.missing_skills[0]?.demand_count || 1;
                const pct = Math.round((m.demand_count / maxDemand) * 100);
                return (
                  <div key={m.skill} style={styles.missingRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1b3e' }}>
                        {i + 1}. {m.skill}
                      </span>
                      <span style={{ fontSize: 11, color: '#8d97aa' }}>
                        {m.demand_count} drive{m.demand_count !== 1 ? 's' : ''} need this
                      </span>
                    </div>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10, fontStyle: 'italic' }}>
                💡 Learn "{data.missing_skills[0]?.skill}" to unlock {data.missing_skills[0]?.demand_count} more drives
              </div>
            </div>
          ) : (
            <div style={{ ...styles.msg, color: '#166534', fontWeight: 600 }}>
              🎉 You cover all required skills across eligible drives!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderTop: '3px solid #0f766e', marginBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f3f4f6' },
  title: { fontSize: 13, fontWeight: 700, color: '#0d1b3e' },
  msg: { padding: '20px', textAlign: 'center', fontSize: 12, color: '#8d97aa' },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: '#8d97aa', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  greenPill: { fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 3 },
  missingRow: { marginBottom: 10 },
  barTrack: { height: 6, background: '#e5e7eb', overflow: 'hidden' },
  barFill: { height: '100%', background: '#dc2626', transition: 'width 0.8s ease' },
};
