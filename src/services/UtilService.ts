import { api } from '@/adapter';

const getSecurityGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

const fetchFacilities = async(query: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: query,
    cache: true
  })
}

const fetchProductStores = async(query: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "get",
    params: query,
    cache: true
  })
}

export const UtilService = {
  getSecurityGroups,
  fetchFacilities,
  fetchProductStores
}
  