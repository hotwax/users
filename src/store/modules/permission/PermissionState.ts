export default interface PermissionState {
  permissionsByClassificationGroups: any;
  query: {
    queryString: string,
    showSelected: boolean
  };
  currentGroup: any;
  permissionsByGroup: any;
  allPermissions: any;
}