# Debug Session: ai-chat-history

Status: OPEN

## Problem
- AI chat history is broken.
- Old conversation clicks sometimes return `500` on `GET /api/ai/conversations/{conversationId}`.
- `POST /api/ai/chat` sometimes fails.
- Refresh may lose current conversation.
- `conversationId` may become null, undefined, or stale.

## Initial Hypotheses
1. Frontend has stale state when switching conversations and uses an outdated `currentConversationId`.
2. Duplicate or racing requests overwrite state with older responses.
3. Refresh restoration logic for `currentConversationId` is missing or inconsistent.
4. Backend conversation lookup or mapping throws due to missing ownership validation, missing includes, or null references.
5. Chat send flow sometimes posts with an invalid or missing `conversationId`.

## Evidence Plan
- Read the full frontend AI chat flow: page, hook, API client, DTOs, and any sidebar/message components.
- Read backend controller, service, repository, entities, and DTO mapping for conversations/messages.
- Instrument frontend and backend with minimal runtime logging before changing business logic.
- Reproduce click-history and refresh flows with runtime evidence.
- Confirm root cause, then implement the smallest safe fix.

## Notes
- No business logic edits before instrumentation.

## Evidence Collected
- Frontend hook used `setCurrentConversationId(id)` before loading conversation data, then still referenced async state during request/response handling.
- Frontend expected `response.data.Messages` and `response.data.Conversation`, but ASP.NET JSON responses are camelCase, so the actual payload is `response.data.messages` and `response.data.conversation`.
- Refresh restoration for `currentConversationId` was missing, so the selected chat disappeared after reload.
- `POST /api/ai/chat` used state-driven `currentConversationId`, which could become stale/null during rapid switching.
- Backend `GET /api/ai/conversations/{id}` returned an EF entity wrapper instead of a dedicated DTO and did not eagerly load messages in one owned query.
- Backend conversation-not-found in chat processing raised an app exception without an explicit `404` status.

## Fix Summary
- Added instrumentation to frontend hook, controller, service, and repository for click/send/fetch tracing.
- Switched frontend chat state to use `currentConversationIdRef` as the synchronous source of truth.
- Added request cancellation separation for send vs conversation loading, plus last-request-wins protection for conversation switching.
- Persisted `currentConversationId` in `localStorage` and restored it after refresh.
- Fixed frontend conversation detail parsing to use camelCase response fields.
- Returned typed conversation detail DTOs from backend and loaded messages with `Include(...)`.
- Returned `400` for empty messages and `404` for invalid/missing conversations instead of surfacing as generic failures.

## Status
- OPEN
- Instrumentation is still present pending runtime confirmation from the user.
