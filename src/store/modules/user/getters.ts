import { GetterTree } from 'vuex'
import UserState from './UserState'
import RootState from '@/store/RootState'

const getters: GetterTree<UserState, RootState> = {
  isAuthenticated(state) {
    return !!state.token;
  },
  isUserAuthenticated(state) {
    return state.token && state.current
  },
  getBaseUrl(state) {
    let baseURL = process.env.VUE_APP_BASE_URL;
    if (!baseURL) baseURL = state.instanceUrl;
    return baseURL.startsWith('http') ? baseURL : `https://${baseURL}.hotwax.io/api/`;
  },
  getUserToken(state) {
    return state.token
  },
  getUserProfile(state) {
    return state.current
  },
  getInstanceUrl(state) {
    const baseUrl = process.env.VUE_APP_BASE_URL;
    return baseUrl ? baseUrl : state.instanceUrl;
  },
  getUserPermissions(state) {
    return state.permissions;
  },
  getSelectedUser(state) {
    return state.selectedUser;
  },
  getUsers(state) {
    return state.users.list
  },
  getQuery(state) {
    return state.query
  },
  isScrollable(state) {
    return (
      state.users.list?.length > 0 && state.users.list?.length < state.users.total
    );
  },
  getUserProductStores(state) {
    return state.selectedUser.productStores;
  },
}
export default getters;