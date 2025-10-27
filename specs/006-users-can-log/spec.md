# Feature Specification: Users can log in through their email

**Feature Branch**: `006-users-can-log`
**Created**: 2025-10-11
**Status**: Draft

**Input**: User description: "Users can log in through their email"

## Clarifications

### Session 2025-10-11

Q: What is explicitly out of scope for this feature? → A: Social login, password-based login, admin flows, and account deletion are out of scope for this feature.
Q: Which user roles are in scope for this login flow? → A: Only end-users (regular users) can use this login flow.
Q: How long are login links valid? → A: Login link expiration is defined by the authentication service provider.
Q: How should the system handle email delivery failure (e.g., bounce, spam, undelivered)? → A: Show a generic message ("Check your spam folder or try again") regardless of delivery status.
Q: What is the expected scale for users and login requests? → A: Up to 10,000 active users and 1,000 login requests per hour.

## Out of Scope

**Note:** Only end-users (regular users) are in scope for this login flow. Admin/support users are not included.

The following are explicitly not included in this feature:

- Social login (e.g., Google, Facebook, etc.)
- Password-based login or password reset flows
- Admin or support user flows
- Account deletion or deactivation

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Passwordless Email Login (Priority: P1)

A user visits the application, enters their email address, and receives a login link in their email. Clicking the link logs them in automatically.

**Why this priority**: This is the core authentication flow required for users to access the system, providing a secure and frictionless login experience.

**Independent Test**: Can be fully tested by entering a registered email, receiving a login link, clicking the link, and verifying access to the application.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they enter their email and request a login link, **Then** a login link is sent to their email address.
2. **Given** a user with a valid login link, **When** they click the link, **Then** they are granted access to their account.
3. **Given** an unregistered email, **When** a user requests a login link, **Then** they receive an error or a generic message indicating the account does not exist.
4. **Given** an expired or invalid login link, **When** a user attempts to use it, **Then** they receive an error and are prompted to request a new link.

---

### User Story 2 - Email Verification (Priority: P2)

A new user must verify their email address before gaining full access to the application.

**Why this priority**: Ensures account security and prevents misuse of unverified email addresses.

**Independent Test**: Can be fully tested by registering a new account, receiving a verification email, and confirming the account before login is allowed.

**Acceptance Scenarios**:

1. **Given** a new registration, **When** a user provides their email, **Then** a verification email is sent.
2. **Given** a user with an unverified email, **When** they attempt to log in, **Then** they are prompted to verify their email before accessing the application.
3. **Given** a user with a verified email, **When** they request a login link and use it, **Then** they are granted access.

---

### User Story 3 - Re-login and Device Management (Priority: P3)

A returning user can request a new login link from any device, and the system ensures only the most recent link is valid.

**Why this priority**: Prevents misuse of old links and supports secure, multi-device access.

**Independent Test**: Can be fully tested by requesting multiple login links and verifying that only the latest link works.

**Acceptance Scenarios**:

1. **Given** a user requests multiple login links, **When** they try to use an older link, **Then** only the most recent link is valid and previous links are invalidated.
2. **Given** a user logs in from a new device, **When** they use a valid login link, **Then** they are granted access on that device.

### Edge Cases

- What happens when a user enters an invalid email format?
- How does the system handle multiple requests for login links in a short period (rate limiting, abuse prevention)?
- What if the login or verification link is expired or already used?
- How does the system handle duplicate email registrations?
- What if the login or verification email is not delivered (e.g., bounce, spam, undelivered)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to log in using their email address and a secure, single-use login link sent to their email (passwordless login). Expiration duration is defined by the authentication service provider.
- **FR-002**: System MUST validate email addresses for correct format and uniqueness, and MUST prevent duplicate email registrations.
- **FR-003**: System MUST send a verification email to new users upon registration.
- **FR-004**: System MUST require email verification before granting full access.
- **FR-005**: System MUST handle invalid or expired login and verification links with clear error messages.
- **FR-006**: System MUST prevent brute-force or abuse of login link requests (e.g., via rate limiting or lockout).
- **FR-007**: System MUST show a generic message in the UI: "Check your email for the login link. If you don't see it, check your spam folder or try again." if a login or verification email is not delivered, regardless of delivery status.

### Key Entities

- **User**: Represents an individual with attributes: email (unique), verification status, last login link token (optional), last login time.
- **Verification Token**: Represents a unique code sent to a user's email for account verification, with expiration.
- **Login Link Token**: Represents a unique, single-use code sent to a user's email for passwordless login, with expiration and device/session tracking. Expiration duration is defined by the authentication service provider.

## Assumptions

- The system is expected to support up to 10,000 active users and 1,000 login requests per hour.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of users can successfully log in using a magic link sent to their email on the first attempt.
- **SC-002**: 100% of new users receive a verification email within 2 minutes of registration.
- **SC-003**: 99% of login link requests are delivered within 1 minute.
- **SC-004**: No more than 0.1% of login link requests are blocked due to abuse prevention.
- **SC-005**: Duplicate email registrations are prevented in 100% of cases.
- **SC-006**: 100% of expired or invalid login/verification links are handled with clear user messaging.

---

## Technical Constraints (Implementation Notes)

- The implementation for this feature MUST use Supabase Auth for passwordless email login, verification, and token management, as defined in the project plan.
- Data model and token handling in the implementation MUST reference both the requirements above and Supabase's conventions.
