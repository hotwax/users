# Users Playwright acceptance flow matrix

This matrix is the acceptance inventory for every user-visible Users-app route, state, modal, gate, and mutation. Each row names the maintained Playwright spec that proves it, or records the explicit safety/external dependency that prevents execution. It is intentionally based on the current router and rendered controls in `src/`, not on assumed backend fixtures.

Run against a local server with `PLAYWRIGHT_START_SERVER=true`, or point at a running instance with `PLAYWRIGHT_BASE_URL`. Authenticated cases require `PLAYWRIGHT_USERNAME` and `PLAYWRIGHT_PASSWORD`; `PLAYWRIGHT_OMS` is optional when the login screen needs an OMS override. Credentials must remain in the shell or CI secret store.

| Area | Route/workflow | Coverage | Safety | Evidence/spec |
| --- | --- | --- | --- | --- |
| Login | Protected route redirects to `/login` | Login form, username/password, Login button | Read-only | `tests/login.spec.ts` |
| Login | Valid configured credentials enter the app | UI login and authenticated URL boundary | Read-only; no reset/password action | `tests/login.spec.ts`, `tests/auth.setup.ts` |
| Navigation | Settings | Settings heading and Logout control | Read-only assertion | `tests/navigation.spec.ts` |
| Navigation | App permissions | Direct route remains in app for an authorized user | Read-only render | `tests/navigation.spec.ts`, `tests/permissions.spec.ts` |
| Navigation | Manage authorization | Direct route remains in app for an authorized user | Read-only render | `tests/navigation.spec.ts`, `tests/permissions.spec.ts` |
| Users | Users list | List heading and search control | Read-only | `tests/users.spec.ts` |
| Users | User search/clear | Search submission and clear refresh | Read-only | `tests/users.spec.ts` |
| Users | Clearance/login filters | Filter controls render and use Moqui query parameters | Read-only/contract asserted | `tests/users.spec.ts` |
| Users | Pagination/infinite scroll | Page continuation and loading completion | Read-only/fixture-dependent | `tests/users.spec.ts` |
| Users | Empty/error/loading states | Empty result, API failure, and loading indicators | Safe route interception | `tests/users.spec.ts` |
| Users | Current user details | Opens the pinned “Your user” record when available | Read-only | `tests/users.spec.ts` |
| User details | Account route | Account details, own-user marker, loading/not-found | Read-only | `tests/user-details.spec.ts` |
| User details | Party-only route | Party details before account creation | Read-only | `tests/user-details.spec.ts` |
| User details | Person/group name update | Request contract and UI success/error state | Disposable fixture or intercepted contract | `tests/user-details.spec.ts` |
| User details | Contacts | Email, phone, external ID add/edit/delete dialogs | Disposable fixture or intercepted contract | `tests/user-details.spec.ts` |
| User details | Facilities/product stores | Select, add, remove, and history-preserving role flows | Disposable fixture or intercepted contract | `tests/user-details.spec.ts` |
| User details | Security groups/history | Assign/remove/history modal and stable historical rows | Disposable fixture or intercepted contract | `tests/user-details.spec.ts` |
| User details | Account enable/disable/force logout | Permission-gated controls and request contracts | Disposable fixture; no protected account mutation | `tests/user-details.spec.ts` |
| User details | Profile image | Validation, upload request contract, success/error state | Contract-verified; no external file required | `tests/user-details.spec.ts` |
| User details | Password reset dialog | Open/dismiss and request shape only | Credential mutation/email exempt | `tests/user-details.spec.ts` |
| User creation | Create user | Form validation and party-create contract | Disposable fixture/cleanup required | `tests/create-user.spec.ts` |
| User creation | Quick setup | Template, password, facility/store selectors and safe failure state | Disposable fixture/cleanup required | `tests/create-user.spec.ts` |
| User creation | Confirmation | Quick/manual setup navigation and safe dismissal | Disposable fixture/cleanup required | `tests/create-user.spec.ts` |
| Permissions | Catalog by app/group | Search, selected filter, app/group views, empty/loading/error | Read-only/contract asserted | `tests/permissions.spec.ts` |
| Permissions | Native group permissions | Grant/expire request contract and history modal | Disposable group or intercepted contract | `tests/permissions.spec.ts` |
| Authorization | Artifact groups/authorizations | List/detail, add/edit/delete dialogs and gates | Disposable group or intercepted contract | `tests/authorization.spec.ts` |
| Settings | Preferences/time zone/language | Modal open/dismiss and update contract | Disposable preference or intercepted contract | `tests/settings.spec.ts` |
| Navigation | App switching/OMS selection | Login OMS selection, app shell tabs, launchpad link | Read-only/external redirect asserted | `tests/navigation.spec.ts` |
| Access control | Auth failure/permission denial | Bad credentials, protected route redirect, denied route fallback | Safe negative flow | `tests/login.spec.ts`, `tests/access-control.spec.ts` |
| Responsive UI | Mobile/desktop layout and modal dismissal | Viewport projects, back/dropdown/backdrop/close behavior | Read-only | `tests/responsive.spec.ts` |

## Deliberately excluded

Credential-changing final password actions and reset-email delivery remain exempt from live mutation; their request contracts must be asserted with interception or a disposable isolated fixture. External launchpad navigation is asserted only up to the outbound URL. All other rows are required to execute against the real local runtime using unique disposable fixtures with guaranteed cleanup before either PR can be marked ready.

## Selector additions needed

The current specs use semantic labels, roles, route URLs, and the existing `#username`/`#password` controls. The following exact `data-testid` additions would make future coverage less dependent on translated text or data availability:

| Component | Add selector | Intended use |
| --- | --- | --- |
| `src/components/Tabs.vue` | `users-tab`, `permissions-tab`, `authorization-tab`, `me-tab`, `settings-tab` | Stable tab navigation assertions |
| `src/views/Users.vue` | `users-page`, `users-search`, `users-clearance-filter`, `users-login-filter`, `users-list`, `users-current-user`, `users-create-button`, `users-empty-state`, `users-loading-state` | List/search/filter/states without text matching |
| `src/views/Settings.vue` | `settings-page`, `settings-logout` | Stable settings/logout assertions |
| `src/views/AppPermissions.vue` | `app-permissions-page`, `app-permissions-group` | Permission page and group selection |
| `src/views/ManageAuthorization.vue` | `manage-authorization-page`, `authorization-group` | Authorization page and group selection |
| `src/views/CreateUser.vue` | `create-user-page`, `create-user-submit` | Future disposable-fixture mutation coverage |
| `src/views/UserDetails.vue` | `user-details-page`, `user-details-reset-password`, `user-details-force-logout` | Explicitly gated destructive-action tests |

Add these in the frontend only when the corresponding flow is intentionally brought into scope; this harness does not modify application components merely to create test hooks.
