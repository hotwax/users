import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { showToast } from '@/utils'
import { hasError } from '@/adapter'
import { translate } from '@hotwax/dxp-components'
import { UserService } from '@/services/UserService'
import logger from '@/logger';

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
      logger.error(error)
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
      logger.error(error)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, productStores)
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
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error);
    }
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  },

  async fetchFacilities({ commit }) {
    let facilities  = [];
    try {
      const payload = {
        "inputFields": {
          "parentTypeId": "VIRTUAL_FACILITY",
          "parentTypeId_op": "notEqual",
          "facilityTypeId": "VIRTUAL_FACILITY",
          "facilityTypeId_op": "notEqual"
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
      logger.error('Failed to fetch facilities', err)
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
      logger.error('Failed to fetch product stores', err)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, stores)
  },

  clearUtilState({ commit }) {
    commit(types.UTIL_FACILITIES_UPDATED, [])
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, []);
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
  },
}

export default actions;