import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree<UtilState> = {
  [types.UTIL_ROLES_UPDATED](state, payload) {
    state.roles = payload
  },
  [types.UTIL_SECURITY_GROUPS_UPDATED](state, payload) {
    state.securityGroups = payload
  },
  [types.UTIL_FACILITIES_UPDATED](state, payload) {
    state.facilities = payload
  },
  [types.UTIL_PRODUCT_STORES_UPDATED](state, payload) {
    state.productStores = payload
  },
  [types.UTIL_SHOPIFY_SHOPS_UPDATED](state, payload) {
    state.shopifyShops = payload
  },[types.UTIL_CLASSIFICATION_SECURITY_GROUPS_UPDATED](state, payload) {
    state.classificationSecurityGroups = payload
  }
}
export default mutations;