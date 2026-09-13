# Physiotherapy Center --- Manager Packages & Access Control Plan

## 1. Purpose
 
This plan defines a simple, safe, and expandable way to introduce three
commercial Manager packages into the already-built Physiotherapy Center
application:

1.  **Basic Manager**
2.  **Advanced Manager**
3.  **Premium Manager**

The application already exists and already uses user roles. Therefore,
this implementation must **extend the existing role-based authorization
system rather than introduce a new complex
entitlement/feature-permission architecture**.

The primary goal is to sell different levels of Manager functionality
without requiring another major authorization redesign later.

------------------------------------------------------------------------

# 2. Core Design Decision

## Use three Manager roles

Create these three Manager role values:

``` text
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

The application should continue to have:

``` text
OWNER
SECRETARY
THERAPIST
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

If the application already has other legitimate roles, preserve them
unless there is a documented reason to change them.

## Important

Do **not** create three separate user accounts for the same Manager.

There must be only one account per person.

Example:

``` text
Ahmed
Role: MANAGER_BASIC
```

If the center upgrades Ahmed:

``` text
Ahmed
Role: MANAGER_ADVANCED
```

If the center later upgrades again:

``` text
Ahmed
Role: MANAGER_PREMIUM
```

The user's identity, data, history, appointments, sessions, audit
records, and account remain the same.

Only the Manager access level changes.

------------------------------------------------------------------------

# 3. Owner Role

The developer/platform Owner remains:

``` text
OWNER
```

The Owner must NOT be converted into `MANAGER_PREMIUM`.

The Owner is a special administrative role with full application and
platform control.

## OWNER has:

-   All Basic functionality
-   All Advanced functionality
-   All Premium functionality
-   User management
-   Manager package assignment
-   System configuration
-   Application administration
-   Security administration
-   Commercial/package administration
-   Developer/platform-only functionality
-   Any existing Owner-only functionality

The Owner role is therefore **outside the commercial Manager packages**.

## Golden rule

``` text
OWNER != PREMIUM MANAGER
```

Premium means:

> All commercially available customer/center functionality.

Owner means:

> Full platform/developer control.

This prevents future Premium features from accidentally becoming
developer-level capabilities.

------------------------------------------------------------------------

# 4. Manager Package Model

The commercial package model is:

``` text
BASIC
ADVANCED
PREMIUM
```

The technical Manager roles are:

``` text
BASIC    -> MANAGER_BASIC
ADVANCED -> MANAGER_ADVANCED
PREMIUM  -> MANAGER_PREMIUM
```

The package selected for a Manager determines the Manager role.

------------------------------------------------------------------------

# 5. Package Hierarchy

The packages are cumulative.

``` text
MANAGER_BASIC
    ↓
Basic Manager functionality

MANAGER_ADVANCED
    ↓
Basic + Advanced functionality

MANAGER_PREMIUM
    ↓
Basic + Advanced + Premium functionality
```

Therefore:

``` text
Premium includes Advanced
Advanced includes Basic
Premium includes Basic
```

Do not duplicate authorization logic unnecessarily.

The implementation should preferably use role checks that reflect the
hierarchy where practical.

For example, conceptually:

``` text
MANAGER_BASIC    = level 1
MANAGER_ADVANCED = level 2
MANAGER_PREMIUM  = level 3
```

However, do not introduce a separate database permission framework just
to achieve this. Reuse the existing authorization architecture.

------------------------------------------------------------------------

# 6. Basic Manager

## Purpose

The Basic Manager package is intended for normal daily operation and
basic management of the physiotherapy center.

Basic Manager should have access to the normal operational features
required to manage the center without advanced/professional add-ons.

### Expected Basic Manager access

``` text
Dashboard
Calendar
Appointments
Patients
Sessions
Invoices
Expenses
Packages
Basic Reports
Waitlist
Basic User/Staff management where currently appropriate
Basic Settings where currently appropriate
```

The exact final list must be reconciled with the application's existing
implementation before coding.

## Basic Manager must NOT automatically receive:

``` text
Advanced Reports
Advanced Analytics
Advanced Inventory functionality
Advanced Equipment functionality
Premium functionality
AI/pro features
Commercial add-ons
Developer/platform administration
```

------------------------------------------------------------------------

# 7. Advanced Manager

## Purpose

Advanced Manager provides everything in Basic plus selected advanced
center-management capabilities.

Conceptually:

``` text
MANAGER_ADVANCED
=
Basic Manager
+
Advanced Features
```

Potential Advanced features include:

``` text
Advanced Reports
Advanced Analytics
Advanced Inventory
Equipment Management
Recurring Appointments
Advanced Waitlist functionality
Advanced Package functionality
Advanced Expenses
Advanced Scheduling
Staff Performance
Advanced dashboards
Advanced exports
Other existing advanced features
```

The exact Advanced list must be based on the actual features already
present in the application.

Do not invent new application functionality during this access-control
implementation.

------------------------------------------------------------------------

# 8. Premium Manager

## Purpose

Premium Manager provides all commercially available Manager
functionality.

Conceptually:

``` text
MANAGER_PREMIUM
=
Basic
+
Advanced
+
Premium
```

Potential Premium features include:

``` text
All Advanced functionality
AI features
Premium analytics
Advanced automation
Premium reporting
Premium notifications
Integrations
Other existing premium/pro features
```

Again, the final list must be determined from the actual application.

## Premium does NOT mean:

``` text
Developer access
Platform administration
Security administration
System maintenance
Database administration
Commercial plan administration
Owner-only controls
```

Those remain Owner-only.

------------------------------------------------------------------------

# 9. Existing Application Sidebar

The existing sidebar contains areas such as:

``` text
CORE OPERATIONS
- Dashboard
- Calendar
- Appointments

CLINICAL CARE
- Patients
- Sessions

FINANCIAL
- Invoices
- Expenses
- Packages
- Reports

PRO ADD-ONS
- Add-Ons & Pro Features

ADMINISTRATION
- Users
- Inventory
- Equipment
- Waitlist
- Settings
```

The implementation must use the existing application structure.

Do not redesign the entire sidebar.

Instead, conditionally show or hide individual navigation items
according to the Manager role.

For example:

``` text
MANAGER_BASIC
    Show: Basic operational navigation
    Hide: Advanced/Premium navigation

MANAGER_ADVANCED
    Show: Basic + Advanced navigation
    Hide: Premium-only navigation

MANAGER_PREMIUM
    Show: Basic + Advanced + Premium navigation
```

------------------------------------------------------------------------

# 10. Frontend Access Control

The frontend should provide a good user experience by hiding features
that the current Manager cannot use.

For example:

``` text
MANAGER_BASIC
```

should not normally see:

``` text
Add-Ons & Pro Features
Advanced Reports
Premium-only pages
```

if those areas are outside the Basic package.

However:

## Frontend hiding is NOT security.

A user must not gain access merely by manually entering a URL.

Therefore every protected feature must also be enforced by the backend.

------------------------------------------------------------------------

# 11. Backend Authorization

The backend is the real security boundary.

Every protected Manager API endpoint must verify that the authenticated
user's role is allowed to access it.

Conceptually:

``` text
Request
   ↓
Authentication
   ↓
Tenant/Center validation
   ↓
Role authorization
   ↓
Allow or reject
```

Examples:

``` text
MANAGER_BASIC
    -> Basic endpoint: ALLOW
    -> Advanced endpoint: DENY
    -> Premium endpoint: DENY

MANAGER_ADVANCED
    -> Basic endpoint: ALLOW
    -> Advanced endpoint: ALLOW
    -> Premium endpoint: DENY

MANAGER_PREMIUM
    -> Basic endpoint: ALLOW
    -> Advanced endpoint: ALLOW
    -> Premium endpoint: ALLOW

OWNER
    -> All: ALLOW
```

Use the application's existing authentication and authorization
middleware wherever possible.

Do not create a second independent authorization mechanism.

------------------------------------------------------------------------

# 12. Package Assignment

The Owner should be able to assign the Manager package.

Recommended UI:

``` text
Users
  ↓
Select Manager
  ↓
Manager Package
  ├── Basic
  ├── Advanced
  └── Premium
```

Example:

``` text
User: Ahmed Ali
Role: Manager

Manager Package:
( ) Basic
(●) Advanced
( ) Premium

[Save]
```

When the Owner selects Advanced, the system assigns:

``` text
MANAGER_ADVANCED
```

When Basic is selected:

``` text
MANAGER_BASIC
```

When Premium is selected:

``` text
MANAGER_PREMIUM
```

The UI should display friendly names while the database uses stable
technical enum values.

------------------------------------------------------------------------

# 13. Recommended Role Names

Database/API values:

``` text
OWNER
SECRETARY
THERAPIST
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

Display names:

``` text
Owner
Secretary
Therapist
Manager — Basic
Manager — Advanced
Manager — Premium
```

Never use display names as authorization values.

Authorization must use stable role identifiers.

------------------------------------------------------------------------

# 14. Database Changes

Before changing the schema, inspect the existing Prisma schema and
existing Role enum/model.

If the project uses a Prisma enum similar to:

``` prisma
enum Role {
  OWNER
  SECRETARY
  THERAPIST
  MANAGER
}
```

the implementation should carefully migrate the existing Manager role.

Do NOT blindly delete the existing `MANAGER` value.

First determine how existing Manager users are stored and what the
current application expects.

## Preferred migration approach

If existing `MANAGER` users exist:

1.  Add:

    ``` text
    MANAGER_BASIC
    MANAGER_ADVANCED
    MANAGER_PREMIUM
    ```

2.  Decide whether legacy `MANAGER` should:

    -   be migrated to `MANAGER_BASIC`, or
    -   remain temporarily for backward compatibility.

3.  Migrate existing Manager users deliberately.

4.  Update all authorization checks.

5.  Verify no code still depends incorrectly on the old `MANAGER` value.

6.  Remove the legacy role only after migration and testing are
    complete, if safe.

Never perform destructive role changes without checking existing
production/development data.

------------------------------------------------------------------------

# 15. Backward Compatibility

The implementation must protect existing users.

Before migration:

``` text
Existing Manager
```

After migration:

``` text
Existing Manager
    ↓
MANAGER_BASIC
```

unless the Owner explicitly decides otherwise.

Existing user data must remain intact:

``` text
User ID
Name
Email
Password/authentication
Appointments
Patients
Sessions
Invoices
Expenses
Reports
Audit records
Created dates
Updated dates
```

Only authorization level changes.

------------------------------------------------------------------------

# 16. Do Not Duplicate Users

Never implement:

``` text
Ahmed Basic Manager
Ahmed Advanced Manager
Ahmed Premium Manager
```

as separate accounts.

Correct:

``` text
Ahmed
    ↓
MANAGER_BASIC
```

then:

``` text
Ahmed
    ↓
MANAGER_ADVANCED
```

then:

``` text
Ahmed
    ↓
MANAGER_PREMIUM
```

One person = one account.

One Manager account = one current package.

------------------------------------------------------------------------

# 17. Package Purchase vs Package Assignment

For the first implementation, keep these concepts simple.

The system needs to support:

``` text
Manager Package:
Basic / Advanced / Premium
```

The Owner can assign/change the package.

If online payment/subscription billing already exists or is added later,
the payment/subscription system can eventually control whether the
package is active.

Do NOT build a complete billing platform unless the existing project
already requires it.

The current goal is:

``` text
Package
    ↓
Manager role
    ↓
Access
```

------------------------------------------------------------------------

# 18. Future-Proofing

This approach is intentionally simple, but it should not block future
development.

Later, the application may support:

``` text
Subscription status
Trial periods
Expiration dates
Grace periods
Automatic renewal
Online payments
Invoices for subscriptions
Add-on purchases
Per-feature purchases
Multiple centers
Multiple managers
```

Those can be added later if required.

For now, do not create an unnecessarily complicated feature-entitlement
system.

------------------------------------------------------------------------

# 19. Add-Ons & Pro Features

The existing:

``` text
Add-Ons & Pro Features
```

area should be treated separately from the Owner's developer controls.

For Manager users:

### Basic Manager

May see a limited upgrade/promotion page if desired, but cannot use
Premium functionality.

### Advanced Manager

May see Premium upgrade/add-on options.

### Premium Manager

May access commercially available Premium functionality.

### Owner

Has full management/control of the commercial configuration.

The exact behavior should be determined from the existing Add-Ons
implementation before coding.

------------------------------------------------------------------------

# 20. Authorization Rules

The core rules should be documented and tested as follows.

## Rule 1 --- Owner

``` text
OWNER → full access
```

## Rule 2 --- Basic Manager

``` text
MANAGER_BASIC
→ Basic Manager functionality only
```

## Rule 3 --- Advanced Manager

``` text
MANAGER_ADVANCED
→ Basic + Advanced functionality
```

## Rule 4 --- Premium Manager

``` text
MANAGER_PREMIUM
→ Basic + Advanced + Premium functionality
```

## Rule 5 --- No privilege escalation

A Basic Manager must never be able to change their own role to:

``` text
MANAGER_ADVANCED
MANAGER_PREMIUM
OWNER
```

## Rule 6 --- Manager cannot assign Owner

A Manager must never be able to promote themselves or another user to:

``` text
OWNER
```

unless an existing Owner-only administrative workflow explicitly permits
it.

## Rule 7 --- Package assignment is Owner-controlled

Only the Owner or an already-authorized platform administrator should
change a Manager's package.

## Rule 8 --- Backend enforcement

Removing a sidebar item does not replace backend authorization.

------------------------------------------------------------------------

# 21. Authorization Helper

If the application already has role helper functions, extend them rather
than creating a completely new system.

Conceptually:

``` text
isOwner(user)

isManagerBasic(user)

isManagerAdvanced(user)

isManagerPremium(user)

isManager(user)
```

Potential hierarchy helper:

``` text
getManagerLevel(user)
```

returning:

``` text
0 = not a Manager
1 = Basic
2 = Advanced
3 = Premium
```

This is optional and should only be introduced if it simplifies the
existing code.

The implementation should favor clear, readable authorization over
clever abstractions.

------------------------------------------------------------------------

# 22. Example Authorization Matrix

  --------------------------------------------------------------------------------
  Capability                    Owner  Manager Basic        Manager        Manager
                                                           Advanced        Premium
  -------------------- -------------- -------------- -------------- --------------
  Dashboard                         ✓              ✓              ✓              ✓

  Calendar                          ✓              ✓              ✓              ✓

  Appointments                      ✓              ✓              ✓              ✓

  Patients                          ✓              ✓              ✓              ✓

  Sessions                          ✓              ✓              ✓              ✓

  Invoices                          ✓              ✓              ✓              ✓

  Expenses                          ✓              ✓              ✓              ✓

  Packages                          ✓              ✓              ✓              ✓

  Basic Reports                     ✓              ✓              ✓              ✓

  Advanced Reports                  ✓              ✗              ✓              ✓

  Inventory                         ✓              ✗              ✓              ✓

  Equipment                         ✓              ✗              ✓              ✓

  Advanced Waitlist                 ✓              ✗              ✓              ✓

  Premium Features                  ✓              ✗              ✗              ✓

  Add-ons                           ✓     Restricted     Restricted              ✓

  User administration               ✓     Restricted     Restricted     Restricted

  Package assignment                ✓              ✗              ✗              ✗

  System                            ✓              ✗              ✗              ✗
  administration                                                    

  Developer/platform                ✓              ✗              ✗              ✗
  controls                                                          
  --------------------------------------------------------------------------------

This matrix is a starting point.

The final matrix must be created after reviewing the application's
actual pages, API routes, and current role checks.

------------------------------------------------------------------------

# 23. Important: Do Not Guess Feature Boundaries

Before implementing the package restrictions, inspect the existing
application.

Create an inventory of:

``` text
Frontend pages
Frontend navigation items
Backend API routes
Backend middleware
Existing role checks
Existing permission checks
Existing Prisma role definitions
Existing Add-On/Pro functionality
Existing Manager functionality
Existing Owner-only functionality
```

Then map each existing feature to:

``` text
BASIC
ADVANCED
PREMIUM
OWNER_ONLY
```

Do not assume that every item in the sidebar belongs to the same
commercial tier.

For example, Inventory may be Advanced while some Inventory operations
may remain Owner-only.

------------------------------------------------------------------------

# 24. Implementation Sequence

## Phase 1 --- Audit

Inspect:

``` text
Prisma schema
Authentication
User model
Role enum/model
Authorization middleware
Frontend auth state
Sidebar/navigation
Manager pages
Manager API routes
Owner pages
Add-On/Pro functionality
```

Do not modify code during the initial audit unless necessary to
reproduce or diagnose an issue.

------------------------------------------------------------------------

## Phase 2 --- Define the Package Matrix

Create a definitive matrix:

``` text
Feature
Basic Manager
Advanced Manager
Premium Manager
Owner
```

Every existing Manager-facing feature must have a decision.

No ambiguous features should remain.

------------------------------------------------------------------------

## Phase 3 --- Database Role Migration

Add:

``` text
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

Safely migrate existing Managers.

Preserve all existing user data.

Run the appropriate Prisma migration and verify the resulting database.

------------------------------------------------------------------------

## Phase 4 --- Backend Authorization

Update backend authorization.

Ensure:

``` text
Basic → Basic only
Advanced → Basic + Advanced
Premium → Basic + Advanced + Premium
Owner → Everything
```

Test direct API access, not only the UI.

------------------------------------------------------------------------

## Phase 5 --- Frontend Authorization

Update:

``` text
Sidebar
Routes
Buttons
Pages
Actions
Menus
```

so the visible application matches the Manager package.

A user should not see functionality they cannot use unless the UI
intentionally presents it as an upgrade option.

------------------------------------------------------------------------

## Phase 6 --- Owner Package Management

Add a simple Owner-controlled UI:

``` text
Users
→ Manager
→ Manager Package
→ Basic / Advanced / Premium
→ Save
```

Changing the package changes the Manager role.

------------------------------------------------------------------------

## Phase 7 --- Testing

Test at minimum:

### Basic Manager

``` text
Login ✓
Basic pages ✓
Basic APIs ✓
Advanced pages blocked ✓
Advanced APIs blocked ✓
Premium pages blocked ✓
Premium APIs blocked ✓
Cannot change own role ✓
Cannot access Owner functions ✓
```

### Advanced Manager

``` text
Basic pages ✓
Advanced pages ✓
Basic APIs ✓
Advanced APIs ✓
Premium pages blocked ✓
Premium APIs blocked ✓
Cannot access Owner functions ✓
```

### Premium Manager

``` text
Basic pages ✓
Advanced pages ✓
Premium pages ✓
Basic APIs ✓
Advanced APIs ✓
Premium APIs ✓
Cannot access Owner-only controls ✓
```

### Owner

``` text
All intended application functions ✓
Manager package assignment ✓
Owner-only administration ✓
```

------------------------------------------------------------------------

# 25. Security Testing

Do not test only by clicking the UI.

For every restricted endpoint, verify that a lower-tier Manager cannot
access it by:

``` text
Direct URL
Direct API request
Browser developer tools
Manually constructed request
Changing frontend state
Changing local storage
Changing client-side role information
```

The server must reject unauthorized requests.

Expected response should follow the application's existing API
conventions, normally something equivalent to:

``` text
403 Forbidden
```

Do not expose sensitive authorization details in the error response.

------------------------------------------------------------------------

# 26. Role Switching / Package Upgrade

When Owner changes:

``` text
MANAGER_BASIC
```

to:

``` text
MANAGER_ADVANCED
```

the change should take effect according to the application's existing
authentication/session architecture.

If roles are stored in a JWT/session, determine how the application
currently refreshes role information.

Do not assume that changing the database automatically changes an
already-issued token.

The implementation must verify:

``` text
Database role
Session role
JWT role, if applicable
Frontend auth state
```

remain consistent.

------------------------------------------------------------------------

# 27. Downgrade Handling

Example:

``` text
Premium → Advanced
```

The user must immediately or predictably lose Premium access according
to the application's session policy.

Do not delete the user's data simply because access was downgraded.

For example:

``` text
Premium report data
Premium settings
Premium-created records
```

should remain safe unless there is an explicit business requirement to
remove them.

The downgrade changes access, not historical data.

------------------------------------------------------------------------

# 28. Recommended User Experience

When the Owner edits a Manager:

``` text
Manager Package

┌──────────────────────────────┐
│ ○ Basic                      │
│   Daily management           │
│                              │
│ ● Advanced                   │
│   Basic + advanced features │
│                              │
│ ○ Premium                    │
│   Complete manager features │
└──────────────────────────────┘

[Save Package]
```

The UI should clearly explain that changing the package changes the
Manager's available functionality.

------------------------------------------------------------------------

# 29. No Three-Account Model

This is a strict architectural rule.

DO NOT create:

``` text
manager.basic@example.com
manager.advanced@example.com
manager.premium@example.com
```

for the same person.

DO create:

``` text
manager@example.com
```

with one of:

``` text
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

at any given time.

------------------------------------------------------------------------

# 30. No New Permission System Unless Necessary

Do not implement:

``` text
Feature
FeaturePermission
UserFeature
RoleFeature
PlanFeature
Entitlement
```

just for this requirement.

That would add unnecessary complexity to an already-built application.

The first implementation should use the application's existing
role-based authorization.

Only introduce a separate entitlement system later if a real business
requirement makes the three-role model insufficient.

------------------------------------------------------------------------

# 31. Future Extension

If the business eventually needs:

``` text
Premium + AI Add-on
Advanced + WhatsApp Add-on
Basic + SMS Add-on
Per-user feature grants
Feature expiration
Feature-level billing
Multiple subscriptions
```

then a more granular entitlement system can be introduced as a separate
future phase.

That is deliberately outside the scope of this implementation.

The current architecture should leave room for that possibility without
implementing it prematurely.

------------------------------------------------------------------------

# 32. Final Architecture

The final target is intentionally simple:

``` text
                         OWNER
                           │
                 Full platform access
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      SECRETARY        THERAPIST          MANAGER
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                    BASIC MANAGER   ADVANCED MANAGER   PREMIUM MANAGER
                         │                │                │
                       Basic        Basic + Advanced   Basic + Advanced
                                                         + Premium
```

Technical roles:

``` text
OWNER
SECRETARY
THERAPIST
MANAGER_BASIC
MANAGER_ADVANCED
MANAGER_PREMIUM
```

Commercial packages:

``` text
BASIC
ADVANCED
PREMIUM
```

Mapping:

``` text
BASIC    → MANAGER_BASIC
ADVANCED → MANAGER_ADVANCED
PREMIUM  → MANAGER_PREMIUM
```

------------------------------------------------------------------------

# 33. Final Principles

The implementation must follow these principles:

1.  **Keep the existing application architecture.**
2.  **Use three Manager roles rather than three Manager accounts.**
3.  **One person must have one user account.**
4.  **Owner remains a separate full-control role.**
5.  **Premium Manager is not equivalent to Owner.**
6.  **Advanced includes Basic.**
7.  **Premium includes Advanced and Basic.**
8.  **Owner controls the Manager's package.**
9.  **Frontend restrictions improve UX but do not provide security.**
10. **Backend authorization must enforce every restriction.**
11. **Existing Manager users must be migrated safely.**
12. **Do not delete existing user/business data during role migration.**
13. **Do not introduce a complicated entitlement system unless a real
    requirement demands it.**
14. **Do not implement features that do not already exist merely because
    they appear in this plan as examples.**
15. **Audit the actual application before deciding the final
    Basic/Advanced/Premium feature matrix.**
16. **Test direct API access as well as the frontend.**
17. **Build Owner package management now so future package changes do
    not require code changes.**
18. **Keep the design open for future subscription billing/add-ons
    without implementing unnecessary complexity today.**

------------------------------------------------------------------------

# 34. Definition of Done

This implementation is complete only when:

-   [ ] `MANAGER_BASIC` exists.
-   [ ] `MANAGER_ADVANCED` exists.
-   [ ] `MANAGER_PREMIUM` exists.
-   [ ] Existing Manager users have been safely handled.
-   [ ] Owner remains full-control.
-   [ ] Basic Manager can use all approved Basic functionality.
-   [ ] Advanced Manager can use Basic + Advanced functionality.
-   [ ] Premium Manager can use Basic + Advanced + Premium
    functionality.
-   [ ] Restricted frontend pages are hidden or appropriately
    restricted.
-   [ ] Restricted backend endpoints reject unauthorized roles.
-   [ ] Manager cannot self-upgrade.
-   [ ] Manager cannot grant themselves Owner access.
-   [ ] Only authorized Owner functionality can change a Manager
    package.
-   [ ] Owner can change a Manager from Basic to Advanced/Premium and
    back.
-   [ ] Role/session synchronization has been tested.
-   [ ] Existing data remains intact.
-   [ ] Direct URL/API authorization has been tested.
-   [ ] No duplicate Manager accounts are required.
-   [ ] The final feature matrix is documented.
-   [ ] Existing functionality outside the package system has not been
    accidentally removed or broken.

------------------------------------------------------------------------

# 35. Implementation Rule for AI/Coding Agents

When implementing this plan, the coding agent MUST:

1.  Inspect the existing project before modifying it.
2.  Identify the current role model and authorization implementation.
3.  Identify all current Manager checks.
4.  Identify all Owner-only checks.
5.  Identify all existing Manager pages and API endpoints.
6.  Produce a concise impact report before making destructive schema
    changes.
7.  Preserve existing functionality.
8.  Avoid rewriting unrelated files.
9.  Avoid creating a second authorization system.
10. Avoid creating duplicate user accounts.
11. Use database migrations rather than destructive schema manipulation.
12. Verify the application after each logical stage.
13. Run the existing tests, type checks, linting, and build where
    available.
14. Report any unresolved ambiguity instead of inventing business rules.
15. Never silently classify an existing feature as Basic, Advanced, or
    Premium without documenting the decision.
16. Never grant Premium Manager Owner/developer privileges.
17. Never rely solely on frontend role checks for security.
18. Do not proceed to unrelated refactoring while implementing this
    plan.

------------------------------------------------------------------------

# Final Recommendation

For the current Physiotherapy Center application, the recommended
solution is:

``` text
ONE USER
   ↓
ONE MANAGER ROLE AT A TIME
   ↓
┌─────────────────────────────┐
│ MANAGER_BASIC               │
│ MANAGER_ADVANCED             │
│ MANAGER_PREMIUM              │
└─────────────────────────────┘
```

This provides the simplicity of the three-package idea while keeping the
application secure, understandable, and easy to extend.

The next implementation step should be **an audit of the existing
application and creation of the definitive Basic/Advanced/Premium
feature matrix before any code or database migration is changed.**
