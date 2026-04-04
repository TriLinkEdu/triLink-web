# Chat WebSocket Backend Spec

This frontend expects a realtime socket endpoint for chat features (typing, presence, read receipts, and live message fanout).

## Endpoint

- URL default: `/api/chat/ws`
- Override from frontend via `NEXT_PUBLIC_CHAT_WS_URL`
- Auth token can come from either:
- Query string `?token=<jwt>`
- `auth:hello` envelope payload (`payload.token`)

## Client -> Server envelopes

Use either `event` or `type` as the event key.

```json
{
  "event": "conversation:join",
  "payload": {
    "conversationId": "uuid",
    "userId": "uuid"
  }
}
```

Supported outgoing events from frontend:

1. `auth:hello`
- payload: `{ token, userId, name }`

2. `presence:set`
- payload: `{ userId, status: "online" | "offline", name? }`

3. `conversation:join`
- payload: `{ conversationId, userId }`

4. `conversation:leave`
- payload: `{ conversationId, userId }`

5. `typing:update`
- payload: `{ conversationId, userId, isTyping }`

6. `read:update`
- payload: `{ conversationId, userId, messageId }`

7. `ping`
- payload: `{ ts }`

## Server -> Client envelopes

The frontend accepts either nested payload or flat payload.

### New message
Preferred:

```json
{
  "event": "message:new",
  "payload": {
    "conversationId": "uuid",
    "message": {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "text": "hello",
      "createdAt": "2026-04-04T08:30:00.000Z"
    }
  }
}
```

Also accepted (flat):

```json
{
  "event": "message:new",
  "payload": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "text": "hello",
    "createdAt": "2026-04-04T08:30:00.000Z"
  }
}
```

### Typing

```json
{
  "event": "typing:update",
  "payload": {
    "conversationId": "uuid",
    "userId": "uuid",
    "isTyping": true
  }
}
```

### Presence

```json
{
  "event": "presence:update",
  "payload": {
    "userId": "uuid",
    "status": "online"
  }
}
```

### Read receipts

```json
{
  "event": "read:update",
  "payload": {
    "conversationId": "uuid",
    "userId": "uuid",
    "messageId": "uuid"
  }
}
```

### Conversation changes

```json
{
  "event": "conversation:update",
  "payload": {
    "conversationId": "uuid"
  }
}
```

## Backend implementation checklist

1. Authenticate socket once connected (query token and/or auth:hello)
2. Maintain room membership by `conversationId`
3. Fan out `message:new` only to conversation participants
4. Fan out `typing:update` only to room members except sender
5. Fan out `read:update` only to room members
6. Broadcast `presence:update` on connect/disconnect
7. Persist read receipts and optionally unread counters
8. Keep REST chat endpoints as source of truth for history and recovery

## Notes

- Frontend already falls back to REST polling if socket is unavailable.
- Frontend sends heartbeat `ping` every 25s; backend may ignore or respond with `pong`.
- If backend uses Socket.IO instead of raw WebSocket, expose a compatible ws gateway or adapt frontend transport.
