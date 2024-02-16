import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import PermissionState from './PermissionState'
import RootState from '@/store/RootState'

const utilModule: Module<PermissionState, RootState> = {
  namespaced: true,
  state: {
    permissionsByGroupType: {},
    query: {
      queryString: ''
    },
    currentGroup: {},
    permissionsByGroup: {},
    allPermissions: []
  },
  getters,
  actions,
  mutations,
}

export default utilModule;
