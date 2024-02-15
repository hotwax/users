import { GetterTree } from 'vuex'
import PermissionState from './PermissionState'
import RootState from '@/store/RootState'

const getters: GetterTree<PermissionState, RootState> = {
  getPermissionsByGroupType(state) {
    return state.permissionsByGroupType
  },
  getQuery(state) {
    return state.query
  },
  getCurrentGroup(state) {
    return state.currentGroup
  },
  getPermissionsByGroup(state) {
    console.log(state.permissionsByGroup);
    
    return state.permissionsByGroup[state.currentGroup.groupId]
  }
}
export default getters;