# Data Model: Users can log in through their email (Supabase)

## Entities

### User

- **email**: string (unique, required)
- **id**: string (Supabase UUID, primary key)
- **created_at**: timestamp
- **email_confirmed_at**: timestamp (nullable)
- **last_sign_in_at**: timestamp (nullable)
- **role**: string ("user")

### Login Link Token (managed by Supabase)

- **token_hash**: string (unique, single-use, managed by Supabase)
- **expires_at**: timestamp (managed by Supabase)
- **redirect_to**: string (optional, for post-login redirect)

### Verification Token (managed by Supabase)

- **token_hash**: string (unique, single-use, managed by Supabase)
- **expires_at**: timestamp (managed by Supabase)

## Relationships

- Each User has one or more Login Link Tokens (one active at a time)
- Each User has one Verification Token (if unverified)

## Validation Rules

- Email must be unique and valid format
- Only end-users (role = "user") are allowed
- Login/verification tokens must be single-use and expire as defined by Supabase
