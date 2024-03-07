import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import PermissionState from './PermissionState'
import RootState from '@/store/RootState'

const permissionModule: Module<PermissionState, RootState> = {
  namespaced: true,
  state: {
    permissionsByClassificationGroups: {},
    query: {
      queryString: '',
      showSelected: false
    },
    currentGroup: {},
    permissionsByGroup: {},
    allPermissions: {}
  },
  getters,
  actions,
  mutations,
}

export default permissionModule;
