# Permission By App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Users app experience that shows permissions by application and lets admins understand and manage which security groups receive each app action permission.

**Architecture:** Keep each app's permission meaning in an app-owned catalog file, then aggregate those catalogs into the Users app for management. Users should render an action-first permission surface, reusing the current Users security group APIs for active assignments, history, add, and remove operations.

**Tech Stack:** Vue 3, Ionic Vue, Vuex in Users, existing Users `PermissionService`, existing Moqui `SecurityPermission`, `SecurityGroup`, and `SecurityGroupAndPermission` data.

---

## Research Summary

Inventory Count implements the target UX in `/Users/adityapatel/Documents/GitHub/inventory-count/src/views/StorePermissions.vue`.

Key behaviors to preserve:
- It is action-first: each card is one business action, not one raw security group.
- The card title is user-facing, for example "Start count early", while the raw permission id stays secondary.
- The description explains the operational impact, not the database object.
- Each card shows the active security groups granted that permission.
- Users can add/remove security groups from a permission through a searchable modal.
- Users can view assignment history for that permission.

Important implementation detail:
- Inventory Count currently keeps `permissionCards` inline in `StorePermissions.vue`. For scale, this must become a config file, not another copied page.
- The local repo scanner is only a one-time development audit aid for creating and validating catalogs. Production must never scan repositories. The deployed Users app must read stable, reviewed catalog data committed into the application bundle.

Users currently has the inverse model:
- `/Users/adityapatel/Documents/GitHub/users/src/views/Permissions.vue` starts with a security group and then shows its permissions.
- `/Users/adityapatel/Documents/GitHub/users/src/components/PermissionItems.vue` edits a group's permission associations.
- `/Users/adityapatel/Documents/GitHub/users/src/store/modules/permission/actions.ts` fetches all permissions, classification groups, and group assignments.
- `/Users/adityapatel/Documents/GitHub/users/src/services/PermissionService.ts` already creates and expires `SecurityGroupPermission` records.

The implementation should add a by-app surface without removing the existing by-security-group surface.

## App Repos To Audit

Initial local scan found these likely app repos with permission references:

- `/Users/adityapatel/Documents/GitHub/available-to-promise`
- `/Users/adityapatel/Documents/GitHub/bopis`
- `/Users/adityapatel/Documents/GitHub/company`
- `/Users/adityapatel/Documents/GitHub/facilities`
- `/Users/adityapatel/Documents/GitHub/fulfillment`
- `/Users/adityapatel/Documents/GitHub/inventory-count`
- `/Users/adityapatel/Documents/GitHub/job-manager`
- `/Users/adityapatel/Documents/GitHub/launchpad`
- `/Users/adityapatel/Documents/GitHub/order-manager`
- `/Users/adityapatel/Documents/GitHub/order-manager-execute-solr-query`
- `/Users/adityapatel/Documents/GitHub/order-routing`
- `/Users/adityapatel/Documents/GitHub/preorder`
- `/Users/adityapatel/Documents/GitHub/product-updates`
- `/Users/adityapatel/Documents/GitHub/products`
- `/Users/adityapatel/Documents/GitHub/receiving`
- `/Users/adityapatel/Documents/GitHub/reroute-fulfilment`
- `/Users/adityapatel/Documents/GitHub/returns`
- `/Users/adityapatel/Documents/GitHub/shopify-bopis`
- `/Users/adityapatel/Documents/GitHub/transfers`
- `/Users/adityapatel/Documents/GitHub/users`

The scanner must ignore all-caps store mutation names, enum ids, and status ids unless they are used inside a permission context.

The scanner is not runtime infrastructure. It is a local developer tool used while authoring or reviewing catalog files. Runtime data comes only from committed `src/config/app-permissions/*` catalog modules and live Moqui security group assignments.

## Target Data Model

Create this shared catalog shape in Users:

```ts
export type AppPermissionCatalog = {
  appId: string;
  appName: string;
  appDescription: string;
  appAccessPermissionIds: readonly string[];
  adminPermissionIds: readonly string[];
  permissions: readonly AppPermissionDefinition[];
};

export type AppPermissionDefinition = {
  permissionId: string;
  title: string;
  description: string;
  category: string;
  usedIn: readonly AppPermissionUsage[];
  impliedBy?: readonly string[];
};

export type AppPermissionUsage = {
  file: string;
  context: string;
  routeName?: string;
  routePath?: string;
};
```

Rules:
- `title` is the user-facing action name.
- `description` explains the operational outcome in the app.
- `permissionId` remains visible, but never as the primary title.
- `impliedBy` captures admin/common permissions such as `COMMON_ADMIN`, `INV_COUNT_ADMIN`, or app admin permissions that effectively grant the action.
- `usedIn` is evidence. Every configured permission must point to the route/component/check that uses it.

## Task 1: Add Permission Audit Script

This task creates a local-only audit tool. It must not be imported by application runtime code, bundled into production, or used as the source of permission catalog truth in deployed environments.

**Files:**
- Create: `/Users/adityapatel/Documents/GitHub/users/scripts/audit-app-permissions.mjs`
- Create: `/Users/adityapatel/Documents/GitHub/users/docs/permission-audit/app-roots.json`
- Output: `/Users/adityapatel/Documents/GitHub/users/docs/permission-audit/generated/permission-usage.json`

- [ ] **Step 1: Create app roots file**

Add the audited repo roots as stable app IDs with paths relative to the Users repo:

```json
[
  { "appId": "available-to-promise", "root": "../available-to-promise" },
  { "appId": "bopis", "root": "../bopis" },
  { "appId": "company", "root": "../company" },
  { "appId": "facilities", "root": "../facilities" },
  { "appId": "fulfillment", "root": "../fulfillment" },
  { "appId": "inventory-count", "root": "../inventory-count" },
  { "appId": "job-manager", "root": "../job-manager" },
  { "appId": "launchpad", "root": "../launchpad" },
  { "appId": "order-manager", "root": "../order-manager" },
  { "appId": "order-manager-execute-solr-query", "root": "../order-manager-execute-solr-query" },
  { "appId": "order-routing", "root": "../order-routing" },
  { "appId": "preorder", "root": "../preorder" },
  { "appId": "product-updates", "root": "../product-updates", "allowNoPermissions": true },
  { "appId": "products", "root": "../products" },
  { "appId": "receiving", "root": "../receiving" },
  { "appId": "reroute-fulfilment", "root": "../reroute-fulfilment" },
  { "appId": "returns", "root": "../returns" },
  { "appId": "shopify-bopis", "root": "../shopify-bopis", "allowNoPermissions": true },
  { "appId": "transfers", "root": "../transfers" },
  { "appId": "users", "root": "." }
]
```

- [ ] **Step 2: Implement the scanner**

The script should scan `src/**/*.{ts,js,vue}` and `.env.example` only. Extract permissions from these contexts:

```ts
hasPermission("A OR B")
hasPermission('A AND B')
permissionId: "A OR B"
permissionId: 'A'
VITE_APP_PERMISSION_ID=A
VUE_APP_PERMISSION_ID=A
VITE_PERMISSION_ID=A
export default { APP_ACTION: "SERVER_PERMISSION" }
```

Ignore ids found only in mutation types, status ids, facility ids, enum ids, and test data.

- [ ] **Step 3: Normalize boolean expressions**

For a check like `COMMON_ADMIN OR INV_COUNT_ADMIN OR INVCOUNT_APP_VIEW`, output one usage record for each permission id and preserve the original expression in `context`.

- [ ] **Step 4: Write deterministic generated audit JSON**

The output shape should be:

```json
{
  "schemaVersion": 1,
  "apps": [
    {
      "appId": "inventory-count",
      "root": "../inventory-count",
      "permissions": [
        {
          "permissionId": "INVCOUNT_APP_VIEW",
          "usages": [
            {
              "file": "src/router/index.ts",
              "context": "COMMON_ADMIN OR INV_COUNT_ADMIN OR INVCOUNT_APP_VIEW",
              "kind": "route-meta"
            }
          ]
        }
      ]
    }
  ]
}
```

Do not write run-specific timestamps into the committed generated artifact. The scanner may print timing information to stdout, but committed output should be stable across reruns when source permissions do not change.

- [ ] **Step 5: Verify the scanner**

Run:

```bash
node scripts/audit-app-permissions.mjs
```

Expected:
- JSON is created under `docs/permission-audit/generated/permission-usage.json`.
- Inventory Count includes `INVCOUNT_APP_VIEW`, `INV_CNT_VIEW_QOH`, `PREVIEW_COUNT_ITEM`, `INV_COUNT_PRE_START`, `INV_COUNT_SUBMIT`, `INV_COUNT_LOCK_RLS`, `INV_COUNT_VAR_LOG`, and `INV_COUNT_ADMIN`.
- Users includes `USERS_LIST_VIEW`, `APP_USER_CREATE`, `APP_UPDT_PASSWORD`, `APP_PERMISSION_VIEW`, `APP_PERMISSION_CREATE`, and `APP_PERMISSION_UPDATE`.

- [ ] **Step 6: Commit**

```bash
git add scripts/audit-app-permissions.mjs docs/permission-audit
git commit -m "Add app permission audit scanner"
```

## Task 2: Move Inventory Count Permission Cards Into A Catalog

**Files:**
- Modify in Inventory Count repo: `/Users/adityapatel/Documents/GitHub/inventory-count/src/views/StorePermissions.vue`
- Create in Inventory Count repo: `/Users/adityapatel/Documents/GitHub/inventory-count/src/config/appPermissions.ts`

- [ ] **Step 1: Create the catalog**

Move the inline `permissionCards` array into `src/config/appPermissions.ts` with this exported catalog:

```ts
export const inventoryCountPermissionCatalog = {
  appId: "inventory-count",
  appName: "Inventory Count",
  appDescription: "Controls cycle count store workflows and inventory variance review.",
  appAccessPermissionIds: ["INVCOUNT_APP_VIEW"],
  adminPermissionIds: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
  permissions: [
    {
      permissionId: "INVCOUNT_APP_VIEW",
      title: "Access inventory counts",
      description: "Allows store users to open the inventory count store view and create counts in sessions. This does not allow them to apply inventory changes.",
      category: "Store operations",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/router/index.ts", context: "Store count tab access" }]
    },
    {
      permissionId: "INV_CNT_VIEW_QOH",
      title: "View quantity on hand",
      description: "Allows users to see current quantity on hand while counting products.",
      category: "Counting",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/views/CountProgressReview.vue", context: "Show QOH during count review" }]
    },
    {
      permissionId: "PREVIEW_COUNT_ITEM",
      title: "Preview count items",
      description: "Allows users to preview products in a directed count before the count starts.",
      category: "Counting",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/views/CountProgressReview.vue", context: "Preview count items before start" }]
    },
    {
      permissionId: "INV_COUNT_PRE_START",
      title: "Start count early",
      description: "Allows users to start a cycle count before the scheduled start time.",
      category: "Counting",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/views/Count.vue", context: "Start count before planned start time" }]
    },
    {
      permissionId: "INV_COUNT_SUBMIT",
      title: "Submit count for review",
      description: "Allows users to approve sessions and submit proposed count variances for review.",
      category: "Review",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/views/CountProgressReview.vue", context: "Submit cycle count for review" }]
    },
    {
      permissionId: "INV_COUNT_LOCK_RLS",
      title: "Force release session",
      description: "Allows users to release sessions held by another device. The released device is removed from the session shortly after.",
      category: "Session control",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/views/Count.vue", context: "Force release locked count session" }]
    },
    {
      permissionId: "INV_COUNT_VAR_LOG",
      title: "Log inventory variance",
      description: "Allows users to manually log inventory variances for store products with reason codes.",
      category: "Inventory adjustments",
      impliedBy: ["COMMON_ADMIN", "INV_COUNT_ADMIN"],
      usedIn: [{ file: "src/router/index.ts", context: "Variance tab access" }]
    },
    {
      permissionId: "INV_COUNT_ADMIN",
      title: "Inventory count admin",
      description: "Allows users to access inventory count administration and perform all cycle count functions without store-flow restrictions.",
      category: "Administration",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/router/index.ts", context: "Admin pages and store permissions access" }]
    }
  ]
} as const;
```

- [ ] **Step 2: Import the catalog in StorePermissions**

Replace the inline `permissionCards` definition with:

```ts
import { inventoryCountPermissionCatalog } from "@/config/appPermissions";

const permissionCards = inventoryCountPermissionCatalog.permissions.map((permission) => ({
  id: permission.permissionId,
  title: permission.title,
  description: permission.description
}));
```

- [ ] **Step 3: Verify Inventory Count still builds**

Run from `/Users/adityapatel/Documents/GitHub/inventory-count`:

```bash
npm run build
```

Expected: build passes with no new permission-page errors.

- [ ] **Step 4: Commit in Inventory Count**

```bash
git add src/config/appPermissions.ts src/views/StorePermissions.vue
git commit -m "Move inventory count permission cards to app catalog"
```

## Task 3: Add Users App Permission Catalog

**Files:**
- Create: `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/types.ts`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/users.ts`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/inventory-count.ts`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/index.ts`

- [ ] **Step 1: Add catalog types**

Use the `AppPermissionCatalog`, `AppPermissionDefinition`, and `AppPermissionUsage` types from the Target Data Model.

- [ ] **Step 2: Add Users catalog**

Create definitions for the Users app permissions currently used in code. Also include the app-access permission listed in `appAccessPermissionIds` so the by-app UI can render access consistently with Inventory Count:

```ts
export const usersPermissionCatalog: AppPermissionCatalog = {
  appId: "users",
  appName: "Users",
  appDescription: "Controls user account, security group, and permission administration.",
  appAccessPermissionIds: ["USERS_APP_VIEW"],
  adminPermissionIds: ["COMMON_ADMIN"],
  permissions: [
    {
      permissionId: "USERS_APP_VIEW",
      title: "Access users app",
      description: "Allows users to open the Users application.",
      category: "Application access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: ".env.example", context: "Users app access permission" }]
    },
    {
      permissionId: "USERS_LIST_VIEW",
      title: "View users",
      description: "Allows users to open the Users list and view other application users.",
      category: "User management",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [
        { file: "src/router/index.ts", context: "User details route access", routePath: "/user-details/:partyId" },
        { file: "src/components/Tabs.vue", context: "Users tab visibility" }
      ]
    },
    {
      permissionId: "APP_USER_CREATE",
      title: "Create users",
      description: "Allows users to create a new application user and complete user setup.",
      category: "User management",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [
        { file: "src/router/index.ts", context: "Create user and confirmation routes", routePath: "/create-user" },
        { file: "src/views/Users.vue", context: "Create user action" }
      ]
    },
    {
      permissionId: "APP_UPDT_BLOCK_LOGIN",
      title: "Enable or disable login",
      description: "Allows users to block or restore another user's login and force logout active sessions.",
      category: "Account access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/UserDetails.vue", context: "Login status and force logout controls" }]
    },
    {
      permissionId: "APP_UPDT_PASSWORD",
      title: "Reset passwords",
      description: "Allows users to reset another user's password.",
      category: "Account access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [
        { file: "src/views/UserDetails.vue", context: "Reset password action" },
        { file: "src/components/ResetPasswordModal.vue", context: "Password reset save action" }
      ]
    },
    {
      permissionId: "APP_SECURITY_GROUP_CREATE",
      title: "Assign security groups",
      description: "Allows users to create security groups and assign or remove security groups from users.",
      category: "Security groups",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [
        { file: "src/views/Permissions.vue", context: "Create security group action" },
        { file: "src/views/UserDetails.vue", context: "Assign security groups to a user" }
      ]
    },
    {
      permissionId: "APP_PERMISSION_VIEW",
      title: "View permissions",
      description: "Allows users to open permission administration pages.",
      category: "Permission administration",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/router/index.ts", context: "Permissions tab route", routePath: "/tabs/permissions" }]
    },
    {
      permissionId: "APP_PERMISSION_CREATE",
      title: "Grant permissions to groups",
      description: "Allows users to add permission assignments to security groups.",
      category: "Permission administration",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/components/PermissionItems.vue", context: "Checked permission assignment" }]
    },
    {
      permissionId: "APP_PERMISSION_UPDATE",
      title: "Remove permissions from groups",
      description: "Allows users to expire permission assignments from security groups.",
      category: "Permission administration",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/components/PermissionItems.vue", context: "Unchecked permission assignment" }]
    },
    {
      permissionId: "APP_UPDT_PRODUCT_STORE_CONFG",
      title: "Assign product stores",
      description: "Allows users to update which product stores another user can access.",
      category: "Store access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/UserDetails.vue", context: "Product store assignment controls" }]
    },
    {
      permissionId: "APP_UPDT_FULFILLMENT_FACILITY",
      title: "Assign fulfillment facilities",
      description: "Allows users to update which fulfillment facilities another user can access.",
      category: "Facility access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/UserDetails.vue", context: "Fulfillment facility assignment controls" }]
    },
    {
      permissionId: "APP_UPDT_PICKER_CONFG",
      title: "Update picker configuration",
      description: "Allows users to update picker configuration on another user profile.",
      category: "Fulfillment configuration",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/UserDetails.vue", context: "Picker configuration controls" }]
    },
    {
      permissionId: "APP_SUPER_USER",
      title: "Manage super users",
      description: "Allows users to view and manage users associated with the SUPER security group.",
      category: "Sensitive access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/UserDetails.vue", context: "SUPER security group visibility and assignment" }]
    },
    {
      permissionId: "APP_PWA_STANDALONE_ACCESS",
      title: "Open standalone app controls",
      description: "Allows users to access standalone application actions from settings.",
      category: "Application access",
      impliedBy: ["COMMON_ADMIN"],
      usedIn: [{ file: "src/views/Settings.vue", context: "Standalone launchpad action" }]
    }
  ]
};
```

- [ ] **Step 3: Add Inventory Count catalog copy in Users**

Copy the Inventory Count catalog from Task 2 into `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/inventory-count.ts` so Users can render it without importing another repo at runtime.

- [ ] **Step 4: Export catalogs**

In `index.ts`:

```ts
import { inventoryCountPermissionCatalog } from "./inventory-count";
import { usersPermissionCatalog } from "./users";

export const appPermissionCatalogs = [
  usersPermissionCatalog,
  inventoryCountPermissionCatalog
];
```

- [ ] **Step 5: Verify typecheck/build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 6: Commit**

```bash
git add src/config/app-permissions
git commit -m "Add permission catalogs for Users and Inventory Count"
```

## Task 4: Add Permission Assignment Service For App View

**Files:**
- Modify: `/Users/adityapatel/Documents/GitHub/users/src/services/PermissionService.ts`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/services/AppPermissionService.ts`

- [ ] **Step 1: Add reusable assignment methods**

Use the existing `PermissionService` methods for create/remove. Add a new service wrapper that exposes:

```ts
export const AppPermissionService = {
  getActiveGroupsByPermission,
  getPermissionHistory,
  getAssignableSecurityGroups,
  grantPermissionToGroup,
  removePermissionFromGroup
};
```

- [ ] **Step 2: Implement `getActiveGroupsByPermission(permissionId)`**

Call `PermissionService.getPermissionsByGroup`-style `performFind` against `SecurityGroupAndPermission` with:

```ts
{
  entityName: "SecurityGroupAndPermission",
  distinct: "Y",
  noConditionFind: "Y",
  filterByDate: "Y",
  viewSize: 250,
  viewIndex,
  inputFields: { permissionId }
}
```

Loop until fewer than 250 records are returned.

- [ ] **Step 3: Implement `getPermissionHistory(permissionId)`**

Use the same entity with `filterByDate: "N"` and order newest first if the current API supports ordering. Return active and expired associations.

- [ ] **Step 4: Implement `getAssignableSecurityGroups()`**

Fetch `SecurityGroup` where `groupTypeEnumId != PRM_CLASS_TYPE`, matching the current Users `util/getSecurityGroups` behavior.

- [ ] **Step 5: Implement grant/remove wrappers**

Grant calls existing `addSecurityPermissionToSecurityGroup({ groupId, permissionId, fromDate })`.

Remove calls existing `removeSecurityPermissionFromSecurityGroup({ groupId, permissionId, fromDate, thruDate })`.

- [ ] **Step 6: Add unit tests if the repo test runner is healthy**

Create `/Users/adityapatel/Documents/GitHub/users/tests/unit/app-permission-service.spec.ts` and mock `PermissionService`.

Run:

```bash
npm run test:unit -- app-permission-service
```

Expected:
- paginated active groups are merged
- remove includes the original `fromDate`
- assignable groups exclude classification groups

- [ ] **Step 7: Commit**

```bash
git add src/services/AppPermissionService.ts src/services/PermissionService.ts tests/unit/app-permission-service.spec.ts
git commit -m "Add service for app permission assignments"
```

## Task 5: Build Reusable By-App Permission Components

**Files:**
- Create: `/Users/adityapatel/Documents/GitHub/users/src/components/AppPermissionCard.vue`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/components/AppPermissionGroupModal.vue`
- Create: `/Users/adityapatel/Documents/GitHub/users/src/components/AppPermissionHistoryModal.vue`

- [ ] **Step 1: Build `AppPermissionCard.vue`**

Use core Ionic components only:
- `ion-card`
- `ion-card-header`
- `ion-card-title`
- `ion-card-subtitle`
- `ion-card-content`
- `ion-list`
- `ion-item`
- `ion-label`
- `ion-note`
- `ion-button`
- `ion-icon`

Display:
- user-facing title
- description
- raw permission id as secondary metadata
- active security group count
- active security group names
- actions: manage groups, view history

- [ ] **Step 2: Build `AppPermissionGroupModal.vue`**

Use Inventory Count's modal behavior:
- searchable list of security groups
- checkboxes for selected groups
- close icon button in header start slot
- save icon-only `ion-fab` bottom right
- no `ion-grid`

Save behavior:
- create missing associations
- expire removed associations
- refresh the permission card after save

- [ ] **Step 3: Build `AppPermissionHistoryModal.vue`**

Display history records in an `ion-list`:
- security group name
- group id
- from date
- thru date or "Current"

- [ ] **Step 4: Keep styling minimal**

Do not edit existing CSS files. If a component needs scoped layout, only use spacing/layout properties. Do not add font or color rules.

- [ ] **Step 5: Verify mobile layout**

Run the app and inspect at desktop and mobile widths. The card list must remain readable at `390px` width without horizontal scrolling.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppPermissionCard.vue src/components/AppPermissionGroupModal.vue src/components/AppPermissionHistoryModal.vue
git commit -m "Add reusable app permission management components"
```

## Task 6: Add Users By-App Permission Page

**Files:**
- Create: `/Users/adityapatel/Documents/GitHub/users/src/views/AppPermissions.vue`
- Modify: `/Users/adityapatel/Documents/GitHub/users/src/router/index.ts`
- Modify: `/Users/adityapatel/Documents/GitHub/users/src/components/Tabs.vue`
- Modify: `/Users/adityapatel/Documents/GitHub/users/src/locales/en.json`

- [ ] **Step 1: Create `AppPermissions.vue`**

Page structure:
- `ion-header` with title "Permissions by app"
- `ion-searchbar` for apps and permissions
- `ion-segment` with "Apps" and "Security groups" only if routing to existing `Permissions.vue` from the same tab is ergonomic
- app list using `ion-list` and `ion-item`
- selected app summary at top of detail area
- cards for that app's configured permissions
- warning list for audited permissions that are not yet configured

- [ ] **Step 2: Route the new page**

Add a route under `/tabs`:

```ts
{
  path: "app-permissions",
  component: () => import("@/views/AppPermissions.vue"),
  meta: { permissionId: "APP_PERMISSION_VIEW" }
}
```

- [ ] **Step 3: Keep the existing group page reachable**

The current `/tabs/permissions` page should stay available as "Security groups" or "Groups". This prevents losing the current security-group-first workflow.

- [ ] **Step 4: Update tab/navigation label**

In `Tabs.vue`, rename the permission tab experience so admins understand the two modes:
- primary tab: "Permissions"
- default route: `/tabs/app-permissions`
- secondary in-page segment/action: "By app" and "By group"

- [ ] **Step 5: Add translations**

Add strings for:
- "Permissions by app"
- "By app"
- "By group"
- "Security groups with access"
- "No security groups assigned"
- "View assignment history"
- "Manage security groups"
- "Configured permissions"
- "Unconfigured permission checks"

- [ ] **Step 6: Verify route protection**

With a user lacking `APP_PERMISSION_VIEW`, opening `/tabs/app-permissions` should show the existing unavailable-page toast and redirect.

- [ ] **Step 7: Commit**

```bash
git add src/views/AppPermissions.vue src/router/index.ts src/components/Tabs.vue src/locales/en.json
git commit -m "Add permissions by app page"
```

## Task 7: Audit And Add Catalogs For Every App

**Files:**
- Create one source catalog in each app repo, using the local equivalent of `src/config/appPermissions.ts`.
- Copy each reviewed catalog into `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/<app-id>.ts`.
- Modify `/Users/adityapatel/Documents/GitHub/users/src/config/app-permissions/index.ts`.

- [ ] **Step 1: Run the scanner**

```bash
node scripts/audit-app-permissions.mjs
```

- [ ] **Step 2: For each app, classify each permission**

For every permission check, assign:
- user-facing title
- operational description
- category
- usage evidence
- admin/implied permissions

- [ ] **Step 3: Clean up names and descriptions**

Use this rule for every permission:
- Bad title: `APP_UPDT_PRODUCT_STORE_CONFG`
- Good title: `Assign product stores`
- Bad description: `Update product store config`
- Good description: `Allows users to update which product stores another user can access.`

- [ ] **Step 4: Add app catalogs in priority order**

Recommended order:
1. Users
2. Inventory Count
3. Fulfillment
4. Receiving
5. BOPIS
6. Transfers
7. Facilities
8. Preorder
9. Order Routing
10. Job Manager
11. Products
12. Remaining app repos with only app-access checks

- [ ] **Step 5: Mark unresolved checks**

If a permission id is used in code but cannot be confidently described, include it in a generated "unconfigured permission checks" section instead of guessing.

- [ ] **Step 6: Verify no configured permission lacks evidence**

Run a validation script or add this check to the scanner:

```bash
node scripts/audit-app-permissions.mjs --validate-catalogs
```

Expected:
- every configured `permissionId` appears in the audit output or is explicitly marked as `manualOnly: true`
- every audited permission is either configured or listed as unconfigured

- [ ] **Step 7: Commit app catalogs in small batches**

Use one commit per app family:

```bash
git add src/config/app-permissions
git commit -m "Add fulfillment app permission catalog"
```

## Task 8: UI Validation And Release Readiness

**Files:**
- Test with local Users app only.

- [ ] **Step 1: Build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 2: Run local app**

Run:

```bash
npm run serve -- --host 0.0.0.0 --port 8110
```

- [ ] **Step 3: Browser check**

Open:

```text
http://localhost:8110/tabs/app-permissions
```

Verify:
- app list is visible
- selecting Inventory Count shows the same action set as the current Inventory Count page
- selecting Users shows Users-specific actions
- each action shows active security groups
- search finds app names, action names, descriptions, and raw permission ids
- manage modal can add and remove a security group
- history modal shows current and expired assignments

- [ ] **Step 4: Mobile check**

At `390px` width verify:
- no horizontal scrolling
- app list and selected app detail are navigable
- security group names and permission descriptions wrap cleanly
- floating save button does not cover the last selectable row

- [ ] **Step 5: Permission check**

Test with a user that has `APP_PERMISSION_VIEW` and one that does not.

Expected:
- allowed user can open by-app permissions
- denied user gets the existing permission toast and redirect

- [ ] **Step 6: Commit validation fixes**

```bash
git add src
git commit -m "Polish permissions by app experience"
```

## Product UX Direction

The Users app should make permissions understandable by starting from the question admins actually have: "What can someone do in this app, and who can do it?"

Recommended UI:
- Top-level permission area has two modes: "By app" and "By group".
- "By app" is the default for understanding and auditing.
- "By group" keeps the existing power-user workflow for editing a known security group.
- The app detail page starts with a compact app summary: app name, access permission, admin permissions, configured action count, and unconfigured check count.
- Each action card uses human language first, raw ids second.
- Security group assignment is visible inline so the admin does not need to open a group first.
- History is one tap away per action, matching Inventory Count.
- Unconfigured or suspicious permission checks are visible as an admin-only review section, not silently ignored.

Do not build a dashboard or hero page. This is an operational admin tool; dense, readable Ionic lists and cards are more useful than decorative layout.

## Self-Review

- Spec coverage: Inventory Count implementation researched, cross-app scanning planned, config-file pattern planned, Users app itself included, and UI direction included.
- Placeholder scan: unresolved permissions are explicitly handled through an unconfigured-checks workflow rather than guessed.
- Type consistency: catalog fields are used consistently across scanner, config files, service, and UI tasks.
