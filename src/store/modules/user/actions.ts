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
        permissionIds: serverPermissionsFromRules
      }, token);
      const appPermissions = prepareAppPermissions(serverPermissions);


      // Checking if the user has permission to access the app
      // If there is no configuration, the permission check is not enabled
      if (permissionId) {
        // As the token is not yet set in the state passing token headers explicitly
        // TODO Abstract this out, how token is handled should be part of the method not the callee
        const hasPermission = appPermissions.some((appPermissionId: any) => appPermissionId === permissionId);
        // If there are any errors or permission check fails do not allow user to login
        if (hasPermission) {
          const permissionError = 'You do not have permission to access the app.';
          showToast(translate(permissionError));
          console.error("error", permissionError);
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

    } catch (err: any) {
      // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
      // TODO Check if handling of specific status codes is required.
      showToast(translate('Something went wrong while login. Please contact administrator'));
      console.error("error", err);
      return Promise.reject(new Error(err))
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
        console.error('Error parsing data', err)
      }

      if (resp?.logoutAuthType == 'SAML2SSO') {
        redirectionUrl = resp.logoutUrl
      }
    }

    const authStore = useAuthStore()
    const userStore = useUserStore()
    // TODO add any other tasks if need
    commit(types.USER_END_SESSION)
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
    if (currentSelectedUser.partyId === payload.partyId) {
      return
    }

    emitter.emit('presentLoader')

    let resp = {} as any, selectedUser = {}, params = {
      inputFields: {
        partyId: payload.partyId,
      },
      viewSize: 1,
      entityName: 'UserLoginAndPartyDetails',
      fieldList: ['userLoginId', 'enabled', 'firstName', 'lastName', 'partyId', 'partyTypeId', 'groupName']
    }

    try {
      resp = await UserService.getUserLoginDetails(params)
      if (!hasError(resp)) {
        selectedUser = {
          ...resp.data.docs[0]
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
          fieldList: ['areaCode', 'countryCode', 'contactNumber', 'infoString', 'externalId', 'contactMechId', 'contactMechPurposeTypeId']
        } as any

        resp = await UserService.getUserContactDetails(params)
        // TODO handle UI if API fail
        if (!hasError(resp)) {
          let emailDetails = {}, phoneNumberDetails = {};

          resp.data.docs.map((doc: any) => {
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
            externalId: resp.data.docs[0].externalId,
            ...(Object.keys(emailDetails).length && { emailDetails }),
            ...(Object.keys(phoneNumberDetails).length && { phoneNumberDetails })
          } 
        } else {
          throw resp.data
        }
      } else {
        throw resp.data
      }
    } catch (error) {
      showToast(translate('Something went wrong.'));
      console.error(error)
    }
    emitter.emit('dismissLoader')
    commit(types.USER_SELECTED_USER_UPDATED, selectedUser)
  },

  updateSelectedUser({ commit }, user) {
    commit(types.USER_SELECTED_USER_UPDATED, user)
  }
}
export default actions;