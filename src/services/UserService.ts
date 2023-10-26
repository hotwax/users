import { api, client } from '@/adapter'
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyTG9naW5JZCI6InN1bWl0aS5qb3NoaSIsImlzcyI6IkhvdFdheCIsImV4cCI6MTY5ODM4NDA5MSwiaWF0IjoxNjk4Mjk3NjkxfQ.fyjNEfv6qOysbc_okstRF39y2ok1jvxBLt3b0rH7R4QlVITve0lcKa-QmaREy49zDmVYOxfkJ3DewOuQ7qqyuA'

const getPartyViewDetail = async (params: any): Promise<any> => {
  return client({
    url: "performFind",
    method: "get",
    params,
    baseURL: "https://dev-oms.hotwax.io/api/",
    headers: {
      Authorization:  'Bearer ' + token,
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
      Authorization:  'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
}

export const UserService = {
  getPartyViewDetail,
  getSecurityGroups
}
  