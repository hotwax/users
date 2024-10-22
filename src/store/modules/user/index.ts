import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import UserState from './UserState'
import RootState from '@/store/RootState'

const userModule: Module<UserState, RootState> = {
    namespaced: true,
    state: {
      token: '',
      current: {},
      instanceUrl: '',
      permissions: [],
      query: {
        queryString: '',
        securityGroup: '',
        status: '',
        hideDisabledUser: true
      },
      selectedUser: {},
      users: {
        list: [],
        total: 0
      },
      omsRedirectionInfo: {
        url: "",
        token: ""
      }
    },
    getters,
    actions,
    mutations,
}

// TODO
// store.registerModule('user', userModule);
export default userModule;