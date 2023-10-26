import { api, client } from '@/adapter'

const getPartyViewDetail = async (params: any): Promise<any> => {
  return client({
    url: "performFind",
    method: "get",
    params,
    baseURL: "https://dev-oms.hotwax.io/api/",
    headers: {
      Authorization:  'Bearer ' + '',
      'Content-Type': 'application/json'
    }
  })
}

const getSecurityGroups = async (params: any): Promise<any> => {
  return client({
    url: "performFind",
    method: "get",
    params,
    baseURL: "https://dev-oms.hotwax.io/api/",
    headers: {
      Authorization:  'Bearer ' + '',
      'Content-Type': 'application/json'
    }
  })
}

export const UserService = {
  getPartyViewDetail,
  getSecurityGroups
}
  