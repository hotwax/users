import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import UtilState from './UtilState'
import { UtilService } from '@/services/UtilService'

const actions: ActionTree<UtilState, RootState> = {
  async getSecurityGroups({ commit, state }) {
    // don't fetch security group information if we already have security groups available in state
    // Added condition as security group information will not be changed frequently
    if(state.securityGroups.length) {
      return;
    }

    const payload = {
      "entityName": "SecurityGroup",
      "viewSize": 200,
      "distinct": "Y",
      "noConditionFind": "Y",
      "fieldList": ["groupId", "groupName"]
    }

    let securityGroups = []

    try {
      const resp = await UtilService.getSecurityGroups(payload)

      if(!hasError(resp)) {
        securityGroups = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(error) {
      console.error(error);
    }
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  },

  updateSecurityGroups({ commit }, securityGroups) {
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  }
}

export default actions;