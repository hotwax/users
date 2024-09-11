import { api } from '@/adapter';

const fetchRoles = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload,
    cache: true
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

const updateSecurityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateSecurityGroup",
    method: "post",
    data: payload
  });
}

const fetchFacilities = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchProductStores = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const getShopifyConfigs = async (): Promise <any>  => {
  const params = {
    "entityName": "ShopifyShopAndConfig",
    "noConditionFind": "Y",
    "fieldList": ["shopifyConfigId", "name", "shopId", "productStoreId"],
    "viewSize": 250
  }

  return api({
    url: "performFind",
    method: "get",
    params,
    cache: true
  });
}

const fetchOrganizationPartyId = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

export const UtilService = {
  fetchFacilities,
  fetchOrganizationPartyId,
  fetchProductStores,
  getSecurityGroups,
  getShopifyConfigs,
  fetchRoles,
  updateSecurityGroup
}

