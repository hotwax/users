export default interface PermissionState {
  permissionsByClassificationGroups: any;
  query: {
    queryString: string,
    showSelected: boolean,
    classificationSecurityGroupId: string
  };
  currentGroup: any;
  permissionsByGroup: any;
  allPermissions: any;
}