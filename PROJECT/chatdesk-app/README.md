# ChatDesk - Business Support Chat Application

React + Firebase chat desk for clients, consultants, and admins.

## Features

### Core
- Authentication with roles: **Client**, **Consultant**, **Admin**
- Real-time chat
- End chat / close conversation
- Multiple Firestore collections: `users`, `conversations`, `messages`

### New enhancements
- **Typing indicator** – see when the other person is typing
- **Unread message badges** – blue dot on unread conversations
- **Image attachments** – attach images in chat (max 400KB, stored as base64; no Storage required)
- **Online / offline status** – consultants show online with live presence
- **Mobile bottom navigation** – Chats / Chat / Admin on small screens
- **Admin dashboard** – stats, all tickets, response time, team presence
- **Assign to specific consultant** – dropdown in chat header
- **Canned / quick replies** – for consultants
- **Tags / categories** – Billing, Technical, Sales, etc.

## Setup

1. Create Firebase project → enable **Email/Password** Auth + **Firestore**
2. Put your config in `src/firebase.js`
3. Firestore rules (dev):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Run:

```bash
npm install
npm run dev
```

## Roles

| Role | Capabilities |
|------|----------------|
| Client | Start chats, message, attach images, end chat |
| Consultant | Claim/assign chats, quick replies, tags, online status |
| Admin | Everything + Admin dashboard (`/admin`) |

## Notes

- Image attachments work without Firebase Storage (base64, 400KB limit).
- For larger files later, enable Storage (Blaze plan) and extend the uploader.
- If messages don’t load ordered, create the composite index Firestore suggests in the browser console.
