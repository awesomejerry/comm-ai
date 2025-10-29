# Comm-AI Web Application

A modern web application for communication analysis and evaluation, built with React, TypeScript, and Vite.

## Features

### User Features

- **Audio Recording & Upload**: Record presentations with audio playback review
- **Real-time Evaluation**: Get AI-powered feedback on communication effectiveness
- **PDF Presentation Support**: Upload and view presentation slides
- **Authentication**: Secure login with Supabase Auth

### Admin Features

- **Admin Dashboard**: Comprehensive view of all evaluation results
- **Evaluation Management**: Browse, search, and view detailed evaluation data
- **Access Control**: Role-based access for admin users
- **Virtual Scrolling**: Efficient handling of large datasets (10,000+ evaluations)

## Tech Stack

- **Frontend**: React 18, TypeScript 5.x
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Testing**: Vitest (unit), Playwright (E2E)
- **Virtual Scrolling**: @tanstack/react-virtual

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Supabase account (for authentication)
- n8n instance (for evaluation webhooks)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your Supabase and n8n credentials
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhook Configuration
VITE_N8N_BASE_URL=your_n8n_instance_url
VITE_N8N_EVALUATION_ENDPOINT=/webhook/comm-ai/evaluation
VITE_N8N_ROLE_ENDPOINT=/webhook/comm-ai/role
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- src/services/__tests__/
npm test -- src/components/__tests__/
npm test -- tests/e2e/

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Type checking
npx tsc --noEmit
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── components/          # React components
│   │   ├── AdminRoute.tsx      # Protected route for admin access
│   │   ├── AudioReview.tsx     # Audio playback component
│   │   ├── AuthProvider.tsx    # Authentication context
│   │   ├── EvaluationChat.tsx  # Chat interface for results
│   │   ├── EvaluationDetail.tsx # Modal for evaluation details
│   │   ├── EvaluationList.tsx  # Virtual scrolling list
│   │   ├── LoginForm.tsx       # Login UI
│   │   ├── PdfViewer.tsx       # PDF display component
│   │   └── __tests__/          # Component unit tests
│   │
│   ├── models/              # TypeScript interfaces & types
│   │   ├── evaluation.ts       # Evaluation data models
│   │   ├── presentation.ts     # Presentation models
│   │   ├── segment.ts          # Audio segment models
│   │   ├── user.ts             # User & role models
│   │   └── adminDashboard.ts   # Dashboard state models
│   │
│   ├── pages/               # Page components
│   │   ├── AdminDashboardPage.tsx  # Admin evaluation dashboard
│   │   ├── LoginRedirect.tsx       # Auth redirect handler
│   │   ├── PresenterPage.tsx       # Main presenter interface
│   │   ├── UnauthorizedPage.tsx    # Access denied page
│   │   └── __tests__/              # Page unit tests
│   │
│   ├── services/            # Business logic & API clients
│   │   ├── adminRoleService.ts     # Role verification
│   │   ├── authService.ts          # Supabase auth integration
│   │   ├── evaluationService.ts    # Evaluation data fetching
│   │   ├── srtParser.ts            # SRT subtitle parsing
│   │   ├── supabaseClient.ts       # Supabase configuration
│   │   ├── uploader.ts             # File upload handling
│   │   ├── uploaderQueue.ts        # Upload queue management
│   │   └── __tests__/              # Service unit tests
│   │
│   ├── recording/           # Audio recording logic
│   │   ├── recordingController.ts  # Recording state management
│   │   └── __tests__/              # Recording unit tests
│   │
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Application entry point
│   └── styles.css           # Global styles & Tailwind imports
│
├── tests/
│   ├── contract/            # API contract tests
│   │   ├── authApiContract.ts      # Auth API contracts
│   │   ├── n8n-evaluation-api.spec.ts  # Evaluation endpoint
│   │   └── n8n-role-api.spec.ts        # Role endpoint
│   │
│   ├── e2e/                 # End-to-end tests (Playwright)
│   │   ├── admin-access-control.spec.ts  # Admin access tests
│   │   ├── admin-dashboard.spec.ts       # Dashboard E2E tests
│   │   └── auth.spec.ts                  # Authentication flows
│   │
│   └── integration/         # Integration tests
│
├── public/                  # Static assets
├── .env.example             # Environment template
├── index.html               # HTML entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.mjs          # Vite configuration
├── vitest.config.ts         # Vitest configuration
├── playwright.config.ts     # Playwright configuration
├── tailwind.config.cjs      # Tailwind CSS configuration
└── postcss.config.cjs       # PostCSS configuration
```

## Admin Dashboard

### Access Requirements

- **Authentication**: User must be logged in with Supabase Auth
- **Authorization**: User role must be "admin" (verified via n8n webhook)
- **Route**: `/admin/dashboard`

### Features

1. **Evaluation List View**
   - Virtual scrolling for performance (handles 10,000+ items)
   - Sorted by creation date (newest first)
   - Displays truncated content (200 characters)
   - Shows metadata: ID, created date, slides, audience
   - Click any evaluation to view full details

2. **Evaluation Detail Modal**
   - Full input/output content (no truncation)
   - Complete metadata display
   - Keyboard accessible (ESC to close)
   - Click backdrop or close button to exit

3. **Error Handling**
   - Retry button for failed requests
   - Exponential backoff for network errors
   - User-friendly error messages
   - Graceful degradation for malformed data

### Admin Access Flow

```
1. User logs in → Supabase Auth verifies credentials
2. User navigates to /admin/dashboard → AdminRoute component loads
3. AdminRoute checks authentication → redirects to /login if not authenticated
4. AdminRoute verifies admin role → calls n8n role webhook
5. If role is "admin" → dashboard loads
6. If role is "user" → redirects to /unauthorized
7. Dashboard fetches evaluations → displays in virtual scrolling list
8. User clicks evaluation → detail modal opens with full data
```

## API Integration

### n8n Webhooks

The application integrates with n8n for evaluation data and role management:

#### Evaluation Endpoint

```
GET {VITE_N8N_BASE_URL}{VITE_N8N_EVALUATION_ENDPOINT}
Response: { results: EvaluationResult[] }
```

#### Role Endpoint

```
GET {VITE_N8N_BASE_URL}{VITE_N8N_ROLE_ENDPOINT}?email={userEmail}
Response: { role: "admin" | "user" }
```

### Supabase Integration

Authentication is handled via Supabase:

- Magic link email authentication
- Session management
- User profile data

## Performance Considerations

- **Virtual Scrolling**: Only renders visible items (supports 10,000+ evaluations)
- **Memoization**: React.memo and useMemo for expensive computations
- **Lazy Loading**: Code splitting for routes
- **Retry Logic**: Exponential backoff (3 attempts: 1s, 2s, 4s delays)
- **Target Metrics**:
  - Page load: < 3 seconds
  - Auth checks: < 500ms
  - List rendering: 60fps with 10,000+ items

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space, Escape)
- **Focus Management**: Proper focus trap in modals
- **Semantic HTML**: Correct use of headings, buttons, and landmarks
- **Screen Reader Support**: Meaningful text for assistive technologies

## Testing Strategy

### Unit Tests

- Components: React Testing Library
- Services: Vitest with mocking
- Models: Type validation tests
- Coverage target: >80%

### Integration Tests

- API contract tests for n8n webhooks
- Supabase auth flow tests
- Component integration tests

### E2E Tests

- Playwright for full user flows
- Admin access scenarios
- Dashboard functionality
- Authentication flows

## Security

- **Environment Variables**: Sensitive data in .env (not committed)
- **Role-Based Access**: Server-side role verification via n8n
- **Client-Side Guards**: AdminRoute component prevents unauthorized access
- **Session Management**: Supabase handles token refresh and expiry
- **Input Sanitization**: All user inputs are validated

## Troubleshooting

### Common Issues

**Problem**: Admin dashboard shows "Loading" indefinitely

- **Solution**: Check n8n webhook is accessible and returning correct format
- **Check**: Verify `VITE_N8N_BASE_URL` in .env

**Problem**: "Unauthorized" page appears for admin user

- **Solution**: Verify n8n role endpoint returns `{ role: "admin" }`
- **Check**: Test role endpoint with user's email

**Problem**: Tests fail with "cannot find module"

- **Solution**: Run `npm install` to ensure all dependencies are installed
- **Check**: Verify `node_modules` exists

**Problem**: TypeScript errors in IDE

- **Solution**: Run `npx tsc --noEmit` to see actual errors
- **Fix**: Update type definitions or fix type mismatches

## Contributing

1. Follow the test-first development approach
2. Maintain >80% code coverage
3. Use TypeScript strict mode
4. Follow ESLint and Prettier configurations
5. Write meaningful commit messages
6. Add tests for new features

## License

[Your License Here]

## Support

For issues and questions, please contact the development team or create an issue in the repository.
