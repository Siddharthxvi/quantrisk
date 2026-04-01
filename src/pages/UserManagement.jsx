import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import {
  Users, UserPlus, Edit2, Trash2, CheckCircle, XCircle,
  Shield, Search, X, Save, AlertCircle, UserCheck, UserX
} from 'lucide-react';

const roleColors = {
  ADMIN: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168,85,247,0.3)' },
  ANALYST: { color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)' },
  VIEWER: { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)', border: 'var(--border-color)' },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [createSaving, setCreateSaving] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/users/');
      setUsers(data);
    } catch (e) {
      setError('Failed to load users: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (u) => {
    setEditUser(u);
    setEditForm({
      full_name: u.profile?.full_name || u.full_name || '',
      email: u.email || '',
      phone: u.profile?.phone || '',
      department: u.profile?.department || '',
      is_active: u.is_active,
      password: ''
    });
    setEditMsg(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditMsg(null);
    try {
      const payload = {
        full_name: editForm.full_name || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        department: editForm.department || undefined,
        is_active: editForm.is_active,
      };
      if (editForm.password) payload.password = editForm.password;
      await apiClient(`/users/${editUser.user_id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setEditMsg({ text: 'User updated successfully.', success: true });
      fetchUsers();
    } catch (err) {
      setEditMsg({ text: `Update failed: ${err.message}`, success: false });
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await apiClient(`/users/${u.user_id}`, { method: 'PUT', body: JSON.stringify({ is_active: !u.is_active }) });
      fetchUsers();
    } catch (err) {
      setError('Toggle failed: ' + err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Soft-delete user "${u.username}"? They will be deactivated but their data is preserved.`)) return;
    try {
      await apiClient(`/users/${u.user_id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateSaving(true);
    setCreateMsg(null);
    try {
      await apiClient('/users/', { method: 'POST', body: JSON.stringify(createForm) });
      setCreateMsg({ text: 'User created successfully!', success: true });
      setCreateForm({ username: '', email: '', password: '', full_name: '' });
      fetchUsers();
    } catch (err) {
      setCreateMsg({ text: `Creation failed: ${err.message}`, success: false });
    } finally {
      setCreateSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ paddingBottom: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield color="#A855F7" size={28} /> User Management
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Moderate platform accounts — view, edit, and deactivate users</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateMsg(null); }}
          style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--status-error)', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--text-primary)' },
          { label: 'Active', value: users.filter(u => u.is_active).length, color: 'var(--status-success)' },
          { label: 'Inactive', value: users.filter(u => !u.is_active).length, color: 'var(--status-error)' },
          { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#A855F7' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role…"
            style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rc = roleColors[u.role] || roleColors.VIEWER;
                  return (
                    <tr key={u.user_id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.profile?.full_name || u.full_name || u.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email || u.username}</div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.is_active
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-success)', fontSize: '0.8rem' }}><CheckCircle size={14} /> Active</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-error)', fontSize: '0.8rem' }}><XCircle size={14} /> Inactive</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button title="Edit user" onClick={() => handleOpenEdit(u)}
                            style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex' }}>
                            <Edit2 size={14} />
                          </button>
                          <button title={u.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggleActive(u)}
                            style={{ padding: '6px', background: 'transparent', border: `1px solid ${u.is_active ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, borderRadius: '4px', color: u.is_active ? 'var(--status-error)' : 'var(--status-success)', cursor: 'pointer', display: 'inline-flex' }}>
                            {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button title="Delete user" onClick={() => handleDeleteUser(u)}
                            style={{ padding: '6px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '4px', color: 'var(--status-error)', cursor: 'pointer', display: 'inline-flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editUser && (
        <div 
          onClick={() => setEditUser(null)} 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(10,15,28,0.85)', backdropFilter: 'blur(4px)', 
            display: 'block', overflowY: 'auto', 
            zIndex: 200, padding: '60px 20px' 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="glass-panel" 
            style={{ 
              width: '100%', maxWidth: '500px', 
              margin: '0 auto',
              padding: '32px', position: 'relative',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <button onClick={() => setEditUser(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 color="var(--accent-cyan)" size={20} /> Edit User: {editUser.username}
            </h2>

            {editMsg && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: '6px', background: editMsg.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: editMsg.success ? 'var(--status-success)' : 'var(--status-error)', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {editMsg.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {editMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} style={inputStyle} placeholder="Full name" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} placeholder="+1 555…" />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} style={inputStyle} placeholder="Team / dept." />
                </div>
              </div>
              <div>
                <label style={labelStyle}>New Password (leave blank to keep unchanged)</label>
                <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} style={inputStyle} placeholder="Min 8 characters" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Active Status</label>
                <button type="button" onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${editForm.is_active ? 'var(--status-success)' : 'var(--status-error)'}`, background: editForm.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: editForm.is_active ? 'var(--status-success)' : 'var(--status-error)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                  {editForm.is_active ? '✓ Active' : '✗ Inactive'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={editSaving} style={{ flex: 1, padding: '11px', background: 'var(--accent-emerald)', color: '#000', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Save size={16} /> {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} style={{ padding: '11px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div 
          onClick={() => setShowCreate(false)} 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(10,15,28,0.85)', backdropFilter: 'blur(4px)', 
            display: 'block', overflowY: 'auto', 
            zIndex: 200, padding: '60px 20px' 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="glass-panel" 
            style={{ 
              width: '100%', maxWidth: '460px', 
              margin: '0 auto',
              padding: '32px', position: 'relative',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus color="#A855F7" size={20} /> Create User
            </h2>

            {createMsg && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: '6px', background: createMsg.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: createMsg.success ? 'var(--status-success)' : 'var(--status-error)', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {createMsg.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {createMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Username <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input required value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} style={inputStyle} placeholder="name@analyst.quantrisk" />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Use domain suffix to set role: @analyst / @portviewer / @dbadmin</div>
              </div>
              <div>
                <label style={labelStyle}>Email <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} style={inputStyle} placeholder="user@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} style={inputStyle} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={labelStyle}>Password <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input required type="password" minLength={8} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} style={inputStyle} placeholder="Min. 8 characters" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={createSaving} style={{ flex: 1, padding: '11px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)', color: '#ffffff', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <UserPlus size={16} /> {createSaving ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '11px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
