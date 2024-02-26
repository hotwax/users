import { MutationTree } from 'vuex'
import PermissionState from './PermissionState'
import * as types from './mutation-types'

const mutations: MutationTree<PermissionState> = {
  [types.PERMISSION_BY_CLASSIFICATION_GROUPS_UPDATED](state, payload) {
    state.permissionsByClassificationGroups = payload
  },
  [types.PERMISSION_QUERY_UPDATED](state, payload) {
    state.query = payload.query
  },
  [types.PERMISSION_CURRENT_GROUP_UPDATED](state, payload) {
    state.currentGroup = payload
  },
  [types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED](state, payload) {
    state.permissionsByGroup = payload
  },
  [types.PERMISSION_ALL_PERMISSIONS_UPDATED](state, payload) {
    state.allPermissions = payload
  },
}
export default mutations;