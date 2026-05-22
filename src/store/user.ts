import { defineStore } from 'pinia'
import { DateTime, Settings } from "luxon"
import { api, commonUtil, emitter, i18n, logger, translate, useAuth } from '@common';
import { useUtilStore } from '@/store/util';

export interface UserState {
  current: any;
  instanceUrl: string;
  permissions: any;
  timeZones: any[],
  localeOptions: any,
  locale: string,
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
  redirectedFrom: string;
  oms: any
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    current: {},
    instanceUrl: '',
    permissions: [],
    timeZones: [],
    localeOptions: import.meta.env.VITE_LOCALES ? JSON.parse(import.meta.env.VITE_LOCALES) : { "en-US": "English" },
    locale: 'en-US',
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
    redirectedFrom: '',
    oms: ""
  }),
  getters: {
    getUserProfile: (state): any => state.current,
    getUserPermissions: (state): any => state.permissions,
    getSelectedUser: (state): any => state.selectedUser,
    getUsers: (state): any[] => state.users.list,
    getQuery: (state): any => state.query,
    isScrollable: (state): boolean => {
      return (
        state.users.list?.length > 0 && 
        (state.users.list?.length % Number(import.meta.env.VITE_VIEW_SIZE) === 0)
      );
    },
    getUserProductStores: (state): any => state.selectedUser?.productStores || [],
    getUserSecurityGroups: (state): any => state.selectedUser?.securityGroups || [],
    getRedirectedFromUrl: (state): string => state.redirectedFrom,
    hasPermission: (state: UserState) => (permissionId: string): boolean => {
      const permissions = state.permissions;

      if (!permissionId) {
        return true;
      }

      // Handle OR/AND logic in permission string
      if (permissionId.includes(' OR ')) {
        const parts = permissionId.split(' OR ');
        return parts.some(part => useUserStore().hasPermission(part.trim()));
      }

      if (permissionId.includes(' AND ')) {
        const parts = permissionId.split(' AND ');
        return parts.every(part => useUserStore().hasPermission(part.trim()));
      }

      return permissions.includes(permissionId);
    }
  },
  actions: {

    updateUserInfo(payload: any) {
      this.current = { ...this.current, ...payload }
    },
    setPermissionsState(payload: any) {
      this.permissions = payload
    },
    async fetchUserProfile() {
      try {
        const userProfileResp = await api({
          url: "admin/user/profile",
          method: "get",
        }) as any;
        this.current = userProfileResp.data
        useAuth().updateUserId(this.current.userId)

        if (this.current.timeZone) {
          Settings.defaultZone = this.current.timeZone;
        }
      } catch (error: any) {
        commonUtil.showToast(translate("Failed to fetch user profile information"));
        console.error("error", error);
        useAuth().clearAuth();
        return Promise.reject(new Error(error));
      }
    },
    async fetchPermissions() {
      const permissionId = import.meta.env.VITE_APP_PERMISSION_ID;
      const serverPermissions = [] as any;

      // TODO Make it configurable from the environment variables.
      // Though this might not be an server specific configuration, 
      // we will be adding it to environment variable for easy configuration at app level
      const viewSize = 50;

      let viewIndex = 0;

      try {
        let resp;
        do {
          resp = await api({
            url: "getPermissions",
            method: "post",
            baseURL: commonUtil.getOmsURL(),
            data: { viewIndex, viewSize }
          }) as any

          if (resp.status === 200 && resp.data.docs?.length && !commonUtil.hasError(resp)) {
            serverPermissions.push(...resp.data.docs.map((permission: any) => permission.permissionId));
            viewIndex++;
          } else {
            resp = null;
          }
        } while (resp);

        // Checking if the user has permission to access the app
        // If there is no configuration, the permission check is not enabled
        if (permissionId) {
          const hasAppPermission = serverPermissions.includes(permissionId);
          if (!hasAppPermission) {
            const permissionError = "You do not have permission to access the app.";
            commonUtil.showToast(translate(permissionError));
            logger.error("error", permissionError);
            return Promise.reject(new Error(permissionError));
          }
        }

        // Update the state with the fetched permissions
        this.permissions = serverPermissions;
      } catch (error: any) {
        return Promise.reject(error);
      }
    },

    async setUserTimeZone(tzId: string) {
      try {
        await api({
          url: "admin/user/profile",
          method: "POST",
          data: { userId: this.current.userId, timeZone: tzId },
        });
        this.updateUserInfo({ userTimeZone: tzId })
        this.current.timeZone = tzId
      } catch (error: any) {
        console.error("Failed to set user time zone", error);
        commonUtil.showToast(translate("Failed to set user time zone"));
      }
    },
    async getAvailableTimeZones() {
      // Do not fetch timeZones information, if already available
      if (this.timeZones.length) {
        return;
      }

      try {
        const resp = await api({
          url: "admin/user/getAvailableTimeZones",
          method: "get",
          cache: true
        }) as any;
        if (resp.status === 200 && !commonUtil.hasError(resp)) {
          this.timeZones = resp.data.timeZones.filter((timeZone: any) => DateTime.local().setZone(timeZone.id).isValid);
        }
      } catch (err) {
        console.error('Error', err)
      }
    },
    async setLocale(locale: string) {
      let newLocale = this.locale;
      let matchingLocale: string | undefined;

      try {
        const userProfile = this.current
        if (locale) {
          matchingLocale = Object.keys(this.localeOptions).find((option: string) => option === locale)
          // If exact locale is not found, try to match the first two characters i.e primary code
          matchingLocale = matchingLocale || Object.keys(this.localeOptions).find((option: string) => option.slice(0, 2) === locale.slice(0, 2))
          newLocale = matchingLocale || this.locale
          // update locale in state and globally
          await api({
            url: "admin/user/profile",
            method: "POST",
            data: {
              userId: userProfile.userId,
              locale: newLocale
            },
          });
        }
      } catch (error) {
        console.error(error)
      } finally {
        i18n.global.locale.value = newLocale as any
        this.locale = newLocale
      }
    },

    async postLogin() {
      try {
        await this.fetchPermissions()
        await this.fetchUserProfile()
        await useUtilStore().fetchOrganizationPartyId()
      } catch (error: any) {
        return Promise.reject(error);
      }
    },
    async postLogout() {
      this.$reset();
      useUtilStore().$reset();
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
        if (!commonUtil.hasError(userResp)) {
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
          if (!commonUtil.hasError(contactResp)) {
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

        if (!commonUtil.hasError(resp) && resp.data.docs.length) {
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

        if (!commonUtil.hasError(resp)) {
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
        if (!commonUtil.hasError(resp)) { 
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
        if (!commonUtil.hasError(resp)) {
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
        if (!commonUtil.hasError(resp)) {
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
