# Users App Moqui-Only Migration

**Status:** Implemented and validated against a local Moqui-only runtime

**Frontend branch:** `codex/users-moqui-only-migration`

**Maarg backend branch:** `codex/users-moqui-only-migration`
**API catalog reviewed:** Dev Maarg and demo Maarg Swagger on 2026-07-22

## Goal

Run every Users app workflow through Maarg's Moqui REST surface. The app must
not select an OFBiz `/api/` base, call `performFind`, or invoke OFBiz-style
`service/*` endpoints.

The Vue 3/AccxUI refactor was only a UI migration. This work completes the
runtime/API migration and preserves compatibility with the existing
`OfbizShiroRealm` authentication model used by Maarg.

## Completion criteria

- Every frontend request resolves under `/rest/s1/`.
- No active Users source references `getOmsURL`, `performFind`, `service/*`, or
  `sendResetPasswordMail`.
- Existing Maarg APIs are reused where they cover the workflow.
- New APIs are limited to contracts not already available in Dev Maarg.
- Account creation and password changes keep native Moqui and OFBiz-realm
  credentials synchronized in one transaction.
- Read and mutation workflows pass against a local Moqui-only runtime.
- Browser and backend logs show no `/api/` traffic during the smoke run.
- Unit tests, lint, production build, backend component build, and XML
  validation pass.

## Swagger discovery

Swagger UI accepts a service spec through its `url` query parameter. Change
the path after `service.swagger/` to inspect each family:

```text
https://demo-maarg.hotwax.io/toolstatic/lib/swagger-ui/index.html?url=https://demo-maarg.hotwax.io/rest/service.swagger/admin/user
https://demo-maarg.hotwax.io/rest/service.swagger/admin/groups
https://demo-maarg.hotwax.io/rest/service.swagger/admin/permissions
https://demo-maarg.hotwax.io/rest/service.swagger/oms/parties
```

The scan covered the broad `admin` catalog and the user, groups, permissions,
facilities, product stores, organizations, Shopify shops, parties, customers,
party contact mechanisms, and OMS facilities families.

An `org.apache.ofbiz.*` entity name inside Maarg does not mean the browser is
calling an OFBiz server. The migration boundary is the HTTP origin and REST
base. Maarg intentionally maps parts of the OFBiz data model.

## Existing APIs reused

| Workflow | Reused Moqui REST contract |
| --- | --- |
| Login and login options | `POST admin/login`, `GET admin/checkLoginOptions` |
| Current profile and permissions | `admin/user/profile`, `admin/user/permissions` |
| Preferences and time zones | `admin/user/preferences`, `admin/user/getAvailableTimeZones` |
| Facilities and product stores | `admin/facilities`, `admin/productStores` |
| Organizations and Shopify shops | `admin/organizations`, `admin/shopifyShops` |
| Security groups | `admin/groups` |
| Security permissions | `admin/permissions` |
| Party data and contact mechanisms | Existing `oms/parties`, `oms/customers`, and `oms/partyContactMechs` families |
| Facility-party associations | Existing `oms/facilities/{facilityId}/parties` family |

The implementation intentionally did not add duplicate top-level
`securityGroups`, `securityPermissions`, `securityGroupPermissions`,
`partyRoles`, or `securityGroupUsers` resources.

## APIs added or extended

| Contract | Purpose |
| --- | --- |
| `GET/POST admin/users` | Paged user search and transactional application-account creation |
| `GET admin/users/{userId}` | Complete user/account details, creator identity, and profile-image path |
| `GET/POST/PUT admin/users/{userId}/groups` | List, assign, and expire security-group memberships |
| `GET/POST admin/users/{userId}/profileImage` | Read and upload profile images |
| `POST admin/users/{userId}/password/update` | Administrative password update |
| `POST admin/users/{userId}/changePassword` | Verified old-password change/reset flow |
| `POST admin/users/password/reset-email` | Generate, synchronize, and email a temporary password |
| `GET/POST/PUT admin/user/{partyId}/productStores` | User-scoped product-store roles |
| `GET admin/groups/{groupId}/users` | Security-group membership/count details |
| `GET/POST/PUT/DELETE admin/userGroups...` | Native Moqui application groups and permissions |
| `GET/POST admin/userPermissions` | Native permission catalog |
| `GET admin/artifactGroups` | Artifact groups for authorization setup |
| `.../artifactAuthorizations` | Native artifact authorization CRUD |
| `POST admin/userParties` | Composite application party creation |
| `PUT admin/userParties/{partyId}/person` | Person maintenance where no suitable existing operation existed |
| `GET/POST admin/roleTypes` | Role lookup and the app's existing `FAC_LOGIN` setup workflow |
| `GET/POST/DELETE admin/organizations/{partyId}/roles...` | Complete existing party-role family |

Generated local Swagger confirms the new Users and Groups resource trees are
present. Authenticated execution remains the final contract proof because
Moqui compiles XML actions lazily.

## Authentication invariant

Maarg authenticates application users through `OfbizShiroRealm`, which checks
`org.apache.ofbiz.security.login.UserLogin` and then synchronizes the native
`moqui.security.UserAccount`.

For that reason, writing only a native `UserAccount` would create a user who
cannot log in. The lifecycle services now:

1. Create or update the native account using Moqui's validated services.
2. Create or update the matching OFBiz `UserLogin` and password history.
3. Generate OFBiz-compatible `$SHA-256$salt$hash` values through the shared
   credentials matcher.
4. Apply account enabled, password-change-required, logout, and group changes
   to both identity models in one transaction.
5. Roll back the whole operation if either side fails.

Security-group association services similarly maintain native
`UserGroupMember` records and mapped OFBiz `UserLoginSecurityGroup` records.

## Frontend changes

- Moqui is a build invariant in Vite instead of an optional environment
  fallback.
- All explicit OMS-base overrides and legacy service names were removed.
- Native `userId` is used for account, password, group, preference, session,
  and image operations. Username remains a login/display value.
- Party-only setup has its own route until an application account exists.
- User details compose party, role, contact, preference, facility, product
  store, and creator data through Moqui contracts.
- Security-group and permission pages normalize Maarg arrays rather than
  OFBiz `{ docs, count }` responses.
- Association removals continue to use `thruDate` where history must be
  preserved.

## Validation record

Completed locally:

- Users unit contracts: 6 passing tests.
- ESLint: passing.
- Users production build: passing.
- Migration-specific TypeScript errors: none. A direct `vue-tsc` run still
  reports two existing `persist` option typing errors in the shared AccxUI
  `common` package.
- Maarg component build: passing on Java 21.
- Maarg service integration suite: passing against the refreshed H2 snapshot.
  It executes user collection/detail/group/count services and a rollback-only
  party, account, password, mapped-group, account-status, and party-role
  lifecycle across both identity models.
- Updated XML files: valid with `xmllint`.
- Frontend and backend diffs: whitespace-clean.
- Local Moqui startup: successful on port 8080 with the migration component.
- Anonymous login-options request: observed only at
  `/rest/s1/admin/checkLoginOptions`.

The integration run found and fixed two issues that static builds did not
exercise: the original profile-image implementation referenced an entity that
is not deployed in this Maarg runtime, and the refreshed `PartyRole` schema is
date-effective while the local UDM definition omitted `fromDate`/`thruDate`.
Profile images now reuse the existing OFBiz Content/DataResource/PartyContent
model, and party-role removals soft-expire the active association.

Authenticated browser smoke coverage completed for user list and details,
permission catalog, native group permissions, artifact authorizations, the
password-reset dialog, and user creation. A reversible group/permission
mutation was created and removed successfully, the browser console remained
clean after authentication, and the source/log audit found no active `/api/`
traffic. The final password-reset submission was intentionally not exercised
because it would change the selected account's credential and send email.

## GitHub issue breakdown

If tracked as GitHub work, use one parent issue:

**Migrate Users app to Moqui-only APIs**

Recommended sub-issues:

1. Inventory Users workflows and publish the API contract matrix.
2. Add missing Maarg user lifecycle and dual-realm identity services.
3. Add user security-group, role, facility, and product-store association APIs.
4. Add native user-group, permission, artifact-group, and authorization APIs.
5. Convert Users frontend routing and stores to Moqui-only contracts.
6. Add contract tests and static guards against OFBiz route regressions.
7. Validate every read and mutation workflow on a Moqui-only instance.
8. Publish Swagger examples and operational migration notes.

Each sub-issue should name the exact routes, authorization rules, request and
response examples, failure cases, automated checks, and acceptance evidence.
