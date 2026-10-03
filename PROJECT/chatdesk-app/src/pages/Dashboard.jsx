import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import ChatWindow from '../components/ChatWindow';
import ConversationList from '../components/ConversationList';

const TAG_OPTIONS = ['Billing', 'Technical', 'Sales', 'General', 'Account', 'Feedback'];

export default function Dashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState([]);
  const [mobileTab, setMobileTab] = useState('chats'); // chats | chat
  const [newTag, setNewTag] = useState('');

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;
  const isStaff = userProfile?.role === 'consultant' || userProfile?.role === 'admin';

  // Conversations list
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    let q;
    if (userProfile.role === 'client') {
      q = query(collection(db, 'conversations'), where('clientId', '==', currentUser.uid));
    } else {
      q = query(collection(db, 'conversations'));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let convs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        convs.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
          const bTime = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
          return bTime - aTime;
        });
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser, userProfile]);

  // Selected conversation live sync
  useEffect(() => {
    if (!selectedId) return;
    const unsub = onSnapshot(doc(db, 'conversations', selectedId), (snap) => {
      if (!snap.exists()) return;
      const updated = { id: snap.id, ...snap.data() };
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === selectedId);
        if (exists) return prev.map((c) => (c.id === selectedId ? { ...c, ...updated } : c));
        return [updated, ...prev];
      });
    });
    return unsub;
  }, [selectedId]);

  // Load consultants for assign + online status
  useEffect(() => {
    if (!isStaff) return;
    const q = query(collection(db, 'users'), where('role', 'in', ['consultant', 'admin']));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setConsultants(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      },
      async () => {
        // Fallback if 'in' query needs index — fetch all users
        try {
          const all = await getDocs(collection(db, 'users'));
          setConsultants(
            all.docs
              .map((d) => ({ uid: d.id, ...d.data() }))
              .filter((u) => u.role === 'consultant' || u.role === 'admin')
          );
        } catch (_) {}
      }
    );
    return unsub;
  }, [isStaff]);

  async function startNewConversation() {
    if (userProfile.role !== 'client') return;

    // Category is required before starting a chat
    if (!newTag) {
      alert('Please select a category first before starting a conversation.');
      return;
    }

    try {
      const tags = [newTag];
      const ref = await addDoc(collection(db, 'conversations'), {
        clientId: currentUser.uid,
        clientName: userProfile.name,
        consultantId: null,
        consultantName: null,
        status: 'open',
        subject: `${newTag} Support Request`,
        tags,
        readBy: { [currentUser.uid]: new Date().toISOString() },
        typing: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: ''
      });
      setSelectedId(ref.id);
      setNewTag('');
      setMobileTab('chat');
    } catch (err) {
      console.error(err);
      alert('Failed to start conversation.');
    }
  }

  async function claimConversation(convId) {
    if (!isStaff) return;
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        consultantId: currentUser.uid,
        consultantName: userProfile.name,
        status: 'assigned',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAssign(convId, consultantUid) {
    const c = consultants.find((x) => x.uid === consultantUid);
    if (!c) return;
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        consultantId: c.uid,
        consultantName: c.name,
        status: 'assigned',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTagChange(convId, tag) {
    const conv = conversations.find((c) => c.id === convId);
    const existing = conv?.tags || [];
    if (existing.includes(tag)) return;
    try {
      await updateDoc(doc(db, 'conversations', convId), {
        tags: [...existing, tag],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelect(conv) {
    setSelectedId(conv.id);
    setMobileTab('chat');
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!userProfile) return <div className="loading">Loading profile...</div>;

  const onlineCount = consultants.filter((c) => c.isOnline).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>ChatDesk</h1>
          <span className="role-badge">{userProfile.role}</span>
          {isStaff && (
            <span className="online-pill">{onlineCount} online</span>
          )}
        </div>
        <div className="header-right">
          {userProfile.role === 'admin' && (
            <Link to="/admin" className="btn btn-outline btn-sm">
              Admin
            </Link>
          )}
          <span className="user-name">{userProfile.name}</span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className={`sidebar ${mobileTab === 'chats' ? 'mobile-show' : 'mobile-hide'}`}>
          <div className="sidebar-header">
            <h3>Conversations</h3>
          </div>

          {userProfile.role === 'client' && (
            <div className="new-chat-tags">
              <label className="category-label">Select a category to start *</label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className={!newTag ? 'required-empty' : ''}
              >
                <option value="">Choose category...</option>
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={startNewConversation}
                className="btn btn-sm btn-primary btn-block"
                disabled={!newTag}
                style={{ marginTop: '0.5rem' }}
              >
                Start Chat
              </button>
            </div>
          )}

          {isStaff && consultants.length > 0 && (
            <div className="online-consultants">
              <span className="muted">Team: </span>
              {consultants.map((c) => (
                <span key={c.uid} className={`consultant-status ${c.isOnline ? 'online' : 'offline'}`}>
                  <span className="dot" />
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <p className="muted" style={{ padding: '1rem' }}>Loading...</p>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
              userRole={userProfile.role}
              onClaim={claimConversation}
              currentUserId={currentUser.uid}
            />
          )}
        </aside>

        <main className={`main-content ${mobileTab === 'chat' ? 'mobile-show' : 'mobile-hide'}`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUser={currentUser}
              userProfile={userProfile}
              consultants={consultants}
              onTagChange={handleTagChange}
              onAssign={handleAssign}
            />
          ) : (
            <div className="empty-state">
              <h2>Welcome to ChatDesk</h2>
              <p>
                {userProfile.role === 'client'
                  ? 'Start a new conversation or select an existing one.'
                  : 'Select a conversation to assist clients.'}
              </p>
              {userProfile.role === 'client' && (
                <p className="muted" style={{ marginTop: '1rem' }}>
                  Select a <strong>category</strong> in the sidebar, then click <strong>Start Chat</strong>.
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        <button
          className={mobileTab === 'chats' ? 'active' : ''}
          onClick={() => setMobileTab('chats')}
        >
          <span className="nav-icon">💬</span>
          Chats
          {conversations.some((c) => {
            const lastRead = c.readBy?.[currentUser.uid];
            if (!c.updatedAt) return false;
            if (!lastRead) return c.status !== 'closed';
            const updated = c.updatedAt?.toDate?.() || new Date(c.updatedAt);
            return updated > new Date(lastRead);
          }) && <span className="nav-badge" />}
        </button>
        <button
          className={mobileTab === 'chat' ? 'active' : ''}
          onClick={() => selectedId && setMobileTab('chat')}
          disabled={!selectedId}
        >
          <span className="nav-icon">✉️</span>
          Chat
        </button>
        {userProfile.role === 'admin' && (
          <button onClick={() => navigate('/admin')}>
            <span className="nav-icon">📊</span>
            Admin
          </button>
        )}
      </nav>
    </div>
  );
}
