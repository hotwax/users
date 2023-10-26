import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'

const actions: ActionTree<UserState, RootState> = {

  async findUsers ({ dispatch, commit, state }) {
    const filters = {} as any

    if(state.query.securityGroup){
      filters['securityGroupId'] = state.query.securityGroup
      filters['securityGroupId_op'] = 'equals'
    }

    if(state.query.status){
      filters['enabled'] = state.query.status
      filters['enabled_op'] = 'equals'
    }

    const payload = {
      "inputFields": {
        ...filters,
        "partyId": "10000",
        firstName_value: state.query.queryString,
        firstName_op: 'contains',
        firstName_ic: 'Y',
        firstName_grp: '1',
        lastName_value: state.query.queryString,
        lastName_op: 'contains',
        lastName_ic: 'Y',
        lastName_grp: '2',
        groupName_value: state.query.queryString,
        groupName_op: 'contains',
        groupName_ic: 'Y',
        groupName_grp: '3'
      },
      "entityName": "PartyDetailView",
      "viewSize": 200,
      "distinct": "Y",
      "noConditionFind": "Y",
      "fieldList": ['createdDate', 'firstName', 'infoString', 'lastName', 'partyId', 'securityGroupId', 'userLoginId'],
    }

    try{
      const resp = await UserService.getPartyViewDetail(payload)

      if(resp && resp.status === 200 && !hasError(resp) && resp.data.docs?.length) {
        const users = resp.data.docs

        commit(types.USER_LIST_UPDATED, { users });
      } else {
        showToast(translate("No record found"), false);
        commit(types.USER_LIST_UPDATED, { users: [] });
      }
    } catch(error) {
      console.error(error)
      showToast(translate("Something went wrong"), false);
    }
  },

  async getSecurityGroupOptions ({ dispatch, commit }) {
    const payload = {
      "entityName": "SecurityGroup",
      "viewSize": 200,
      "distinct": "Y",
      "noConditionFind": "Y",
    }

    try {
      const resp = await UserService.getSecurityGroups(payload)
      
      if(resp && resp.status === 200 && !hasError(resp) && resp.data.docs?.length){
        const securityGroupOptions = resp.data.docs

        commit(types.USER_SECURITY_GROUPS_LIST_UPDATED, { securityGroupOptions });
      } else {
        commit(types.USER_SECURITY_GROUPS_LIST_UPDATED, { securityGroupOptions: [] });
        showToast(translate("No record found"), false);
      }
    } catch(error) {
      console.error(error)
      showToast(translate("Something went wrong"), false);
    }
  },

  async updateQuery  ( { commit, dispatch, rootState } , query ) {
    commit(types.USER_QUERY_UPDATED, {query})

    dispatch('findUsers')
  }
}

export default actions;