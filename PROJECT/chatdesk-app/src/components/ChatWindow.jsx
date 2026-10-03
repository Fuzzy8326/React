import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const CANNED_REPLIES = [
  'Thank you for contacting us! How can I help you today?',
  'I understand your concern. Let me look into this for you.',
  'Could you please provide more details?',
  'Your request has been noted. We will get back to you shortly.',
  'Is there anything else I can help you with?',
  'This issue has been resolved. Please let us know if you need further assistance.'
];

const TAG_OPTIONS = ['Billing', 'Technical', 'Sales', 'General', 'Account', 'Feedback'];

export default function ChatWindow({
  conversation: initialConversation,
  currentUser,
  userProfile,
  consultants = [],
  onTagChange,
  onAssign
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [attachment, setAttachment] = useState(null); // { type, data, name }
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const isClosed = conversation?.status === 'closed';
  const isStaff = userProfile?.role === 'consultant' || userProfile?.role === 'admin';

  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  // Live conversation doc
  useEffect(() => {
    if (!initialConversation?.id) return;
    const unsub = onSnapshot(doc(db, 'conversations', initialConversation.id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setConversation(data);
        setTypingUsers(data.typing || {});
      }
    });
    return unsub;
  }, [initialConversation?.id]);

  // Messages
  useEffect(() => {
    if (!conversation?.id) return;
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversation.id),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        // Fallback without orderBy if index missing
        if (err.code === 'failed-precondition') {
          const q2 = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversation.id)
          );
          onSnapshot(q2, (snap) => {
            const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            msgs.sort((a, b) => {
              const at = a.createdAt?.toDate?.() || 0;
              const bt = b.createdAt?.toDate?.() || 0;
              return at - bt;
            });
            setMessages(msgs);
          });
        } else {
          console.error(err);
        }
      }
    );
    return unsub;
  }, [conversation?.id]);

  // Mark as read
  useEffect(() => {
    if (!conversation?.id || !currentUser) return;
    updateDoc(doc(db, 'conversations', conversation.id), {
      [`readBy.${currentUser.uid}`]: new Date().toISOString()
    }).catch(() => {});
  }, [conversation?.id, currentUser, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  async function setTyping(isTyping) {
    if (!conversation?.id || isClosed) return;
    try {
      const typing = { ...(conversation.typing || {}) };
      if (isTyping) {
        typing[currentUser.uid] = {
          name: userProfile.name,
          at: Date.now()
        };
      } else {
        delete typing[currentUser.uid];
      }
      await updateDoc(doc(db, 'conversations', conversation.id), { typing });
    } catch (_) {}
  }

  function handleInputChange(e) {
    setNewMessage(e.target.value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Images only for base64 (no Storage)
    if (!file.type.startsWith('image/')) {
      alert('Only images are supported for attachments (no cloud storage enabled). You can also paste an image URL in the message.');
      return;
    }
    if (file.size > 400 * 1024) {
      alert('Image must be under 400KB. Please compress it or use an external image URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        type: 'image',
        data: reader.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    if ((!newMessage.trim() && !attachment) || sending || isClosed) return;

    setSending(true);
    setTyping(false);
    try {
      const updates = {
        lastMessage: newMessage.trim().substring(0, 80) || (attachment ? '📎 Attachment' : ''),
        updatedAt: serverTimestamp()
      };

      if (isStaff && (!conversation.consultantId || conversation.status === 'open')) {
        updates.consultantId = currentUser.uid;
        updates.consultantName = userProfile.name;
        updates.status = 'assigned';
      }

      // Clear typing for self
      const typing = { ...(conversation.typing || {}) };
      delete typing[currentUser.uid];
      updates.typing = typing;

      const msgData = {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      };

      if (attachment) {
        msgData.attachment = attachment;
      }

      await addDoc(collection(db, 'messages'), msgData);
      await updateDoc(doc(db, 'conversations', conversation.id), updates);

      setNewMessage('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
    setSending(false);
  }

  async function endChat() {
    if (isClosed || ending) return;
    if (!window.confirm('End this chat? No more messages can be sent.')) return;
    setEnding(true);
    try {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
        lastMessage: 'Chat ended',
        typing: {}
      });
      await addDoc(collection(db, 'messages'), {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        text: '🔒 This chat has been ended.',
        createdAt: serverTimestamp(),
        isSystem: true
      });
    } catch (err) {
      alert('Failed to end chat');
    }
    setEnding(false);
  }

  function useCanned(text) {
    setNewMessage(text);
    setShowCanned(false);
  }

  if (!conversation) return null;

  const headerTitle =
    userProfile.role === 'client'
      ? conversation.consultantName || 'Support Chat'
      : conversation.clientName || 'Client Chat';

  // Other people typing
  const othersTyping = Object.entries(typingUsers || {})
    .filter(([uid, info]) => uid !== currentUser.uid && info?.at && Date.now() - info.at < 5000)
    .map(([, info]) => info.name);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>{headerTitle}</h3>
          <span className={`status-badge status-${conversation.status}`}>
            {conversation.status}
          </span>
          {conversation.tags?.length > 0 && (
            <div className="tag-list">
              {conversation.tags.map((t) => (
                <span key={t} className="tag-chip">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="chat-header-actions">
          {isStaff && conversation.status !== 'closed' && (
            <>
              <select
                className="tag-select"
                value=""
                onChange={(e) => {
                  if (e.target.value && onTagChange) onTagChange(conversation.id, e.target.value);
                }}
              >
                <option value="">+ Tag</option>
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {consultants.length > 0 && (
                <select
                  className="assign-select"
                  value={conversation.consultantId || ''}
                  onChange={(e) => {
                    if (e.target.value && onAssign) onAssign(conversation.id, e.target.value);
                  }}
                >
                  <option value="">Assign to...</option>
                  {consultants.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.name} {c.isOnline ? '●' : '○'}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          {!isClosed && (
            <button onClick={endChat} disabled={ending} className="btn btn-outline btn-sm end-chat-btn">
              {ending ? 'Ending...' : 'End Chat'}
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <p className="muted center">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderId === currentUser.uid ? 'own' : 'other'} ${
              msg.isSystem ? 'system' : ''
            }`}
          >
            {!msg.isSystem && (
              <div className="message-meta">
                <strong>{msg.senderName}</strong>
                <span className="role-tag">{msg.senderRole}</span>
              </div>
            )}
            <div className="message-bubble">
              {msg.text}
              {msg.attachment?.type === 'image' && (
                <div className="msg-attachment">
                  <img src={msg.attachment.data} alt={msg.attachment.name || 'attachment'} />
                </div>
              )}
            </div>
            <div className="message-time">
              {msg.createdAt?.toDate
                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </div>
          </div>
        ))}

        {othersTyping.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots"><i /><i /><i /></span>
            {othersTyping.join(', ')} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isClosed ? (
        <div className="chat-closed-banner">
          This conversation has ended. No more messages can be sent.
        </div>
      ) : (
        <div className="composer">
          {isStaff && (
            <div className="canned-bar">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowCanned(!showCanned)}
              >
                Quick replies
              </button>
              {showCanned && (
                <div className="canned-list">
                  {CANNED_REPLIES.map((r, i) => (
                    <button key={i} type="button" className="canned-item" onClick={() => useCanned(r)}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {attachment && (
            <div className="attachment-preview">
              <img src={attachment.data} alt="preview" />
              <button type="button" onClick={() => setAttachment(null)}>✕</button>
            </div>
          )}

          <form className="message-input-form" onSubmit={sendMessage}>
            <button
              type="button"
              className="btn btn-outline btn-sm attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image (max 400KB)"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
            />
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || (!newMessage.trim() && !attachment)}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}