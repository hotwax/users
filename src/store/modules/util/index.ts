import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const userModule: Module<UtilState, RootState> = {
  namespaced: true,
  state: {
    roles: [],
    productStores: [],
    securityGroups: [],
    facilities: [],
  },
  getters,
  actions,
  mutations,
}

export default userModule;
