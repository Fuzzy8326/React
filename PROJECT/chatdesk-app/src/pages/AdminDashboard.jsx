import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all'); // all | open | assigned | closed
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'conversations'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const at = a.updatedAt?.toDate?.() || 0;
        const bt = b.updatedAt?.toDate?.() || 0;
        return bt - at;
      });
      setConversations(list);
    });
    const unsub2 = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const stats = useMemo(() => {
    const open = conversations.filter((c) => c.status === 'open').length;
    const assigned = conversations.filter((c) => c.status === 'assigned').length;
    const closed = conversations.filter((c) => c.status === 'closed').length;

    // Avg response time approximation: time from created to first assignment
    let totalMs = 0;
    let counted = 0;
    conversations.forEach((c) => {
      if (c.status === 'open' || !c.createdAt || !c.updatedAt) return;
      if (c.consultantId) {
        const created = c.createdAt?.toDate?.() || new Date(c.createdAt);
        const updated = c.updatedAt?.toDate?.() || new Date(c.updatedAt);
        const diff = updated - created;
        if (diff > 0 && diff < 1000 * 60 * 60 * 24 * 7) {
          totalMs += diff;
          counted++;
        }
      }
    });
    const avgMins = counted ? Math.round(totalMs / counted / 60000) : null;

    const consultants = users.filter((u) => u.role === 'consultant' || u.role === 'admin');
    const online = consultants.filter((u) => u.isOnline).length;

    return { open, assigned, closed, total: conversations.length, avgMins, online, consultants: consultants.length };
  }, [conversations, users]);

  const filtered = conversations.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (tagFilter && !(c.tags || []).includes(tagFilter)) return false;
    return true;
  });

  const allTags = [...new Set(conversations.flatMap((c) => c.tags || []))];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function formatTime(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }

  if (userProfile?.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>ChatDesk Admin</h1>
          <span className="role-badge">admin</span>
        </div>
        <div className="header-right">
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            ← Back to chats
          </Link>
          <span className="user-name">{userProfile.name}</span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total chats</div>
          </div>
          <div className="stat-card open">
            <div className="stat-value">{stats.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card assigned">
            <div className="stat-value">{stats.assigned}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-card closed">
            <div className="stat-value">{stats.closed}</div>
            <div className="stat-label">Closed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avgMins != null ? `${stats.avgMins}m` : '—'}</div>
            <div className="stat-label">Avg response</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.online}/{stats.consultants}</div>
            <div className="stat-label">Consultants online</div>
          </div>
        </div>

        <div className="admin-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="closed">Closed</option>
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All categories</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Consultant</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Last message</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted center">No conversations match.</td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.clientName || '—'}</td>
                  <td>{c.consultantName || 'Unassigned'}</td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  </td>
                  <td>
                    <div className="tag-list compact">
                      {(c.tags || []).map((t) => (
                        <span key={t} className="tag-chip">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="truncate">{c.lastMessage || '—'}</td>
                  <td>{formatTime(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="section-title">Team</h3>
        <div className="team-list">
          {users
            .filter((u) => u.role === 'consultant' || u.role === 'admin')
            .map((u) => (
              <div key={u.uid} className="team-member">
                <span className={`dot ${u.isOnline ? 'online' : 'offline'}`} />
                <strong>{u.name}</strong>
                <span className="role-tag">{u.role}</span>
                <span className="muted">
                  {u.isOnline ? 'Online' : `Last seen ${u.lastSeen ? new Date(u.lastSeen).toLocaleString() : '—'}`}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
