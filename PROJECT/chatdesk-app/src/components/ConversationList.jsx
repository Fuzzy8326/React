export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  userRole,
  onClaim,
  currentUserId,
  onlineConsultants = {}
}) {
  if (conversations.length === 0) {
    return <p className="muted" style={{ padding: '1rem' }}>No conversations yet.</p>;
  }

  function getUnread(conv) {
    if (!conv.lastMessage || !conv.updatedAt) return false;
    const lastRead = conv.readBy?.[currentUserId];
    if (!lastRead) return conv.status !== 'closed';
    const updated = conv.updatedAt?.toDate?.() || new Date(conv.updatedAt);
    const readAt = new Date(lastRead);
    return updated > readAt;
  }

  return (
    <ul className="conversation-list">
      {conversations.map((conv) => {
        let title;
        if (userRole === 'client') {
          title = conv.consultantName || (conv.status === 'assigned' ? 'Consultant' : 'Waiting for consultant');
        } else {
          title = conv.clientName || 'Client';
        }

        const unread = getUnread(conv) && selectedId !== conv.id;

        return (
          <li
            key={conv.id}
            className={`conversation-item ${selectedId === conv.id ? 'active' : ''} ${unread ? 'unread' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conv-header">
              <strong>
                {title}
                {unread && <span className="unread-dot" />}
              </strong>
              <span className={`status-badge status-${conv.status}`}>{conv.status}</span>
            </div>
            <p className="conv-preview">
              {conv.lastMessage || conv.subject || 'No messages yet'}
            </p>
            {conv.tags?.length > 0 && (
              <div className="tag-list compact">
                {conv.tags.slice(0, 3).map((t) => (
                  <span key={t} className="tag-chip">{t}</span>
                ))}
              </div>
            )}
            {userRole !== 'client' && !conv.consultantId && conv.status !== 'closed' && (
              <button
                className="btn btn-sm btn-outline claim-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(conv.id);
                }}
              >
                Claim
              </button>
            )}
            {userRole !== 'client' && conv.consultantId === currentUserId && (
              <span className="assigned-you">Assigned to you</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}