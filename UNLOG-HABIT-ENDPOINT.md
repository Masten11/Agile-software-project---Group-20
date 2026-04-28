
## Unlog Habit Endpoint

`POST /api/unlog-habit` mirrors the same high-level structure as `log-habit`:

1. Validate authenticated user (`supabase.auth.getUser()`).
2. Parse and type-guard payload using `parseUnlogHabitRequest(...)`.
3. Dispatch category-specific delete through `dispatchUnlogHabit(...)`.
4. Delete by `id` and `user_id` to enforce ownership.
5. Return removed row data when successful.

### Unlog Request Contract

Use one shared payload shape for all categories:

- `{ category: Category, body: { id: string } }`

Rules:

- `category` chooses the delete target (table/handler).
- `body.id` must be a UUID.
- `body` does not vary by category for unlog.

### Unlog Rate Limiting

As apposed to `log-habit`, `unlog-habit` currently has no dedicated rate limiter.

Reasoning for current scope:

- This project's expensive API calls happen in `log-habit` transportation distance lookup.
- `unlog-habit` only deletes existing rows and does not call external APIs.
- Simpler architecture is preferred for course project delivery.

Future production hardening can add action-based limits (`log` vs `unlog`) via edge rate limiting or Redis.