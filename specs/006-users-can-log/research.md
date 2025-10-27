# Research: Users can log in through their email (Supabase)

## Decision: Use Supabase Auth Magic Link (Email OTP)

- **Rationale**: Supabase Auth provides a secure, scalable, and well-documented passwordless authentication flow using email magic links. It is natively supported in the existing tech stack (TypeScript, React, Vite) and aligns with the project's requirements for passwordless, email-based login for end-users only.
- **Alternatives considered**: Custom backend with JWT, Firebase Auth, Auth0, Clerk. Rejected due to higher complexity, cost, or lack of native integration.

## Decision: Email Template Customization

- **Rationale**: Supabase allows customizing the email template for magic links and verification. This ensures branding and clear instructions for users.
- **Alternatives considered**: Default Supabase templates (less branded), third-party email services (unnecessary for MVP).

## Decision: Rate Limiting & Abuse Prevention

- **Rationale**: Supabase provides built-in rate limiting for auth endpoints. Additional client-side throttling and generic error messages will be used to prevent abuse and protect privacy.
- **Alternatives considered**: Custom backend rate limiting (not needed for MVP).

## Decision: Integration Testing

- **Rationale**: Supabase provides test utilities for mocking auth flows. Playwright will be used for end-to-end testing of the login UI and flow. Some integration test approaches for Supabase Auth may require further research.
- **Alternatives considered**: Manual testing only (not sufficient for CI/CD).

## Decision: Scale & Performance

- **Rationale**: Supabase is designed to scale to tens of thousands of users. The plan targets up to 10,000 active users and 1,000 login requests/hour, which is well within Supabase's capabilities.
- **Alternatives considered**: Dedicated custom auth infrastructure (not needed for current scale).

## Decision: Security & Privacy

- **Rationale**: All authentication and sensitive data are transmitted over TLS. No passwords are stored. Supabase manages token expiration and session security. No PII is stored outside Supabase.
- **Alternatives considered**: Custom session/token management (adds risk and complexity).
