import { api } from '@/adapter';

const getRoles = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload,
    cache: true
  })
}

const getProductStores = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload,
    cache: true
  })
}

const getUserAssociatedProductStores = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getSecurityGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const createProductStoreRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/createProductStoreRole", 
    method: "post",
    data: payload
  });
}

const updateProductStoreRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateProductStoreRole", 
    method: "post",
    data: payload
  });
}

const fetchFacilities = async(query: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: query,
    cache: true
  })
}

const getUserSecurityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

const updateSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateUserLoginToSecurityGroup", 
    method: "post",
    data: payload
  });
}

const createSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/addUserLoginToSecurityGroup", 
    method: "post",
    data: payload
  });
}

const updatePickerRoleStatus = async (payload: any): Promise <any> => {
  return api({
    url: "service/ensurePartyRole", 
    method: "post",
    data: payload
  });
}

const getUserAssociatedFacilities = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

export const UtilService = {
  createProductStoreRole,
  createSecurityGroup,
  getSecurityGroups,
  getProductStores,
  getRoles,
  getUserAssociatedProductStores,
  getUserAssociatedFacilities,
  getUserSecurityGroup,
  updateProductStoreRole,
  updateSecurityGroup,
  updatePickerRoleStatus,
  fetchFacilities
}