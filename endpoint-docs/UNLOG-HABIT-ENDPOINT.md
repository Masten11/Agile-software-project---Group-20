## Unlog Habit Endpoint

`POST /api/unlog-habit` follows a simple 3-step flow:

1. **Auth**  
   Validate authenticated user with `supabase.auth.getUser()`.
2. **Parse**  
   Validate request body with `parseUnlogHabitRequest(...)` in `utils/payload_parsing.ts`.
3. **Unlog**  
   Call `unlogHabit(...)` in `utils/unlog-habit.ts`, which deletes from `emissions` by both `id` and `user_id`.

Main entrypoint: `app/api/unlog-habit/route.ts`

### Request Contract

Current payload shape:

- `{ id: string }`

Rules:

- `id` must be a valid UUID.
- `user_id` comes from auth context (supabase client), not request body.

