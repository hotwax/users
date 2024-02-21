import { api } from '@/adapter';

const getPermissionsByGroupType = async (payload: any): Promise<any> => {
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

const getAllPermissions = async (payload: any): Promise<any> => {
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

const addSecurityPermissionToSecurityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/addSecurityPermissionToSecurityGroup",
    method: "post",
    data: payload
  });
}

const removeSecurityPermissionFromSecurityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateSecurityPermissionToSecurityGroup",
    method: "post",
    data: payload
  });
}

const getSecurityGroupUsers = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

export const PermissionService = {
  addSecurityPermissionToSecurityGroup,
  createSecurityGroup,
  getAllPermissions,
  getPermissionsByGroupType,
  getPermissionsByGroup,
  getSecurityGroupUsers,
  removeSecurityPermissionFromSecurityGroup
}

