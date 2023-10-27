import { api } from '@/adapter';

const getSecurityGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}

export const UtilService = {
  getSecurityGroups
}
  