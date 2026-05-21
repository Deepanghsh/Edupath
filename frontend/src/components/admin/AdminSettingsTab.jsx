import { C, SectionHeader, TableCard, Btn } from './ui';

export default function AdminSettingsTab() {
  return (
    <div>
      <SectionHeader title="System Settings" sub="Configure portal parameters, access controls, and preferences" />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <TableCard>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.gray800, marginBottom: 12 }}>Placement Season Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Current Academic Year</label><input value="2025-26" readOnly style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, background: C.gray50, marginTop: 4, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }} /></div>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Minimum Readiness Score for Tier 1</label><input type="number" defaultValue="70" style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, marginTop: 4, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }} /></div>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Minimum Readiness Score for Tier 2</label><input type="number" defaultValue="60" style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, marginTop: 4, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }} /></div>
            </div>
            <div style={{ marginTop: 16 }}><Btn variant="primary">Save Config</Btn></div>
          </div>
        </TableCard>

        <TableCard>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.gray800, marginBottom: 12 }}>Admin Profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Name</label><input defaultValue="TPO Admin" style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, marginTop: 4, fontSize: 12 }} /></div>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Email</label><input defaultValue="tpo@gce.edu" style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, marginTop: 4, fontSize: 12 }} /></div>
              <div><label style={{ fontSize: 11, color: C.gray400 }}>Reset Password</label><input type="password" placeholder="New Password" style={{ padding: '6px 10px', width: '100%', border: `1px solid ${C.gray200}`, marginTop: 4, fontSize: 12 }} /></div>
            </div>
            <div style={{ marginTop: 16 }}><Btn variant="primary">Update Profile</Btn></div>
          </div>
        </TableCard>
      </div>
    </div>
  );
}
