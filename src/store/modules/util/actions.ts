import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { showToast } from '@/utils'
import { hasError } from '@/adapter'
import { translate } from '@hotwax/dxp-components'
import { UserService } from '@/services/UserService'

const actions: ActionTree<UtilState, RootState> = {
  async fetchRoles({ commit, state }) {
    if (state.roles.length) {
      return
    }

    let roles = []
    const params = {
      inputFields: {
        parentTypeId_value: 'APPLICATION_USER',
        parentTypeId_op: 'equals',
        parentTypeId_grp: '1',
        roleTypeId_value: 'APPLICATION_USER',
        roleTypeId_op: 'equals',
        roleTypeId_grp: '2',
      },
      viewSize: 100,
      entityName: 'RoleType',
      fieldList: ['roleTypeId', 'parentTypeId', 'description']
    }

    try {
      const resp = await UtilService.fetchRoles(params)
      if (!hasError(resp)) {
        roles = resp.data.docs
        // pushing none explicitly to show on UI
        roles.push({
          roleTypeId: 'none',
          parentTypeId: 'none',
          description: 'None',
        })
      } else {
        throw resp.data
      }
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    commit(types.UTIL_ROLES_UPDATED, roles)
  },

  async getProductStores({ commit }) {
    let productStores = []
    const params = {
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'ProductStore',
      fieldList: ['productStoreId', 'storeName']
    }

    try {
      const resp = await UtilService.fetchProductStores(params)
      if (!hasError(resp)) {
        productStores = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, productStores)
  },

  async fetchUserProductStores({ commit, dispatch, state }, partyId) {
    let userProductStores = []
    const params = {
      inputFields: {
        partyId,
      },
      viewSize: 100,
      entityName: 'ProductStoreAndRole',
      filterByDate: 'Y',
      fieldList: ['partyId', 'storeName', 'roleTypeId', 'productStoreId', 'fromDate']
    }

    try {
      // fetching stores and roles first as storeName and role description
      // are required in the UI
      Promise.allSettled([dispatch('getProductStores'), dispatch('fetchRoles')])
      
      const resp = await UserService.getUserAssociatedProductStores(params)
      console.log(resp)
      if (!hasError(resp) || resp.data.error === 'No record found') {
        userProductStores = resp.data.docs ? resp.data.docs : []
      } else {
        throw resp.data
      }
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    commit(types.UTIL_USER_PRODUCT_STORES_UPDATED, userProductStores)
  },

  updateSecurityGroups({ commit }, securityGroups) {
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  },

  async getSecurityGroups({ commit }) {
    const payload = {
      entityName: "SecurityGroup",
      viewSize: 200,
      distinct: "Y",
      noConditionFind: "Y",
      fieldList: ["groupId", "groupName"]

    }
    let securityGroups = []

    try {
      const resp = await UtilService.getSecurityGroups(payload)

      if(!hasError(resp)) {
        securityGroups = resp.data.docs
        securityGroups.push({
          groupId: '',
          groupName: 'None',
        })
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

  async fetchProductStores({ commit }) {
    let stores  = [];
    try {
      const payload = {
        "entityName": "ProductStore",
        "noConditionFind": "Y",
        "viewSize": 100 // keeping view size 100 as considering that we will have max 100 product stores
      }

      const resp = await UtilService.fetchProductStores(payload)
      if (!hasError(resp) && resp.data.count > 0) {
        stores = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (err) {
      console.error('Failed to fetch product stores', err)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, stores)
  },

  async getUserSecurityGroups({ state }, userLoginId) {
    let userSecurityGroup = {} as any
    const payload = {
      inputFields: {
        userLoginId,
      },
      entityName: "UserLoginSecurityGroup",
      filterByDate: "Y",
      viewSize: 10,
      fieldList: ["groupId", "userLoginId", "fromDate"]
    }

    try {
      const resp = await UserService.getUserSecurityGroup(payload)
      if (!hasError(resp) || resp.data.error === 'No record found') {
        userSecurityGroup = {
          groupId: resp.data.docs ? resp.data.docs[0].groupId : '',
          fromDate: resp.data.docs && resp.data.docs[0].fromDate
        }
      } else {
        throw resp.data
      }
    } catch (error) {
      console.error(error);
    }
    return userSecurityGroup
  },

  async getUserAssociatedFacilities({ state }, partyId) {
    let facilities = [] as any
    const payload = {
      inputFields: {
        partyId,
      },
      noConditionFind: "Y",
      entityName: "FacilityParty",
      viewSize: 100,
    }

    try {
      const resp = await UserService.getUserAssociatedFacilities(payload)
      if (!hasError(resp) || resp.data.error === 'No record found') {
        facilities = resp.data.docs ? resp.data.docs : []
      } else {
        throw resp.data
      }
    } catch (error) {
      console.error(error);
    }
    return facilities
  }
  
}

export default actions;