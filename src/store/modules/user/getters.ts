import { GetterTree } from 'vuex'
import UserState from './UserState'
import RootState from '@/store/RootState'

const getters: GetterTree <UserState, RootState> = {
  getUsers (state) {
    return state.list.users
  },
  getSecurityGroupOptions (state) {
    return state.list.securityGroupOptions
  },
  getQuery (state) {
    return state.query
  },
}
export default getters;