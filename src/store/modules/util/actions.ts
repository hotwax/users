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
  async fetchFacilities({ commit }) {
    let facilities  = [];
    try {
      const payload = {
        "inputFields": {
          "parentTypeId": "VIRTUAL_FACILITY",
          "parentTypeId_op": "notEqual"
        },
        "entityName": "FacilityAndType",
        "viewSize": 100 // keeping view size 100 as considering that we will have max 100 facilities
      }

      const resp = await UtilService.fetchFacilities(payload)

      if (!hasError(resp) && resp.data.count > 0) {
        facilities = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (err) {
      console.error('Failed to fetch facilities', err)
    }
    commit(types.UTIL_FACILITIES_UPDATED, facilities)
  },

  updateSecurityGroups({ commit }, securityGroups) {
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  }
}

export default actions;