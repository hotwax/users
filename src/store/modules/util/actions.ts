import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { showToast } from '@/utils'
import { hasError } from '@/adapter'
import { translate } from '@hotwax/dxp-components'
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

  async fetchShopifyShopConfigs({ commit }) {
    let shopifyShops = []

    try {
      const resp = await UtilService.getShopifyConfigs();
      if (!hasError(resp)) {
        shopifyShops = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_SHOPIFY_SHOPS_UPDATED, shopifyShops)
  },


  async getSecurityGroups({ commit }) {
    const payload = {
      entityName: "SecurityGroup",
      viewSize: 200,
      distinct: "Y",
      noConditionFind: "Y",
      fieldList: ["description", "groupId", "groupName"],
      inputFields: {
        groupTypeEnumId: "PRM_CLASS_TYPE",
        groupTypeEnumId_op: "notEqual"
      }
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
  async getClassificationSecurityGroups({ commit }) {
    const payload = {
      entityName: "SecurityGroup",
      viewSize: 250,
      distinct: "Y",
      noConditionFind: "Y",
      fieldList: ["description", "groupId", "groupName"],
      orderBy: 'groupName ASC',
      inputFields: {
        groupTypeEnumId: "PRM_CLASS_TYPE",
        groupId: "SGC_HIDDEN",
        groupId_op: "notEqual"
      }
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
    commit(types.UTIL_CLASSIFICATION_SECURITY_GROUPS_UPDATED, securityGroups);
  },

  async fetchFacilities({ commit }) {
    let facilities: Array<any> = [];
    let viewIndex = 0
    // Used separate variable to check whether the response data length is equal to the viewSize passed
    // Not using resp.data.count for checking the condition as we have observed some cases where the count in the resp is not correct
    let respCount = 0
    const viewSize = 100

    do {
      try {
        const payload = {
          "inputFields": {
            "parentTypeId": "VIRTUAL_FACILITY",
            "parentTypeId_op": "notEqual",
            "facilityTypeId": "VIRTUAL_FACILITY",
            "facilityTypeId_op": "notEqual"
          },
          "entityName": "FacilityAndType",
          viewSize,
          viewIndex
        }

        const resp = await UtilService.fetchFacilities(payload)

        if (!hasError(resp) && resp.data?.docs?.length > 0) {
          facilities = facilities.concat(resp.data.docs)
          respCount = resp.data.docs.length
          viewIndex++;
        } else {
          throw resp.data
        }
      } catch (err) {
        logger.error('Failed to fetch facilities', err)
        // If the api fails in any case then assigning resp count to 0, so that the while check fails
        // and the facilities gets displayed on UI, if available.
        respCount = 0
      }
    } while(respCount >= viewSize)
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

  async fetchOrganizationPartyId({ commit }) {
    let partyId = ""

    const params = {
      entityName: "PartyRole",
      inputFields: {
        roleTypeId: 'INTERNAL_ORGANIZATIO'
      },
      noConditionFind: 'Y',
      fieldList: ["partyId"],
      viewSize: 1
    }

    try {
      const resp = await UtilService.fetchOrganizationPartyId(params)
      if (!hasError(resp)) {
        partyId = resp.data.docs[0]?.partyId
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_ORGANIZATION_PARTY_ID_UPDATED, partyId)
  },

  updateSecurityGroup({commit}, payload) {
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, payload)
  },

  clearUtilState({ commit }) {
    commit(types.UTIL_FACILITIES_UPDATED, [])
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, []);
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
    commit(types.UTIL_ORGANIZATION_PARTY_ID_UPDATED, "")
  },
}

export default actions;