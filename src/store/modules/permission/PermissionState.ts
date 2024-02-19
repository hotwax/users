export default interface PermissionState {
  permissionsByGroupType: any;
  query: {
    queryString: string,
    showSelected: boolean
  };
  currentGroup: any;
  permissionsByGroup: any;
  allPermissions: any;
}