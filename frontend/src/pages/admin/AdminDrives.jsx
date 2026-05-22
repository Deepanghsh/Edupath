import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, SectionHeader, TableCard, Toolbar, FormCard, Btn, TH, TD, MONO, formControl, formLabel } from '../../components/admin/ui';

const EMPTY = { company_name: '', job_role: '', visit_date: '', min_cgpa_required: '', max_backlogs_allowed: '', location: '', avg_package: '', required_skills: '' };

export default function DrivesTab({ addToast }) {
  const [drives,   setDrives]   = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { fetchDrives(); }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/drives');
      setDrives(data);
    } catch (err) { console.error('Drives fetch error:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.company_name || !form.job_role || !form.min_cgpa_required || !form.visit_date) {
      addToast?.('Fill all required fields.', 'error'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.put(`/admin/drives/${editId}`, form);
        setDrives(prev => prev.map(d => d._id === editId ? data : d));
        addToast?.('Drive updated successfully.', 'success');
      } else {
        const { data } = await api.post('/admin/drives', form);
        setDrives(prev => [data, ...prev]);
        addToast?.(`Drive for ${data.company_name} created!`, 'success');
      }
      setForm(EMPTY); setEditId(null);
    } catch (err) {
      addToast?.(err.response?.data?.message || 'Failed to save drive.', 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = (d) => {
    setEditId(d._id);
    setForm({
      company_name: d.company_name, job_role: d.job_role,
      visit_date: d.visit_date ? d.visit_date.split('T')[0] : d.visit_date,
      min_cgpa_required: d.min_cgpa_required, max_backlogs_allowed: d.max_backlogs_allowed,
      location: d.location, avg_package: d.avg_package,
      required_skills: Array.isArray(d.required_skills) ? d.required_skills.join(', ') : d.required_skills,
    });
  };

  const handleDelete = async (id, company) => {
    try {
      await api.delete(`/admin/drives/${id}`);
      setDrives(prev => prev.map(d => d._id === id ? { ...d, status: 'Cancelled' } : d));
      addToast?.(`${company} drive cancelled.`, 'success');
    } catch (err) { addToast?.('Delete failed.', 'error'); }
  };

  const filtered = drives.filter(d =>
    d.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.job_role?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { Active: C.success, Upcoming: C.gold, Completed: C.gray400, Cancelled: '#b03030' };

  return (
    <div>
      <SectionHeader title="Manage Company Drives" sub="Create, edit, and manage all placement drives for AY 2025–26">
        <Btn variant="ghost" size="sm" onClick={fetchDrives}>⟳ Refresh</Btn>
      </SectionHeader>

      {/* Create / Edit Form */}
      <FormCard head={editId ? '✏ Edit Drive' : '+ Create New Drive'} style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 16 }}>
          <div>
            <label style={formLabel}>Company Name *</label>
            <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Tata Consultancy Services" style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Job Role *</label>
            <input value={form.job_role} onChange={e => setForm(p => ({ ...p, job_role: e.target.value }))} placeholder="Software Engineer" style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Visit Date *</label>
            <input type="date" value={form.visit_date} onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))} style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Min CGPA *</label>
            <input type="number" step="0.1" min="0" max="10" value={form.min_cgpa_required} onChange={e => setForm(p => ({ ...p, min_cgpa_required: e.target.value }))} placeholder="6.5" style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Max Backlogs</label>
            <input type="number" min="0" value={form.max_backlogs_allowed} onChange={e => setForm(p => ({ ...p, max_backlogs_allowed: e.target.value }))} placeholder="0" style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Avg Package</label>
            <input value={form.avg_package} onChange={e => setForm(p => ({ ...p, avg_package: e.target.value }))} placeholder="8.5 LPA" style={formControl} />
          </div>
          <div>
            <label style={formLabel}>Location</label>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore" style={formControl} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={formLabel}>Required Skills (comma-separated)</label>
            <input value={form.required_skills} onChange={e => setForm(p => ({ ...p, required_skills: e.target.value }))} placeholder="React, Node.js, MongoDB" style={formControl} />
          </div>
        </div>
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Drive' : 'Create Drive'}</Btn>
          {editId && <Btn variant="ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</Btn>}
        </div>
      </FormCard>

      {/* Drives Table */}
      <TableCard>
        <Toolbar search={search} onSearch={setSearch} placeholder="Search by company or role..." />
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.gray400, fontSize: 13 }}>Loading drives...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {['Company', 'Job Role', 'Min CGPA', 'Max Backlogs', 'Visit Date', 'Package', 'Status', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: C.gray400 }}>No drives found.</td></tr>
                )}
                {filtered.map((d, i) => (
                  <tr key={d._id} style={{ borderBottom: `1px solid ${C.gray100}`, background: i % 2 === 0 ? '#fff' : C.gray50 }}>
                    <TD><div style={{ fontWeight: 500 }}>{d.company_name}</div><div style={{ fontSize: 10, color: C.gray400 }}>{d.location}</div></TD>
                    <TD>{d.job_role}</TD>
                    <TD><MONO>{d.min_cgpa_required}</MONO></TD>
                    <TD><MONO>{d.max_backlogs_allowed}</MONO></TD>
                    <TD><MONO style={{ fontSize: 11 }}>{d.visit_date}</MONO></TD>
                    <TD><span style={{ color: C.success, fontWeight: 600, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{d.avg_package || '—'}</span></TD>
                    <TD>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, color: statusColor[d.status] || C.gray400, background: `${statusColor[d.status]}18`, border: `1px solid ${statusColor[d.status] || C.gray200}40` }}>
                        {d.status}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="ghost" size="sm" onClick={() => handleEdit(d)}>Edit</Btn>
                        {d.status !== 'Cancelled' && <Btn variant="danger" size="sm" onClick={() => handleDelete(d._id, d.company_name)}>Cancel</Btn>}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}
