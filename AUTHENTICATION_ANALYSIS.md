# Authentication System Analysis

## Current Authentication Flow

The authentication system checks user access in the following order (in `AuthContext.tsx`):

1. **FIRST**: Check Stripe subscription (primary user with active subscription)
2. **THIRD**: Check if user is a sub-user in `subscription_users` table
   - If sub-user found, check if PRIMARY user has active Stripe subscription
   - **PROBLEM**: Only checks Stripe, not wire transfer subscriptions
3. **FOURTH**: Check if user is a wire transfer subscription user

## Issue Identified: Sub-Users of Wire Transfer Users

### The Problem

When a sub-user of a wire transfer subscription user tries to login (e.g., `PDisman@thinkbrg.com`):

1. User logs in via Kinde authentication ✅
2. System checks if user has Stripe subscription ❌ (they don't)
3. System checks if user is a sub-user ✅ (found in `subscription_users` table under `kzeien@thinkbrg.com`)
4. System checks if PRIMARY user (`kzeien@thinkbrg.com`) has active Stripe subscription ❌
   - **This check fails because the primary user is a WIRE TRANSFER user, not a Stripe user**
5. System then checks if the LOGGING IN user is a wire transfer user ❌ (they're not, the primary user is)
6. **Result**: Sub-user is DENIED access even though their primary user has an active wire transfer subscription

### Current Code Flow (AuthContext.tsx lines 119-168)

```typescript
// THIRD: If no Stripe subscription, check if user is a sub user
const subUserResponse = await fetch("/api/subscription-users");
let isSubUser = false;
let primaryUserEmail = null;

if (subUserResponse.ok) {
  const subUserData = await subUserResponse.json();
  isSubUser = subUserData.isSubUser;
  primaryUserEmail = subUserData.primaryUser;
  
  // If user is a sub user, check if their primary user has an active subscription
  if (isSubUser && primaryUserEmail) {
    // ❌ PROBLEM: Only checks Stripe subscription, not wire transfer
    const primaryUserStripeResponse = await fetch("/api/stripe/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: primaryUserEmail }),
    });
    
    if (primaryUserStripeResponse.ok) {
      const primaryUserStripeData = await primaryUserStripeResponse.json();
      const primaryUserHasActiveSubscription = primaryUserStripeData.status === 'active';
      
      if (primaryUserHasActiveSubscription) {
        // Grant access
      } else {
        // ❌ Denies access - but primary user might be wire transfer user!
      }
    }
  }
}

// FOURTH: Check wire transfer (only checks the LOGGING IN user, not their primary user)
const wireTransferResponse = await fetch("/api/wire-transfer-subscriptions");
// This only checks if PDisman@thinkbrg.com is a wire transfer user
// It doesn't check if kzeien@thinkbrg.com (the primary user) is a wire transfer user
```

## Specific Case: PDisman@thinkbrg.com

### Database Structure (from insert_thinkbrg_transferred_subscriptions.sql)

- **Primary User**: `kzeien@thinkbrg.com` (wire transfer subscription user)
- **Sub-Users**: 
  - `ykubrom@thinkbrg.com`
  - `LStroger@thinkbrg.com`
  - `PDisman@thinkbrg.com`

### What Happens When PDisman@thinkbrg.com Logs In

1. ✅ Kinde authentication succeeds
2. ❌ No Stripe subscription found for `PDisman@thinkbrg.com`
3. ✅ Found as sub-user in `subscription_users` table (primary: `kzeien@thinkbrg.com`)
4. ❌ Checks if `kzeien@thinkbrg.com` has Stripe subscription → **FAILS** (they're wire transfer)
5. ❌ Checks if `PDisman@thinkbrg.com` is wire transfer user → **FAILS** (only primary user is)
6. ❌ **Access DENIED** - User redirected to subscribe page

### Expected Behavior

Sub-users of wire transfer subscription users should have access because:
- Their primary user (`kzeien@thinkbrg.com`) has an active wire transfer subscription
- Sub-users should inherit access from their primary user regardless of subscription type

## Solution Required

The authentication flow needs to be updated to:

1. When a sub-user is detected, check BOTH:
   - If primary user has active Stripe subscription, OR
   - If primary user has active wire transfer subscription

2. If either check passes, grant access to the sub-user

## Files That Need Changes

1. **`src/context/AuthContext.tsx`** (lines 133-166)
   - Update sub-user primary user check to include wire transfer subscriptions

2. **`src/app/api/subscription-users/route.ts`** (optional)
   - Could add a helper to check primary user's subscription status (both types)

## Current Access Logic

Access is granted if ANY of these are true:
- `auth.hasActiveSubscription` (Stripe subscription)
- `auth.isSubUser` (Sub-user with primary user having active subscription)
- `auth.isWireTransferUser` (Wire transfer subscription user)

**The gap**: Sub-users of wire transfer users don't get `isSubUser = true` because the primary user check only looks at Stripe.

