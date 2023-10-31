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
	getUserProductStores(state) {
		return state.userProductStores;
	},
	getRoleTypeDesc: (state) => (roleTypeId: string) => {
		return state.roles.find((role: any) => role.roleTypeId === roleTypeId).description
	},
	getProductStoreRoleType: (state) => (productStoreId: string) => {
		return state.userProductStores.find((store: any) => store.productStoreId === productStoreId)?.roleTypeId || 'none'
	},
	getSecurityGroups(state) {
		return state.securityGroups
	},
	getFacilities(state) {
		return state.facilities
	}
}
export default getters;