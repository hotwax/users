import { inventoryCountPermissionCatalog } from "./inventory-count";
import { usersPermissionCatalog } from "./users";

export const appPermissionCatalogs = [usersPermissionCatalog, inventoryCountPermissionCatalog] as const;

export { inventoryCountPermissionCatalog, usersPermissionCatalog };
export type { AppPermissionCatalog, AppPermissionDefinition, AppPermissionUsage } from "./types";
