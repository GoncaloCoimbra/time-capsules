# Backend Integration Guide

This document explains how to enable and connect the optional backend services used by the frontend features in CodeTime Capsule (voting, scheduled notifications/email, trending computation, etc.). Follow the steps below to configure your backend and deployment.

## Features that require backend support

- Community voting: POST /api/community/vote (implemented)
- Notifications: POST /api/notifications/send-email and POST /api/notifications/schedule (implemented)
- Worker: Background poller that processes scheduled reminders every minute (included in `server.js`)
- Leaderboard / trending endpoints (already present but verify): GET /api/community/leaderboard, GET /api/community/trending

## Environment variables

Add the following environment variables to the backend `.env`:

- SMTP_SERVICE (e.g. smtp.gmail.com) or use provider-specific vars (See below)
- SMTP_PORT (e.g. 587)
- SMTP_SECURE (true|false)
- SMTP_USER
- SMTP_PASS
- EMAIL_FROM (example: "CodeTime Capsule <no-reply@yourdomain.com>")
- BASE_URL (frontend URL, e.g. https://app.example.com)
- SENDGRID_API_KEY (optional, if you prefer SendGrid)
- REDIS_URL (optional, required for job queues like Bull)
- SCHEDULED_JOB_CRON (optional default for housekeeping tasks)

Keep all secrets out of source control. Use Railway/Render/Heroku/Vercel secret manager.

## Email sending endpoint

Suggested implementation:

POST /api/notifications/send-email

Payload:

```
{
  "to": "user@example.com",
  "subject": "Sua cápsula abriu!",
  "html": "<p>A sua cápsula ...</p>"
}
```

Implementation details:
- Use Nodemailer or provider SDK (SendGrid, Mailgun)
- Validate sender and recipients
- Add rate limiting and retry logic

## Scheduling reminders

For production-grade scheduling:

- Use a job queue (BullMQ + Redis) or a scheduler service (e.g., Render cron, AWS EventBridge)
- Store scheduled reminders in DB with `scheduledAt` and `status` (pending/fired)
- Worker process picks up pending reminders and calls `/api/notifications/send-email` or triggers push notifications

If you prefer a minimal approach (no Redis):
- Persist reminders in DB
- Run a small cron job (`node-cron`) every minute to find due reminders and dispatch them

API for scheduling (basic):

POST /api/notifications/schedule

Payload:
```
{
  "userId": "uuid",
  "capsuleId": "uuid",
  "date": "2026-01-20T12:00:00.000Z",
  "text": "Lembrete: sua cápsula XYZ abriu!",
  "method": "email" // or push
}
```

Return: scheduled item id and status.

## Voting endpoint

POST /api/community/vote

Payload:
```
{ "capsuleId": "uuid", "userId": "uuid" }
```

Behavior:
- Create or increment a vote record for the capsule
- Return current vote count
- Ensure a user can only vote once (idempotent behavior)
- Use optimistic cache invalidation for performance

## Security recommendations

- Authenticate endpoints (JWT) for any operation that requires user identity (voting, scheduling reminders, etc.)
- Rate-limit write endpoints
- Sanitize inputs
- Use HTTPS

## Frontend wiring notes

- `frontend/src/services/capsuleService.js` already includes placeholders for `communityAPI.vote`, `notificationAPI.sendEmail`, and `notificationAPI.schedule`.
- The frontend uses optimistic updates for votes. Ensure the backend returns the accurate count in the response body to reconcile.

## Testing

- Test send-email with a sandbox provider (Mailtrap/SendGrid sandbox) before enabling production email
- Test scheduled reminders with short delays (2-5 minutes) in staging

## Deploy notes

- When deploying to Railway/Render, set env vars in the project dashboard
- Consider using Render/Heroku scheduler or a serverless cron to trigger scheduled jobs. For worker queues, use managed Redis.

## Example quick-start (local)

1. Configure `.env` with SMTP or SendGrid keys
2. Run the backend and frontend locally
3. Use Postman to POST `/api/notifications/send-email` and confirm emails arrive
4. Schedule a reminder for a date a few minutes in the future and watch the worker deliver it

---

If you want, I can scaffold worker skeletons, example endpoints and unit tests next. Let me know if you prefer sample implementations for Nodemailer, BullMQ or SendGrid.