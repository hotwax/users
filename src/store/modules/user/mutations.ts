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
      state.users = payload
    },
    [types.USER_QUERY_UPDATED] (state, payload) {
      state.query = payload.query
    },
}
export default mutations;