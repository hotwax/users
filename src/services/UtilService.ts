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

export const UtilService = {
  fetchFacilities,
  fetchProductStores,
  getSecurityGroups,
  fetchRoles,
  updateSecurityGroup
}

