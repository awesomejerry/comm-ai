# Quickstart: Users can log in through their email (Supabase)

## Prerequisites

- Node.js (latest LTS)
- Supabase project with Auth enabled
- Supabase JS client installed (`npm install @supabase/supabase-js`)
- Vite, React, Tailwind CSS set up (see project README)

## 1. Configure Supabase Auth for Magic Link

- In the Supabase dashboard, enable "Email (magic link)" authentication.
- (Optional) Customize the magic link email template for branding.

## 2. Set up Supabase client

```ts
import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://<project>.supabase.co", "<anon-key>");
```

## 3. Implement Login UI

- Create a form for users to enter their email.
- On submit, call:

```ts
await supabase.auth.signInWithOtp({ email });
```

- Show a message: "Check your email for the login link."

## 4. Handle Redirect After Login

- In your app's router, handle the redirect from the magic link.
- Use `supabase.auth.getSession()` to check if the user is logged in.

## 5. Test the Flow

- Use Playwright or manual testing to verify:
  - Login link is sent for valid emails
  - Error for invalid/unregistered emails
  - Expired/used links are rejected
  - Only end-users can log in

## 6. Rate Limiting & Abuse Prevention

- Supabase provides built-in rate limiting for auth endpoints.
- Show a generic error if too many requests are made.

## 7. Security & Privacy

- All auth traffic is over TLS
- No passwords are stored
- No PII is stored outside Supabase
