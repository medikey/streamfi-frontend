# Stellar Wallet Migration - Testing & Validation Checklist

Complete this checklist to verify the Stellar wallet migration is fully functional and tested.

---

## Phase 1: Automated Testing ✅ READY

### Setup
- [ ] Run `npm install` to ensure all dependencies installed
- [ ] Check jest.config.ts exists and is configured
- [ ] Check jest.setup.ts includes testing-library imports

### Run Tests
- [ ] Run `npm test` - should show **89 tests passed**
- [ ] All 4 test suites pass:
  - [ ] `stellar-wallet-context.test.tsx` (16 tests)
  - [ ] `auth-provider.test.tsx` (13 tests)
  - [ ] `ProtectedRoute.test.tsx` (15 tests)
  - [ ] `validation.test.ts` (45 tests)
- [ ] No console errors or warnings during test run
- [ ] Test execution time < 20 seconds

### Coverage Check
- [ ] Run `npm run test:coverage`
- [ ] Check coverage report:
  - [ ] StellarWalletContext: > 80%
  - [ ] AuthProvider: > 80%
  - [ ] ProtectedRoute: > 80%
  - [ ] Validation utils: > 90%
- [ ] Open `coverage/lcov-report/index.html` in browser
- [ ] Verify coverage report shows test coverage

### Test Details - StellarWalletContext

#### Initial State
- [ ] ✅ Test: "should initialize with no wallet connected"
- [ ] ✅ Test: "should throw error when using hook outside provider"

#### Connect Function
- [ ] ✅ Test: "should open wallet selection modal"
- [ ] ✅ Test: "should set public key when wallet is selected"
- [ ] ✅ Test: "should store wallet info in localStorage on success"
- [ ] ✅ Test: "should handle connection errors gracefully"

#### ConnectWallet Function
- [ ] ✅ Test: "should connect specific wallet by ID"
- [ ] ✅ Test: "should handle wallet not installed error"
- [ ] ✅ Test: "should handle user rejection"

#### Disconnect Function
- [ ] ✅ Test: "should disconnect wallet and clear state"

#### Auto-Connect Feature
- [ ] ✅ Test: "should attempt auto-connect when flags are set"
- [ ] ✅ Test: "should not auto-connect without flags"

### Test Details - AuthProvider

#### Initialization
- [ ] ✅ Test: "should initialize as not authenticated when no wallet"
- [ ] ✅ Test: "should set user when wallet is connected"
- [ ] ✅ Test: "should detect returning user with auto-connect flag"

#### Session Management
- [ ] ✅ Test: "should set session cookies when wallet connects"
- [ ] ✅ Test: "should clear session data when wallet disconnects"
- [ ] ✅ Test: "should persist auto-connect flag when connected"

#### Logout
- [ ] ✅ Test: "should clear all auth data and redirect"
- [ ] ✅ Test: "should call wallet disconnect on logout"

#### Error Handling
- [ ] ✅ Test: "should handle initialization errors gracefully"
- [ ] ✅ Test: "should handle SWR loading state"

#### State Management
- [ ] ✅ Test: "should track wallet connecting state"
- [ ] ✅ Test: "should clear local user state when wallet disconnects"

### Test Details - ProtectedRoute

#### Access Control
- [ ] ✅ Test: "should show connect wallet modal when not connected"
- [ ] ✅ Test: "should not show protected content when not authenticated"
- [ ] ✅ Test: "should show loading state during initialization"
- [ ] ✅ Test: "should show loading state while wallet connecting"

#### Authentication
- [ ] ✅ Test: "should show protected content when wallet connected"
- [ ] ✅ Test: "should not show connect modal when authenticated"

#### State Transitions
- [ ] ✅ Test: "should handle transition from initializing to ready"
- [ ] ✅ Test: "should handle transition from disconnected to connected"
- [ ] ✅ Test: "should handle transition from connected to disconnected"

#### Auto-Connect
- [ ] ✅ Test: "should wait for auto-connect before showing modal"
- [ ] ✅ Test: "should show modal if auto-connect fails"

#### Edge Cases
- [ ] ✅ Test: "should handle rapid mount/unmount"
- [ ] ✅ Test: "should handle missing publicKey with isConnected"

### Test Details - Address Validation

#### isValidStellarAddress
- [ ] ✅ Test: Valid addresses (G-prefix, 56 chars)
- [ ] ✅ Test: Reject null/undefined
- [ ] ✅ Test: Reject non-string types
- [ ] ✅ Test: Reject wrong prefix
- [ ] ✅ Test: Reject invalid length
- [ ] ✅ Test: Reject invalid characters
- [ ] ✅ Test: Handle edge cases

#### looksLikeStarkNetAddress
- [ ] ✅ Test: Identify 0x hex addresses
- [ ] ✅ Test: Reject Stellar addresses
- [ ] ✅ Test: Handle invalid formats

#### validateAndNormalizeStellarAddress
- [ ] ✅ Test: Return normalized valid address
- [ ] ✅ Test: Trim whitespace
- [ ] ✅ Test: Return null for invalid

---

## Phase 2: Manual Testing - First-Time User

### Prerequisites
- [ ] Clear localStorage and sessionStorage in browser DevTools
- [ ] Fresh browser session (incognito mode recommended)
- [ ] Stellar wallet extension installed (Freighter recommended)

### Test A.1: Landing Page
- [ ] Open app at `/` or `/explore`
- [ ] Verify: No wallet connected indicator shown
- [ ] Verify: "Connect Wallet" button visible and clickable

### Test A.2: Navigate to Protected Route
- [ ] Click on `/dashboard` link
- [ ] Verify: Connect Wallet modal appears
- [ ] Verify: Cannot access dashboard content
- [ ] Verify: Modal has clear instructions

### Test A.3: Connect Wallet
- [ ] Click "Connect with Freighter" button
- [ ] Verify: Freighter extension popup appears
- [ ] Click "Approve" in Freighter
- [ ] Verify: Modal closes after successful connection
- [ ] Verify: Public key is displayed (starts with G, 56 chars)

### Test A.4: Verify Connection
- [ ] Check browser DevTools → Application → localStorage
- [ ] Verify: `stellar_last_wallet` = "freighter"
- [ ] Verify: `stellar_auto_connect` = "true"
- [ ] Verify: `wallet` = Stellar public key

### Test A.5: Profile Registration (if first-time user)
- [ ] Profile modal should appear after wallet connection
- [ ] Enter username (e.g., "testuser123")
- [ ] Enter email (e.g., "test@example.com")
- [ ] Click "Register"
- [ ] Verify: Registration succeeds
- [ ] Verify: Redirect to dashboard

### Test A.6: Verify User in Database
- [ ] Open DevTools → Network tab
- [ ] Navigate to `/api/users/wallet/[YOUR_PUBLIC_KEY]`
- [ ] Verify: API returns user object
- [ ] Verify: User object has:
  - [ ] `wallet` = Your Stellar public key (G...)
  - [ ] `username` = Entered username
  - [ ] `email` = Entered email

---

## Phase 3: Manual Testing - Returning User

### Test B.1: Close and Reopen
- [ ] Close browser tab/window
- [ ] Reopen app
- [ ] Verify: Page shows "Loading..." or "Connecting..."
- [ ] Verify: App auto-connects to Freighter wallet
- [ ] Verify: No Connect Wallet modal appears
- [ ] Verify: Dashboard/content loads automatically

### Test B.2: Verify Auto-Connect Data
- [ ] Check DevTools → Application → localStorage
- [ ] Verify: All stellar_* keys still present
- [ ] Verify: Session data is consistent
- [ ] Check DevTools → Application → sessionStorage
- [ ] Verify: `wallet` key contains public key

### Test B.3: Session Persistence Across Pages
- [ ] Navigate to different protected routes:
  - [ ] `/dashboard/home`
  - [ ] `/dashboard/stream-manager`
  - [ ] `/settings/profile`
- [ ] Verify: No "Connect Wallet" modal appears
- [ ] Verify: All pages load normally
- [ ] Verify: User data stays consistent

---

## Phase 4: Manual Testing - Disconnect & Reconnect

### Test C.1: Disconnect Wallet
- [ ] Click profile icon/dropdown menu
- [ ] Click "Disconnect" or "Logout"
- [ ] Verify: Modal/confirmation appears (if shown)
- [ ] Click "Confirm" or "Yes"
- [ ] Verify: Redirect to home page

### Test C.2: Verify Complete Cleanup
- [ ] Check DevTools → Application → localStorage
- [ ] Verify: `stellar_auto_connect` is removed
- [ ] Verify: `stellar_last_wallet` is removed
- [ ] Verify: `wallet` is removed
- [ ] Check DevTools → Application → sessionStorage
- [ ] Verify: `wallet` is removed
- [ ] Check DevTools → Cookies
- [ ] Verify: Session cookie is cleared or expired

### Test C.3: Protected Routes After Disconnect
- [ ] Try to navigate to `/dashboard`
- [ ] Verify: Redirect to `/explore` or home
- [ ] Verify: Connect Wallet modal appears
- [ ] Verify: Cannot access protected content

### Test C.4: Reconnect with Same Wallet
- [ ] Click "Connect Wallet" in modal
- [ ] Select Freighter again
- [ ] Verify: Reconnection succeeds
- [ ] Verify: Same public key displayed
- [ ] Verify: User data loads correctly

---

## Phase 5: Manual Testing - Multi-Wallet Support

### Test D.1: Switch Wallets (Freighter → Albedo)
- [ ] Currently connected with Freighter
- [ ] Click profile → Settings
- [ ] Click "Change Wallet" or "Connect Different Wallet"
- [ ] Disconnect current wallet
- [ ] Connect with Albedo wallet
- [ ] Verify: Connection succeeds
- [ ] Verify: Different public key shown (if using different account)

### Test D.2: Verify Database Updated
- [ ] Open DevTools → Network
- [ ] Check API call to `/api/users/wallet/[NEW_KEY]`
- [ ] Verify: User data retrieved with new wallet
- [ ] Verify: All streams/data associated with new wallet

### Test D.3: Switch to Third Wallet (xBull)
- [ ] Disconnect Albedo
- [ ] Connect with xBull wallet
- [ ] Verify: Connection succeeds
- [ ] Verify: Correct wallet address used

---

## Phase 6: Manual Testing - Protected Routes

### Test E: All Protected Routes

For each route below, verify:
1. Route requires wallet connection
2. Shows Connect Wallet modal when not connected
3. Loads content when connected
4. Clears and shows modal again when disconnected

- [ ] `/dashboard` - Main dashboard
- [ ] `/dashboard/home` - Dashboard home
- [ ] `/dashboard/stream-manager` - Stream management
- [ ] `/dashboard/stream-url` - Stream URL/settings
- [ ] `/dashboard/payout` - Payout management
- [ ] `/dashboard/recordings` - Recording history
- [ ] `/settings/profile` - User profile
- [ ] `/settings/appearance` - Theme/appearance settings
- [ ] `/settings/privacy` - Privacy settings
- [ ] `/settings/notifications` - Notification settings
- [ ] `/settings/connected-accounts` - Connected accounts
- [ ] `/settings/stream-preference` - Stream preferences

---

## Phase 7: Manual Testing - API Integration

### Test F.1: Create Stream
- [ ] Verify wallet is connected
- [ ] Navigate to `/dashboard/stream-manager`
- [ ] Click "Create Stream"
- [ ] Fill in stream details
- [ ] Submit form
- [ ] Verify: API call succeeds (check Network tab)
- [ ] Verify: Response includes wallet address
- [ ] Verify: Stream appears in list

### Test F.2: Verify Stream in Database
- [ ] Open DevTools → Network
- [ ] Make API call to `/api/streams/[wallet_address]`
- [ ] Verify: Returns streams for your wallet
- [ ] Verify: Created stream appears in response
- [ ] Verify: Stream has correct wallet association

### Test F.3: Update User Profile
- [ ] Navigate to `/settings/profile`
- [ ] Update username or bio
- [ ] Click "Save"
- [ ] Verify: API call to `/api/users/updates/[wallet]` succeeds
- [ ] Verify: Profile updates reflected in UI
- [ ] Verify: Change persists on reload

### Test F.4: Fetch User by Wallet API
- [ ] Open DevTools → Network
- [ ] Make request: `GET /api/users/wallet/[YOUR_PUBLIC_KEY]`
- [ ] Verify: Returns 200 OK
- [ ] Verify: Response contains user object
- [ ] Verify: User data matches profile

---

## Phase 8: Manual Testing - Error Scenarios

### Test G.1: Wallet Extension Not Installed
- [ ] Disable wallet extension (or use browser without it)
- [ ] Try to connect wallet
- [ ] Verify: Error message shown (e.g., "Wallet not installed")
- [ ] Verify: Clear error message explaining what's needed
- [ ] Verify: UI doesn't hang or break

### Test G.2: User Rejects Connection
- [ ] Try to connect wallet
- [ ] Click "Reject" in wallet popup
- [ ] Verify: Modal stays open (doesn't close)
- [ ] Verify: Error message shown
- [ ] Verify: Can retry connection

### Test G.3: Network Timeout
- [ ] Open DevTools → Network → Throttle to "Offline"
- [ ] Try to connect wallet
- [ ] Verify: Timeout error appears
- [ ] Verify: Friendly error message shown
- [ ] Restore network and retry

### Test G.4: Multiple Tabs
- [ ] Open app in 2 browser tabs
- [ ] Connect wallet in Tab 1
- [ ] Switch to Tab 2
- [ ] Verify: Session is consistent across tabs
- [ ] Verify: No modal appears in Tab 2
- [ ] Disconnect in Tab 1
- [ ] Switch to Tab 2
- [ ] Verify: Modal appears (or page redirects)

### Test G.5: Invalid Wallet Address
- [ ] Open DevTools → Network
- [ ] Manually send API request with invalid wallet:
  ```
  GET /api/users/wallet/INVALID_ADDRESS_123
  ```
- [ ] Verify: Returns 400 Bad Request (or 404)
- [ ] Verify: Error message returned

---

## Phase 9: Build & Deployment

### Test H.1: Build Succeeds
- [ ] Run `npm run build`
- [ ] Verify: No build errors
- [ ] Verify: Output directory created
- [ ] Check: No warnings related to auth

### Test H.2: Type Checking Passes
- [ ] Run `npm run type-check`
- [ ] Verify: No TypeScript errors
- [ ] Verify: All types resolve correctly

### Test H.3: Linting Passes
- [ ] Run `npm run lint`
- [ ] Verify: No linting errors
- [ ] Verify: Code follows project standards

### Test H.4: All Tests Pass (Final Check)
- [ ] Run `npm test`
- [ ] Verify: 89 tests pass
- [ ] Verify: No skipped tests
- [ ] Run `npm run test:ci` (CI environment)
- [ ] Verify: CI environment test passes

---

## Phase 10: Create Loom Video Recording

### Video Requirements
Record a video demonstrating the complete user flow:

#### Segment 1: First-Time Setup (2-3 min)
- [ ] Show landing page (no wallet connected)
- [ ] Navigate to protected route
- [ ] Show Connect Wallet modal
- [ ] Open wallet extension (Freighter)
- [ ] Approve connection
- [ ] Profile registration screen
- [ ] Fill username and email
- [ ] Submit registration
- [ ] Show dashboard loads

#### Segment 2: Auto-Connect (1-2 min)
- [ ] Close browser tab (or browser)
- [ ] Reopen to same URL
- [ ] Show "Loading..." screen
- [ ] Auto-connect happens (no modal)
- [ ] Dashboard loads automatically
- [ ] Open DevTools → localStorage
- [ ] Show stellar_* keys present

#### Segment 3: Disconnect Flow (1-2 min)
- [ ] Navigate to settings/profile
- [ ] Click disconnect/logout button
- [ ] Confirm disconnection
- [ ] Verify redirect to home
- [ ] Open DevTools → localStorage
- [ ] Show stellar_* keys are gone
- [ ] Try to access protected route
- [ ] Show modal appears again

#### Segment 4: Test Execution (2-3 min)
- [ ] Open terminal
- [ ] Run `npm test`
- [ ] Show all 89 tests passing
- [ ] Show test output summary
- [ ] Run `npm run test:coverage`
- [ ] Show coverage report

#### Segment 5: Database Verification (1 min)
- [ ] Open DevTools → Network
- [ ] Make API call to `/api/users/wallet/[KEY]`
- [ ] Show successful response
- [ ] Show user object with Stellar wallet

**Total Video Length:** 7-11 minutes

---

## Sign-Off Checklist

### Development Team
- [ ] All 89 automated tests pass
- [ ] Coverage meets targets (80%+)
- [ ] Code builds without errors
- [ ] TypeScript type checking passes
- [ ] ESLint passes

### QA Team
- [ ] All manual test scenarios pass
- [ ] No console errors during testing
- [ ] Error messages are clear and helpful
- [ ] UI/UX flows are smooth
- [ ] Performance is acceptable

### DevOps/Deployment
- [ ] Build pipeline passes
- [ ] Deploy to staging succeeds
- [ ] Production deployment ready
- [ ] Monitoring configured
- [ ] Rollback plan in place

### Product Owner
- [ ] All requirements met
- [ ] User flows work as expected
- [ ] Security validated
- [ ] Ready for release

---

## Issues Found & Resolution Log

| Issue | Status | Resolution | Date |
|-------|--------|-----------|------|
| | ✅ | | |
| | ✅ | | |
| | ✅ | | |

---

## Sign-Off

- [ ] QA Lead: _________________________ Date: _______
- [ ] Tech Lead: ________________________ Date: _______
- [ ] Product Owner: ____________________ Date: _______

---

## Next Steps After Sign-Off

1. [ ] Create PR with all changes
2. [ ] Include Loom video link in PR
3. [ ] Submit for final code review
4. [ ] Merge to main branch
5. [ ] Deploy to production
6. [ ] Monitor for issues
7. [ ] Celebrate 🎉

---

**Status:** Ready for Testing ✅
**Test Files Created:** 4
**Total Tests:** 89
**Expected Pass Rate:** 100%
