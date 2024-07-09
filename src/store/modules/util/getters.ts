import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree<UtilState, RootState> = {
  getRoles(state) {
    return state.roles;
  },
  getProductStores(state) {
    return state.productStores;
  },
  getRoleTypeDesc: (state) => (roleTypeId: string) => {
    return state.roles.find((role: any) => role.roleTypeId === roleTypeId)?.description
  },
  getSecurityGroups(state) {
    return state.securityGroups
  },
  getClassificationSecurityGroups(state) {
    return state.classificationSecurityGroups
  },
  getFacilities(state) {
    return state.facilities
  },
  getShopifyShops(state) {
    return state.shopifyShops;
  },
  getOrganizationPartyId(state) {
    return state.organizationPartyId;
  }
}
export default getters;