import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree<UtilState> = {
	[types.UTIL_ROLES_UPDATED](state, payload) {
			state.roles = payload
	},
	[types.UTIL_PRODUCT_STORES_UPDATED](state, payload) {
			state.productStores = payload
	},
	[types.UTIL_USER_PRODUCT_STORES_UPDATED](state, payload) {
			state.userProductStores = payload
	},
	[types.UTIL_SECURITY_GROUPS_UPDATED](state, payload) {
			state.securityGroups = payload
	},
}
export default mutations;