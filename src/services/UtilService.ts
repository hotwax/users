import { api } from '@/adapter';

const getRoles = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getProductStores = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getAssociatedProductStores = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
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

const getSecurityGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

export const UtilService = {
  createProductStoreRole,
  getAssociatedProductStores,
  getSecurityGroups,
  getProductStores,
  getRoles,
  updateProductStoreRole,
}