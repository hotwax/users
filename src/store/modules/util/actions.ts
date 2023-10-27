import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import UtilState from './UtilState'
import { UtilService } from '@/services/UtilService'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'

const actions: ActionTree<UtilState, RootState> = {

  async getSecurityGroups ({ dispatch, commit }) {
    const payload = {
      "entityName": "SecurityGroup",
      "viewSize": 200,
      "distinct": "Y",
      "noConditionFind": "Y",
    }

    let securityGroupOptions = []

    try {
      const resp = await UtilService.getSecurityGroups(payload)

      if(!hasError(resp)) {
        securityGroupOptions = resp.data.docs
      }
    } catch(error) {
      console.error(error);
      showToast(translate("Something went wrong"));
    }
    commit(types.UTIL_SECURITY_GROUPS_UPDATED, securityGroupOptions );
  },
}

export default actions;