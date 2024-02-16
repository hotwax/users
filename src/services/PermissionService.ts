import { api } from '@/adapter';

const getpermissionsByGroupType = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const getPermissionsByGroup = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const createSecurityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/createSecurityGroup",
    method: "post",
    data: payload
  });
}

export const PermissionService = {
  createSecurityGroup,
  getpermissionsByGroupType,
  getPermissionsByGroup
}

