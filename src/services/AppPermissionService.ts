import { hasError } from '@/adapter';
import { PermissionService } from '@/services/PermissionService';
import { UtilService } from '@/services/UtilService';

const PAGE_SIZE = 250;

type SecurityGroupPermission = {
  groupId: string;
  groupName?: string;
  permissionId: string;
  fromDate?: number;
  thruDate?: number;
  [key: string]: any;
};

type SecurityGroup = {
  groupId: string;
  groupName?: string;
  description?: string;
  [key: string]: any;
};

const assertValidResponse = (resp: any) => {
  if (hasError(resp)) {
    throw resp?.data || resp;
  }
}

const getPagedSecurityGroupPermissions = async (inputFields: any, options: any = {}): Promise<SecurityGroupPermission[]> => {
  const permissions = [] as SecurityGroupPermission[];
  let viewIndex = 0;
  let resp;

  do {
    resp = await PermissionService.getPermissionsByGroup({
      entityName: "SecurityGroupAndPermission",
      distinct: "Y",
      noConditionFind: "Y",
      viewSize: PAGE_SIZE,
      viewIndex,
      inputFields,
      ...options
    });

    assertValidResponse(resp);

    const docs = resp?.data?.docs || [];
    permissions.push(...docs);
    viewIndex++;
  } while ((resp?.data?.docs || []).length >= PAGE_SIZE);

  return permissions;
}

const getActiveGroupsByPermission = async (permissionId: string): Promise<SecurityGroupPermission[]> => {
  return getPagedSecurityGroupPermissions(
    { permissionId },
    { filterByDate: "Y" }
  );
}

const getPermissionHistory = async (permissionId: string): Promise<SecurityGroupPermission[]> => {
  return getPagedSecurityGroupPermissions(
    { permissionId },
    {
      filterByDate: "N",
      orderBy: "-thruDate"
    }
  );
}

const getAssignableSecurityGroups = async (): Promise<SecurityGroup[]> => {
  const resp = await UtilService.getSecurityGroups({
    entityName: "SecurityGroup",
    viewSize: PAGE_SIZE,
    distinct: "Y",
    noConditionFind: "Y",
    fieldList: ["description", "groupId", "groupName"],
    inputFields: {
      groupTypeEnumId: "PRM_CLASS_TYPE",
      groupTypeEnumId_op: "notEqual"
    }
  });

  assertValidResponse(resp);

  return resp?.data?.docs || [];
}

const grantPermissionToGroup = async (payload: { groupId: string; permissionId: string; fromDate?: number }): Promise<any> => {
  return PermissionService.addSecurityPermissionToSecurityGroup({
    ...payload,
    fromDate: payload.fromDate || Date.now()
  });
}

const removePermissionFromGroup = async (payload: { groupId: string; permissionId: string; fromDate?: number; thruDate?: number }): Promise<any> => {
  return PermissionService.removeSecurityPermissionFromSecurityGroup({
    ...payload,
    thruDate: payload.thruDate || Date.now()
  });
}

export const AppPermissionService = {
  getActiveGroupsByPermission,
  getAssignableSecurityGroups,
  getPermissionHistory,
  grantPermissionToGroup,
  removePermissionFromGroup
}
