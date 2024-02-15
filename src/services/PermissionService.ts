import { api } from '@/adapter';

const getSecurityPermissions = async (payload: any): Promise<any> => {
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

export const PermissionService = {
  getSecurityPermissions,
  getPermissionsByGroup
}

