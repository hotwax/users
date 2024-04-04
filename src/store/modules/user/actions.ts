import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import * as types from './mutation-types'
import { showToast } from '@/utils'
import {
  hasError,
  logout,
  resetConfig,
  updateInstanceUrl,
  updateToken
} from '@/adapter'
import { Settings } from 'luxon';
import {
  getServerPermissionsFromRules,
  prepareAppPermissions,
  resetPermissions,
  setPermissions
} from '@/authorization'
import { translate, useAuthStore, useUserStore } from '@hotwax/dxp-components'
import emitter from '@/event-bus'
import logger from '@/logger';
import router from '@/router'

const actions: ActionTree<UserState, RootState> = {

  /**
 * Login user and return token
 */
  async login({ commit, dispatch }, payload) {
    try {
      const { token, oms } = payload;
      dispatch("setUserInstanceUrl", oms);

      // Getting the permissions list from server
      const permissionId = process.env.VUE_APP_PERMISSION_ID;
      // Prepare permissions list
      const serverPermissionsFromRules = getServerPermissionsFromRules();
      if (permissionId) serverPermissionsFromRules.push(permissionId);

      const serverPermissions = await UserService.getUserPermissions({
        permissionIds: [...new Set(serverPermissionsFromRules)]
      }, token);
      const appPermissions = prepareAppPermissions(serverPermissions);


      // Checking if the user has permission to access the app
      // If there is no configuration, the permission check is not enabled
      if (permissionId) {
        // As the token is not yet set in the state passing token headers explicitly
        // TODO Abstract this out, how token is handled should be part of the method not the callee
        const hasPermission = appPermissions.some((appPermission: any) => appPermission.action === permissionId);
        // If there are any errors or permission check fails do not allow user to login
        if (!hasPermission) {
          const permissionError = 'You do not have permission to access the app.';
          showToast(translate(permissionError));
          logger.error("error", permissionError);
          return Promise.reject(new Error(permissionError));
        }
      }

      const userProfile = await UserService.getUserProfile(token);

      setPermissions(appPermissions);
      if (userProfile.userTimeZone) {
        Settings.defaultZone = userProfile.userTimeZone;
      }
      updateToken(token)

      // TODO user single mutation
      commit(types.USER_INFO_UPDATED, userProfile);
      commit(types.USER_PERMISSIONS_UPDATED, appPermissions);
      commit(types.USER_TOKEN_CHANGED, { newToken: token })

      const partyId = router.currentRoute.value.query.partyId
      if (partyId) {
        return `/user-details/${partyId}`;
      }
    } catch (err: any) {
      // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
      // TODO Check if handling of specific status codes is required.
      showToast(translate('Something went wrong while login. Please contact administrator'));
      logger.error("error", err);
      return Promise.reject(err instanceof Object ? err :new Error((err)))
    }
  },

  /**
   * Logout user
   */
  async logout({ commit }, payload) {
    // store the url on which we need to redirect the user after logout api completes in case of SSO enabled
    let redirectionUrl = ''

    emitter.emit('presentLoader', { message: 'Logging out', backdropDismiss: false })

    // Calling the logout api to flag the user as logged out, only when user is authorised
    // if the user is already unauthorised then not calling the logout api as it returns 401 again that results in a loop, thus there is no need to call logout api if the user is unauthorised
    if (!payload?.isUserUnauthorised) {
      let resp;

      // wrapping the parsing logic in try catch as in some case the logout api makes redirection, and then we are unable to parse the resp and thus the logout process halts
      try {
        resp = await logout();

        // Added logic to remove the `//` from the resp as in case of get request we are having the extra characters and in case of post we are having 403
        resp = JSON.parse(resp.startsWith('//') ? resp.replace('//', '') : resp)
      } catch (err) {
        logger.error('Error parsing data', err)
      }

      if (resp?.logoutAuthType == 'SAML2SSO') {
        redirectionUrl = resp.logoutUrl
      }
    }

    const authStore = useAuthStore()
    const userStore = useUserStore()
    // TODO add any other tasks if need
    commit(types.USER_END_SESSION)
    this.dispatch('util/clearUtilState')
    this.dispatch('permission/clearPermissionState')

    resetPermissions();
    resetConfig();

    // reset plugin state on logout
    authStore.$reset()
    userStore.$reset()

    // If we get any url in logout api resp then we will redirect the user to the url
    if (redirectionUrl) {
      window.location.href = redirectionUrl
    }

    emitter.emit('dismissLoader')
    return redirectionUrl;
  },

  /**
   * Set User Instance Url
   */
  setUserInstanceUrl({ commit }, instanceUrl) {
    commit(types.USER_INSTANCE_URL_UPDATED, instanceUrl)
    updateInstanceUrl(instanceUrl)
  },

  /**
   * Update user timeZone
   */
  async setUserTimeZone({ state, commit }, payload) {
    const resp = await UserService.setUserTimeZone(payload)
    if (resp.status === 200 && !hasError(resp)) {
      const current: any = state.current;
      current.userTimeZone = payload.timeZoneId;
      commit(types.USER_INFO_UPDATED, current);
      Settings.defaultZone = current.userTimeZone;
      showToast(translate("Time zone updated successfully"));
    }
  },

  async getSelectedUserDetails({ commit, state }, payload) {
    const currentSelectedUser = JSON.parse(JSON.stringify(state.selectedUser))
    if (currentSelectedUser.partyId === payload.partyId && !payload.isFetchRequired) {
      return
    }

    let userResp = {} as any, selectedUser = {} as any, params = {
      inputFields: {
        "roleTypeIdTo": "APPLICATION_USER",
        partyId: payload.partyId,
      },
      fromDateName: "relationshipFromDate",
      thruDateName: "relationshipThruDate",
      filterByDate: "Y",
      viewSize: 1,
      entityName: 'PartyAndUserLoginSecurityGroupDetails',
      fieldList: ['createdByUserLogin', 'userLoginId', 'enabled', 'firstName', 'lastName', 'partyId', 'partyTypeId', 'groupName', 'externalId', 'statusId'],
    }

    try {
      userResp = await UserService.getUserLoginDetails(params)
      if (!hasError(userResp)) {
        selectedUser = {
          ...userResp.data.docs[0]
        }

        params = {
          inputFields: {
            partyId: payload.partyId,
            contactMechPurposeTypeId: ['PRIMARY_EMAIL', 'PRIMARY_PHONE'],
            contactMechPurposeTypeId_op: 'in'
          },
          viewSize: 2,
          filterByDate: 'Y',
          entityName: 'PartyContactDetailByPurpose',
          // TODO verify the format of contact number
          fieldList: ['areaCode', 'countryCode', 'contactNumber', 'infoString', 'contactMechId', 'contactMechPurposeTypeId']
        } as any

        const contactResp = await UserService.getUserContactDetails(params)
        if (!hasError(contactResp)) {
          let emailDetails = {}, phoneNumberDetails = {};

          contactResp.data.docs.map((doc: any) => {
            if (doc.contactMechPurposeTypeId === 'PRIMARY_EMAIL') {
              emailDetails = {
                email: doc.infoString,
                contactMechId: doc.contactMechId
              }
            } else {
              phoneNumberDetails = {
                contactNumber: doc.contactNumber,
                contactMechId: doc.contactMechId
              }
            }
          })

          selectedUser = {
            ...selectedUser,
            ...(Object.keys(emailDetails).length && { emailDetails }),
            ...(Object.keys(phoneNumberDetails).length && { phoneNumberDetails })
          }
        } else {
          throw contactResp.data
        }

      } else {
        throw userResp.data
      }
    } catch (error) {
      logger.error(error)
    }

    if (Object.keys(selectedUser).length) {
      selectedUser.facilities = await UserService.getUserFacilities(selectedUser.partyId)
      selectedUser.securityGroup = await UserService.getUserSecurityGroup(selectedUser.userLoginId)
      selectedUser.productStores = await UserService.getUserProductStores(selectedUser.partyId)
      if (selectedUser.userLoginId) {
        const userFavorites = await UserService.getUserFavorites({userLoginId: selectedUser.userLoginId})
        if (userFavorites) {
          selectedUser.favoriteProductStorePref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_PRODUCT_STORE');
          selectedUser.favoriteShopifyShopPref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_SHOPIFY_SHOP');
        }
      }

      const resp = await UserService.fetchPartyRelationship({
        inputFields: {
          partyIdTo: selectedUser.partyId,
          roleTypeIdTo: 'WAREHOUSE_PICKER',
          roleTypeIdTo_op: 'equals'
        },
        filterByDate: 'Y',
        viewSize: 1,
        entityName: 'PartyRelationship',
        fieldList: ['partyIdTo', 'roleTypeIdTo', "partyIdFrom", "roleTypeIdFrom", "fromDate"]
      })

      if (!hasError(resp)) {
        const pickerRelationship = resp.data.docs[0];
        selectedUser.isWarehousePicker = pickerRelationship ? true : false,
        selectedUser.pickerRelationship = pickerRelationship;
      }
    }

    if(selectedUser['createdByUserLogin']) {
      const resp = await UserService.checkUserLoginId({
        entityName: "UserLogin",
        inputFields: {
          userLoginId: selectedUser['createdByUserLogin']
        },
        viewSize: 1,
        fieldList: ['partyId'],
        distinct: 'Y',
        noConditionFind: 'Y'
      })

      if(!hasError(resp)) {
        selectedUser['createdByUserPartyId'] = resp.data.docs[0].partyId
      }
    }
    commit(types.USER_SELECTED_USER_UPDATED, selectedUser)
  },

  updateSelectedUser({ commit }, selectedUser) {
    commit(types.USER_SELECTED_USER_UPDATED, selectedUser)
  },

  async fetchUsers({ commit, state }, payload) {
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    const filters = {} as any

    if(state.query.securityGroup) {
      filters['securityGroupId'] = state.query.securityGroup
      filters['securityGroupId_op'] = 'equals'
    }

    if(state.query.status) {
      filters['userLoginId_op'] = 'not-empty'
      if (state.query.status === "N") {
        filters['enabled'] = state.query.status
        filters['enabled_op'] = 'equals'
      } else {
        filters['enabled'] = "N"
        filters['enabled_op'] = 'notEqual'  
      }
    }

    if (state.query.hideDisabledUser) {
      filters['statusId'] = "PARTY_DISABLED"
      filters['statusId_op'] = 'notEqual'  
    }

    if(state.query.queryString) {
      filters['groupName_value'] = state.query.queryString
      filters['groupName_op'] = 'contains'
      filters['groupName_ic'] = 'Y'
      filters['groupName_grp'] = '1'
      filters['firstName_value'] = state.query.queryString
      filters['firstName_op'] = 'contains'
      filters['firstName_ic'] = 'Y'
      filters['firstName_grp'] = '2'
      filters['lastName_value'] = state.query.queryString
      filters['lastName_op'] = 'contains'
      filters['lastName_ic'] = 'Y'
      filters['lastName_grp'] = '3'
    }

    // By default we are showing logged in user on top manually,
    // hence not fetching it in default list.
    if(!state.query.queryString) {
      filters['partyId_value'] = payload.currentUserPartyId,
      filters['partyId_op'] = 'notEqual'
    }

    const params = {
      "inputFields": {
        "roleTypeIdTo": "APPLICATION_USER", 
        ...filters
      },
      "fromDateName": "relationshipFromDate",
      "thruDateName": "relationshipThruDate",
      "filterByDate": "Y",
      "entityName": "PartyAndUserLoginSecurityGroupDetails",
      "noConditionFind": "Y",
      "distinct": "Y",
      "fieldList": ['partyId', 'createdByUserLogin', 'createdDate', 'enabled', 'firstName', 'lastName', "groupName", 'securityGroupId', 'securityGroupName', 'statusId', 'userLoginId'],
      "viewIndex": payload.viewIndex,
      "viewSize": payload.viewSize
    }

    let users = [], total = 0;

    try {
      const resp = await UserService.fetchUsers(params)

      if(!hasError(resp) && resp.data.count) {
        users = resp.data.docs
        if(payload.viewIndex && payload.viewIndex > 0) users = JSON.parse(JSON.stringify(state.users.list)).concat(resp.data.docs)
        total = resp.data.count
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.USER_LIST_UPDATED, { users, total });
  },

  updateQuery({ commit }, query) {
    commit(types.USER_QUERY_UPDATED, { query })
  },
  async clearSelectedUser({ commit }) {
    commit(types.USER_CLEAR_SELECTED_USER)
  },

  async setFavoriteProductStore({ commit, dispatch }, payload) {
    try {
      const params = {
        'userPrefLoginId': payload.userLoginId,
        'userPrefTypeId': 'FAVORITE_PRODUCT_STORE',
        'userPrefValue': payload.productStoreId
      }
      const resp = await UserService.setUserPreference(params);
      if (!hasError(resp)) {
        commit(types.USER_SELECTED_USER_UPDATED, {...this.state.user.selectedUser, favoriteProductStorePref: params})
        //removing favorite shop on change of favorite product store
        dispatch('setFavoriteShopifyShop', {'userLoginId': payload.userLoginId, 'shopId': ''});
        return Promise.resolve(resp.data)
      } else {
        throw resp.data;
      }
    } catch (error) {
      logger.error(error);
      return Promise.reject(error)
    }
  },
  async setFavoriteShopifyShop({ commit }, payload) {
    try {
      const params = {
        'userPrefLoginId': payload.userLoginId,
        'userPrefTypeId': 'FAVORITE_SHOPIFY_SHOP',
        'userPrefValue': payload.shopId
      }
      const resp = await UserService.setUserPreference(params);
      if (!hasError(resp)) {
        commit(types.USER_SELECTED_USER_UPDATED, {...this.state.user.selectedUser, favoriteShopifyShopPref: params})
        return Promise.resolve(resp.data)
      } else {
        throw resp.data;
      }
    } catch (error) {
      logger.error(error);
      return Promise.reject(error)
    }
  }
}
export default actions;