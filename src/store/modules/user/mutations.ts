import { MutationTree } from 'vuex'
import UserState from './UserState'
import * as types from './mutation-types'

const mutations: MutationTree <UserState> = {
    [types.USER_TOKEN_CHANGED] (state, payload) {
        state.token = payload.newToken
    },
    [types.USER_END_SESSION] (state) {
      state.token = ''
      state.current = {}
      state.permissions = []
      state.users = {
        list: [],
        total: 0
      },
      state.query = {
        queryString: '',
        securityGroup: '',
        status: '',
        hideDisabledUser: true
      }
      state.selectedUser = {}
    },
    [types.USER_INFO_UPDATED] (state, payload) {
        state.current = payload
    },
    [types.USER_INSTANCE_URL_UPDATED] (state, payload) {
        state.instanceUrl = payload;
    },
    [types.USER_PERMISSIONS_UPDATED] (state, payload) {
        state.permissions = payload
    },
    [types.USER_SELECTED_USER_UPDATED] (state, payload) {
        state.selectedUser = payload
    },
    [types.USER_LIST_UPDATED] (state, payload) {
      state.users.list = payload.users
      state.users.total = payload.total
    },
    [types.USER_QUERY_UPDATED] (state, payload) {
      state.query = payload.query
    },
    [types.USER_CLEAR_SELECTED_USER] (state) {
      state.selectedUser = {}
    },
    [types.USER_OMS_REDIRECTION_INFO_UPDATED](state, payload) {
      state.omsRedirectionInfo = payload;
    },
    [types.USER_REDIRECTED_FROM_URL_UPDATED](state, url) {
      state.redirectedFrom = url
    }
}
export default mutations;