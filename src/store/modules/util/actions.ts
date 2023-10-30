import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { showToast } from '@/utils'
import { hasError } from '@/adapter'
import { translate } from '@hotwax/dxp-components'

const actions: ActionTree<UtilState, RootState> = {
  async getRoles({ commit }) {
    let roles = []
    const params = {
      inputFields: {
        parentTypeId_fld0_value: 'APPLICATION_USER',
        parentTypeId_fld0_op: 'equals',
        parentTypeId_fld0_grp: '1',
        roleTypeId_fld0_value: 'APPLICATION_USER',
        roleTypeId_fld0_op: 'equals',
        roleTypeId_fld0_grp: '2',
      },
      viewSize: 100,
      entityName: 'RoleType',
      fieldList: ['roleTypeId', 'parentTypeId', 'description']
    }

    try {
      const resp = await UtilService.getRoles(params)
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
    // TODO verify filtering condition
    const params = {
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'ProductStore',
      fieldList: ['productStoreId', 'storeName']
    }

    try {
      const resp = await UtilService.getProductStores(params)
      if (!hasError(resp)) {
        productStores = resp.data.docs
      } else {
        throw resp.data
      }
      console.log(resp.data.docs)
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, productStores)
  },

  async getUserProductStores({ commit, dispatch }, partyId) {
    let userProductStores = []
    const params = {
      inputFields: {
        partyId: partyId,
      },
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'ProductStoreRole',
      filterByDate: 'Y',
      fieldList: ['partyId', 'roleTypeId', 'productStoreId', 'fromDate']
    }

    try {
      // fetching stores and roles first as storeName and role description
      // are required in the UI
      await dispatch('getProductStores')
      await dispatch('getRoles')

      const resp = await UtilService.getProductStores(params)
      if (!hasError(resp) || resp.data.error === 'No record found') {
        userProductStores = resp.data.docs ? resp.data.docs : []
      } else {
        throw resp.data
      }
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    console.log(userProductStores)
    commit(types.UTIL_USER_PRODUCT_STORES_UPDATED, userProductStores)
  },

  async getSecurityGroups({ commit }) {
    const payload = {
      entityName: "SecurityGroup",
      viewSize: 200,
      distinct: "Y",
      noConditionFind: "Y",
    }

    let securityGroups = []
    try {
      const resp = await UtilService.getSecurityGroups(payload)
      if (!hasError(resp)) {
        securityGroups = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      console.error(error);
      showToast(translate("Something went wrong"));
    }
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroups);
  },
}
export default actions;