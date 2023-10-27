import { MutationTree } from 'vuex'
import * as types from './mutation-types'
import UtilState from './UtilState'

const mutations: MutationTree <UtilState> = {
    [types.UTIL_SECURITY_GROUPS_UPDATED] (state, payload) {
      state.securityGroups = payload
    },
}
export default mutations;