# Manager Packages & Security Plan

Based on the rules established in your `Manager_Packages_Access_Control_Plan.md` and `security_plan.md`, I have audited the existing application to propose the definitive **Feature Matrix** and **Security Enforcement Strategy**.

## 1. Schema & Role Audit
Currently, the `Role` enum in `schema.prisma` is:
```prisma
enum Role {
  OWNER
  THERAPIST
  SECRETARY
  PATIENT
}
```
*Note: The `MANAGER` role does not currently exist in the schema.* This simplifies our migration because we do not have to migrate existing `MANAGER` users; we can just safely add the 3 new roles: `MANAGER_BASIC`, `MANAGER_ADVANCED`, `MANAGER_PREMIUM`.

## 2. Proposed Feature Matrix
Here is the proposed assignment of the existing application features across the new packages.

| Application Feature | `MANAGER_BASIC` | `MANAGER_ADVANCED` | `MANAGER_PREMIUM` | `OWNER` |
|----------------------|-----------------|--------------------|-------------------|---------|
| **Core Operations**  |
| Dashboard            | ✓               | ✓                  | ✓                 | ✓       |
| Calendar             | ✓               | ✓                  | ✓                 | ✓       |
| Appointments         | ✓               | ✓                  | ✓                 | ✓       |
| **Clinical Care**    |
| Patients             | ✓               | ✓                  | ✓                 | ✓       |
| Sessions             | ✓               | ✓                  | ✓                 | ✓       |
| **Financial**        |
| Invoices             | ✓               | ✓                  | ✓                 | ✓       |
| Packages             | ✓               | ✓                  | ✓                 | ✓       |
| Expenses             | ✗               | ✓                  | ✓                 | ✓       |
| Reports              | ✗               | ✓                  | ✓                 | ✓       |
| **Administration**   |
| Waitlist             | ✓               | ✓                  | ✓                 | ✓       |
| Inventory            | ✗               | ✓                  | ✓                 | ✓       |
| Equipment            | ✗               | ✓                  | ✓                 | ✓       |
| Settings (Basic)     | ✗               | ✗                  | ✓                 | ✓       |
| **Add-Ons**          |
| Add-Ons & Pro Feat.  | ✗               | ✗                  | ✓                 | ✓       |
| **Platform Control** |
| Users (Staff)        | ✗               | ✗                  | ✗                 | ✓       |
| Package Assignment   | ✗               | ✗                  | ✗                 | ✓       |

### Explanation of Decisions
- **Expenses & Reports**: Placed in `ADVANCED` as these represent financial health overviews which typical front-desk basic managers don't usually access.
- **Inventory & Equipment**: Placed in `ADVANCED` as they represent operational supply-chain management rather than basic daily operations.
- **Settings & Add-Ons**: Placed in `PREMIUM`.
- **Users**: Kept exclusively for `OWNER` so that Managers cannot create/delete staff or assign packages.

---

## 3. Security Enforcement Strategy

We will enforce security at **4 Layers** to ensure that frontend hiding is strictly backed by robust backend validation:

1. **Authentication**: All endpoints will require a valid JWT/session.
2. **Role Authorization**: We will introduce a backend helper `isManagerAdvanced(role)`, `isManagerPremium(role)` to validate the JWT role against the API route. If a `MANAGER_BASIC` attempts to call `GET /api/reports`, the server will return `403 Forbidden`.
3. **Data Authorization (Tenant Isolation)**: All Manager roles will be strictly bound to their center/tenant. This will be preserved exactly as it currently works for the `SECRETARY` and `THERAPIST` roles.
4. **Anti-Escalation**: 
   - `PUT /api/users` routes will be strictly audited so that a Manager cannot upgrade themselves to `MANAGER_ADVANCED`, `MANAGER_PREMIUM`, or `OWNER`.
   - Only `OWNER` can assign packages.

## Open Questions & Approval

> [!WARNING]
> Please review the matrix above carefully. 
> 1. Should `Expenses` be available to the Basic Manager?
> 2. Should `Reports` be split, or is it okay to restrict the entire Reports page to Advanced Managers?
> 3. Does this matrix align perfectly with your vision?

If you approve this matrix, I will proceed to **Phase 3: Database Role Migration** to implement the roles, and then move to the **Backend** and **Frontend Authorization** layers.




no, read this before we start:
Implement only these changes:

Add roles: MANAGER_BASIC, MANAGER_ADVANCED, MANAGER_PREMIUM.
Apply the approved feature matrix exactly as defined.
Access is cumulative: Advanced = Basic + Advanced; Premium = Basic + Advanced + Premium.
OWNER keeps full access and is not a Manager package.
Enforce all package restrictions on the backend/API, not only in the frontend.
Only OWNER can assign/change Manager packages and roles.
Managers must never be able to self-upgrade, access Owner functions, or manage staff/package assignments.
Preserve tenant/center data isolation.
Ensure role/package changes immediately affect existing sessions/JWT access, including downgrades.
Update sidebar, routes, buttons, and pages to match the same permissions.
Do not introduce a separate feature/entitlement system.
Do not refactor unrelated functionality. Test all 4 roles, including direct URL/API access and privilege-escalation attempts.
