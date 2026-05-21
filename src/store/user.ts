import { defineStore } from 'pinia'
import { Settings } from 'luxon'
import {
  getServerPermissionsFromRules,
  prepareAppPermissions,
  resetPermissions,
  setPermissions,
} from '@/authorization'
import { showToast } from '@/utils'
import { translate, useAuthStore as useDxpAuthStore, useUserStore as useDxpUserStore } from '@hotwax/dxp-components'
import emitter from '@/event-bus'
import logger from '@/logger'
import router from '@/router'
import {
  hasError,
  logout as adapterLogout,
  resetConfig,
  updateInstanceUrl,
  updateToken
} from '@/adapter'

export interface UserState {
  token: string;
  current: any;
  instanceUrl: string;
  permissions: any;
  query: {
    queryString: string;
    securityGroup: string;
    status: string;
    hideDisabledUser: boolean;
  };
  selectedUser: any;
  users: {
    list: any[];
    total: number;
  };
  omsRedirectionInfo: {
    url: string;
    token: string;
  };
  redirectedFrom: string;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    current: {},
    instanceUrl: '',
    permissions: [],
    query: {
      queryString: '',
      securityGroup: '',
      status: '',
      hideDisabledUser: true
    },
    selectedUser: {},
    users: {
      list: [],
      total: 0
    },
    omsRedirectionInfo: {
      url: '',
      token: ''
    },
    redirectedFrom: ''
  }),
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isUserAuthenticated: (state): boolean => !!(state.token && state.current && Object.keys(state.current).length),
    getBaseUrl: (state): string => {
      let baseURL = process.env.VUE_APP_BASE_URL;
      if (!baseURL) baseURL = state.instanceUrl;
      if (!baseURL) return '';
      return baseURL.startsWith('http') 
        ? (baseURL.includes('/api') ? baseURL : `${baseURL}/api/`) 
        : `https://${baseURL}.hotwax.io/api/`;
    },
    getUserToken: (state): string => state.token,
    getUserProfile: (state): any => state.current,
    getInstanceUrl: (state): string => {
      const baseUrl = process.env.VUE_APP_BASE_URL;
      return baseUrl ? baseUrl : state.instanceUrl;
    },
    getUserPermissions: (state): any => state.permissions,
    getSelectedUser: (state): any => state.selectedUser,
    getUsers: (state): any[] => state.users.list,
    getQuery: (state): any => state.query,
    isScrollable: (state): boolean => {
      return (
        state.users.list?.length > 0 && 
        (state.users.list?.length % Number(process.env.VUE_APP_VIEW_SIZE) === 0)
      );
    },
    getUserProductStores: (state): any => state.selectedUser?.productStores || [],
    getUserSecurityGroups: (state): any => state.selectedUser?.securityGroups || [],
    getOmsRedirectionInfo: (state): any => state.omsRedirectionInfo,
    getRedirectedFromUrl: (state): string => state.redirectedFrom
  },
  actions: {
    async login(payload: any) {
      try {
        const { token, oms, omsRedirectionUrl } = payload;
        this.setUserInstanceUrl(oms);

        if (omsRedirectionUrl) {
          this.setOmsRedirectionInfo({ url: omsRedirectionUrl, token: "" });
        } else {
          showToast(translate("Some of the app functionality will not work due to missing configuration."));
        }

        // Dynamic import to avoid circular dependency
        const { UserService } = await import('@/services/UserService');

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
        if (permissionId) {
          const hasPerm = appPermissions.some((appPermission: any) => appPermission.action === permissionId);
          if (!hasPerm) {
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
        updateToken(token);

        this.current = userProfile;
        this.permissions = appPermissions;
        this.token = token;

        const { useUtilStore } = await import('./util');
        const utilStore = useUtilStore();
        await utilStore.fetchOrganizationPartyId();

        const partyId = router.currentRoute.value.query.partyId;
        if (router.currentRoute.value.query.redirectedFrom) {
          this.updateRedirectedFromUrl(router.currentRoute.value.query.redirectedFrom as string);
        }

        const { Actions: AuthActions, hasPermission: checkAppPermission } = await import('@/authorization');
        if (partyId && checkAppPermission(AuthActions.APP_USERS_LIST_VIEW)) {
          return `/user-details/${partyId}`;
        }
      } catch (err: any) {
        showToast(translate('Something went wrong while login. Please contact administrator'));
        logger.error("error", err);
        return Promise.reject(err instanceof Object ? err : new Error(err));
      }
    },
    async logout(payload?: any) {
      let redirectionUrl = '';
      emitter.emit('presentLoader', { message: 'Logging out' });

      if (!payload?.isUserUnauthorised) {
        let resp;
        try {
          resp = await adapterLogout();
          resp = JSON.parse(resp.startsWith('//') ? resp.replace('//', '') : resp);
        } catch (err) {
          logger.error('Error parsing data', err);
        }

        if (resp?.logoutAuthType == 'SAML2SSO') {
          redirectionUrl = resp.logoutUrl;
        }
      }

      const dxpAuthStore = useDxpAuthStore();
      const dxpUserStore = useDxpUserStore();

      // Reset state
      this.$reset();

      const { useUtilStore } = await import('./util');
      const { usePermissionStore } = await import('./permission');
      const utilStore = useUtilStore();
      const permissionStore = usePermissionStore();
      utilStore.clearUtilState();
      permissionStore.clearPermissionState();

      this.setOmsRedirectionInfo({ url: "", token: "" });

      resetPermissions();
      resetConfig();

      // Reset DXP components plugin store states on logout
      dxpAuthStore.$reset();
      dxpUserStore.$reset();

      if (redirectionUrl) {
        window.location.href = redirectionUrl;
      }

      emitter.emit('dismissLoader');
      return redirectionUrl;
    },
    setUserInstanceUrl(instanceUrl: string) {
      this.instanceUrl = instanceUrl;
      updateInstanceUrl(instanceUrl);
    },
    async setUserTimeZone(timeZoneId: string) {
      if (this.current) {
        this.current.userTimeZone = timeZoneId;
      }
      Settings.defaultZone = timeZoneId;
    },
    setOmsRedirectionInfo(payload: { url: string; token: string }) {
      this.omsRedirectionInfo = payload;
    },
    async getSelectedUserDetails(payload: { partyId: string; isFetchRequired?: boolean }) {
      const currentSelectedUser = JSON.parse(JSON.stringify(this.selectedUser));
      if (currentSelectedUser.partyId === payload.partyId && !payload.isFetchRequired) {
        return;
      }

      const { UserService } = await import('@/services/UserService');

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
        fieldList: ['createdByUserLogin', 'userLoginId', 'enabled', "hasLoggedOut", 'firstName', 'lastName', 'partyId', 'partyTypeId', 'groupName', 'externalId', 'statusId'],
      };

      try {
        userResp = await UserService.getUserLoginDetails(params);
        if (!hasError(userResp)) {
          selectedUser = {
            ...userResp.data.docs[0]
          };

          params = {
            inputFields: {
              partyId: payload.partyId,
              contactMechPurposeTypeId: ['PRIMARY_EMAIL', 'PRIMARY_PHONE'],
              contactMechPurposeTypeId_op: 'in'
            },
            viewSize: 2,
            filterByDate: 'Y',
            entityName: 'PartyContactDetailByPurpose',
            fieldList: ['areaCode', 'countryCode', 'contactNumber', 'infoString', 'contactMechId', 'contactMechPurposeTypeId']
          } as any;

          const contactResp = await UserService.getUserContactDetails(params);
          if (!hasError(contactResp)) {
            let emailDetails = {}, phoneNumberDetails = {};

            contactResp.data.docs.map((doc: any) => {
              if (doc.contactMechPurposeTypeId === 'PRIMARY_EMAIL') {
                emailDetails = {
                  email: doc.infoString,
                  contactMechId: doc.contactMechId
                };
              } else {
                phoneNumberDetails = {
                  contactNumber: doc.contactNumber,
                  contactMechId: doc.contactMechId
                };
              }
            });

            selectedUser = {
              ...selectedUser,
              ...(Object.keys(emailDetails).length && { emailDetails }),
              ...(Object.keys(phoneNumberDetails).length && { phoneNumberDetails })
            };
          } else {
            throw contactResp.data;
          }
        } else {
          throw userResp.data;
        }
      } catch (error) {
        logger.error(error);
      }

      if (Object.keys(selectedUser).length) {
        selectedUser.facilities = await UserService.getUserFacilities(selectedUser.partyId);
        selectedUser.securityGroups = await UserService.getUserSecurityGroups(selectedUser.userLoginId);
        selectedUser.productStores = await UserService.getUserProductStores(selectedUser.partyId);
        if (selectedUser.userLoginId) {
          const userFavorites = await UserService.getUserFavorites({ userLoginId: selectedUser.userLoginId });
          if (userFavorites) {
            selectedUser.favoriteProductStorePref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_PRODUCT_STORE');
            selectedUser.favoriteShopifyShopPref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_SHOPIFY_SHOP');
          }
        }

        const resp = await UserService.getPartyRole({
          inputFields: {
            partyId: selectedUser.partyId,
            roleTypeId: 'WAREHOUSE_PICKER'
          },
          viewSize: 1,
          entityName: 'PartyRole',
          fieldList: ['partyId', 'roleTypeId']
        });

        if (!hasError(resp) && resp.data.docs.length) {
          selectedUser.isWarehousePicker = true;
        }
      }

      if (selectedUser['createdByUserLogin']) {
        const resp = await UserService.checkUserLoginId({
          entityName: "UserLogin",
          inputFields: {
            userLoginId: selectedUser['createdByUserLogin']
          },
          viewSize: 1,
          fieldList: ['partyId'],
          distinct: 'Y',
          noConditionFind: 'Y'
        });

        if (!hasError(resp)) {
          selectedUser['createdByUserPartyId'] = resp.data.docs[0].partyId;
        }
      }
      this.selectedUser = selectedUser;
    },
    updateSelectedUser(selectedUser: any) {
      this.selectedUser = selectedUser;
    },
    async fetchUsers(payload: { currentUserPartyId: string; viewIndex: number; viewSize: number }) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");
      const filters = {} as any;

      if (this.query.securityGroup) {
        filters['securityGroupId'] = this.query.securityGroup;
        filters['securityGroupId_op'] = 'equals';
      }

      if (this.query.status) {
        filters['userLoginId_op'] = 'not-empty';
        if (this.query.status === "N") {
          filters['enabled'] = this.query.status;
          filters['enabled_op'] = 'equals';
        } else {
          filters['enabled'] = "N";
          filters['enabled_op'] = 'notEqual';  
        }
      }

      if (this.query.hideDisabledUser) {
        filters['statusId'] = "PARTY_DISABLED";
        filters['statusId_op'] = 'notEqual';  
      }

      if (this.query.queryString) {
        const keyword = this.query.queryString.split(' ')[0];

        filters['groupName_value'] = keyword;
        filters['groupName_op'] = 'like';
        filters['groupName_ic'] = 'Y';
        filters['groupName_grp'] = '1';
        filters['firstName_value'] = keyword;
        filters['firstName_op'] = 'like';
        filters['firstName_ic'] = 'Y';
        filters['firstName_grp'] = '2';
        filters['lastName_value'] = keyword;
        filters['lastName_op'] = 'like';
        filters['lastName_ic'] = 'Y';
        filters['lastName_grp'] = '3';
      }

      if (!this.query.queryString) {
        filters['partyId_value'] = payload.currentUserPartyId;
        filters['partyId_op'] = 'notEqual';
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
      };

      let users = JSON.parse(JSON.stringify(this.users.list));
      let total = this.users.total;
      
      const { UserService } = await import('@/services/UserService');

      try {
        const resp = await UserService.fetchUsers(params);
        if (!hasError(resp)) { 
          if (resp.data.count > 0) { 
            if (payload.viewIndex && payload.viewIndex > 0) { 
              users = users.concat(resp.data.docs); 
            } else {
              users = resp.data.docs;
            }
            total = resp.data.count;
          }
        } else {
          throw resp.data; 
        }
      } catch (error) {
        if (payload.viewIndex === 0) { 
          users = []; 
          total = 0; 
        }
      }
      
      this.users.list = users;
      this.users.total = total;
      emitter.emit("dismissLoader");
    },
    updateQuery(query: any) {
      this.query = query;
    },
    async clearSelectedUser() {
      this.selectedUser = {};
    },
    async setFavoriteProductStore(payload: { userLoginId: string; productStoreId: string }) {
      const { UserService } = await import('@/services/UserService');
      try {
        const params = {
          'userPrefLoginId': payload.userLoginId,
          'userPrefTypeId': 'FAVORITE_PRODUCT_STORE',
          'userPrefValue': payload.productStoreId
        };
        const resp = await UserService.setUserPreference(params);
        if (!hasError(resp)) {
          this.selectedUser = { ...this.selectedUser, favoriteProductStorePref: params };
          await this.setFavoriteShopifyShop({ 'userLoginId': payload.userLoginId, 'shopId': '' });
          return Promise.resolve(resp.data);
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
        return Promise.reject(error);
      }
    },
    async setFavoriteShopifyShop(payload: { userLoginId: string; shopId: string }) {
      const { UserService } = await import('@/services/UserService');
      try {
        const params = {
          'userPrefLoginId': payload.userLoginId,
          'userPrefTypeId': 'FAVORITE_SHOPIFY_SHOP',
          'userPrefValue': payload.shopId
        };
        const resp = await UserService.setUserPreference(params);
        if (!hasError(resp)) {
          this.selectedUser = { ...this.selectedUser, favoriteShopifyShopPref: params };
          return Promise.resolve(resp.data);
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
        return Promise.reject(error);
      }
    },
    async updateRedirectedFromUrl(url: string) {
      this.redirectedFrom = url;
    }
  },
  persist: {
    pick: ['current', 'token', 'instanceUrl', 'permissions', 'omsRedirectionInfo']
  }
})
