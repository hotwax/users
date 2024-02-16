export default interface PermissionState {
  permissionsByGroupType: any;
  query: {
    queryString: string
  };
  currentGroup: any;
  permissionsByGroup: any;
  allPermissions: any;
}