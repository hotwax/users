import { defineStore } from 'pinia'
import { DateTime, Settings } from "luxon"
import { api, client, commonUtil, emitter, i18n, logger, translate, useAuth } from '@common';
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
    userGroupId: string;
    status: string;
  };
  selectedUser: any;
  users: {
    list: any[];
    total: number;
  };
  redirectedFrom: string;
  oms: any;
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
      userGroupId: '',
      status: '',
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
    getSelectedUserProductStores: (state): any => state.selectedUser?.productStores || [],
    getSelectedUserSecurityGroups: (state): any => state.selectedUser?.securityGroups || [],
    getTimeZones: (state): any[] => state.timeZones,
    getCurrentTimeZone: (state): string => state.current?.timeZone || DateTime.local().zoneName,
    getLocale: (state) => state.locale,
    getLocaleOptions: (state) => state.localeOptions,
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
    async addPartyToFacility(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/addPartyToFacility",
        method: "post",
        data: payload
      });
    },
    async addUserToSecurityGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/addPartyUserPermission",
        method: "post",
        data: payload
      });
    },
    async createNewUserLogin(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createNewUserLoginAndSetUserPreference",
        method: "post",
        data: payload
      });
    },
    async createProductStoreRole(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createProductStoreRole",
        method: "post",
        data: payload
      });
    },
    async createRoleType(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createRoleType",
        method: "post",
        data: payload
      });
    },
    async createUpdatePartyEmailAddress(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createUpdatePartyEmailAddress",
        method: "post",
        data: payload
      });
    },
    async createUpdatePartyTelecomNumber(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createUpdatePartyTelecomNumber",
        method: "post",
        data: payload
      });
    },
    async createUser(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createRelationship",
        method: "post",
        data: payload
      });
    },
    async deletePartyContactMech(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/deletePartyContactMech",
        method: "post",
        data: payload
      });
    },
    async deletePartyRole(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/deletePartyRole",
        method: "post",
        data: payload
      });
    },
    async ensurePartyRole(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/ensurePartyRole",
        method: "post",
        data: payload
      });
    },
    async fetchUserSecurityGroupAssocHistory(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "performFind",
        method: "post",
        data: payload
      });
    },
    async fetchLogoImageForParty(partyId: any): Promise<any> {
      let profileImage = {};

      try {
        let resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: {
            entityName: "PartyContentDetail",
            inputFields: {
              partyId,
            },
            viewSize: 1,
            fieldList: ['partyId', 'dataResourceId'],
            noConditionFind: 'Y',
            filterByDate: 'Y'
          }
        }) as any

        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          const partyContents = resp.data.docs;

          resp = await api({
            baseURL: commonUtil.getOmsURL(),
            url: 'performFind',
            method: 'POST',
            data: {
              entityName: "DataResource",
              inputFields: {
                dataResourceId: partyContents[0].dataResourceId
              },
              viewSize: 1,
              fieldList: ['dataResourceId', 'objectInfo'],
              noConditionFind: 'Y'
            }
          })

          if (!commonUtil.hasError(resp) && resp.data.count > 0) {
            profileImage = resp.data.docs[0]
          } else {
            throw resp.data
          }
        }
        return profileImage;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    async forceLogout(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/forceLogout",
        method: "post",
        data: payload
      });
    },
    async getUserFacilities(partyId: string): Promise<any> {
      let facilities = []
      const payload = {
        inputFields: {
          partyId
        },
        noConditionFind: "Y",
        filterByDate: "Y",
        entityName: "FacilityParty",
        viewSize: 100,
      }

      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload
        }) as any

        if (!commonUtil.hasError(resp) || resp.data.error === 'No record found') {
          facilities = resp.data.docs ? resp.data.docs : []
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error('Failed to fetch user associated facilities.', error)
      }

      return facilities
    },
    async getUserProductStores(partyId: string): Promise<any> {
      let productStores = []
      const payload = {
        inputFields: {
          partyId,
        },
        viewSize: 100,
        entityName: 'ProductStoreAndRole',
        filterByDate: 'Y',
        fieldList: ['partyId', 'storeName', 'roleTypeId', 'productStoreId', 'fromDate']
      }

      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload
        }) as any

        const utilStore = useUtilStore();
        Promise.allSettled([utilStore.fetchProductStores(), utilStore.fetchRoles()])

        if (!commonUtil.hasError(resp) || resp.data.error === 'No record found') {
          productStores = resp.data.docs ? resp.data.docs : []
        } else {
          throw resp.data
        }
      } catch (error) {
        logger.error('Failed to fetch user associated product stores.', error)
      }
      return productStores
    },
    async getUserSecurityGroups(userLoginId: string): Promise<any> {
      let userSecurityGroups = [] as any
      const payload = {
        inputFields: {
          userLoginId,
        },
        entityName: "UserLoginSecurityGroup",
        filterByDate: "Y",
        viewSize: 20,
        fieldList: ["groupId", "userLoginId", "fromDate"]
      }

      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload
        }) as any

        if (!commonUtil.hasError(resp) || resp.data.error === 'No record found') {
          userSecurityGroups = resp.data.docs ? resp.data.docs : []
        } else {
          throw resp.data
        }
      } catch (error) {
        logger.error('Failed to fetch user associated security groups.', error)
      }

      return userSecurityGroups
    },
    async getUserGroups(userId: string): Promise<any> {
      let userGroups = [] as any

      try {
        const resp = await api({
          url: `admin/users/${userId}/groups`,
          method: "get"
        }) as any

        if (!commonUtil.hasError(resp)) {
          userGroups = resp.data
        } else {
          throw resp.data
        }
      } catch (error) {
        logger.error('Failed to fetch user associated groups.', error)
      }

      return userGroups
    },
    async isRoleTypeExists(roleTypeId: string): Promise<any> {
      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: {
            entityName: "RoleType",
            inputFields: {
              roleTypeId
            },
            viewSize: 1,
            fieldList: ['roleTypeId'],
            noConditionFind: 'Y'
          }
        }) as any
        if (!commonUtil.hasError(resp) && resp.data.docs.length) {
          return true
        }
        return false
      } catch (err) {
        return false
      }
    },
    async isUserFulfillmentAdmin(groupIds: string): Promise<any> {
      const payload = {
        inputFields: {
          groupId: groupIds,
          groupId_op: "in",
          permissionId: "STOREFULFILLMENT_ADMIN"
        },
        entityName: "SecurityGroupPermission",
        filterByDate: "Y",
        viewSize: 1,
        fieldList: ["groupId", "permissionId", "fromDate"]
      };

      try {
        const resp: any = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload,
        });
        if (!commonUtil.hasError(resp) && resp.data.docs.length) {
          return true
        }
        return false
      } catch (err) {
        return false
      }
    },
    async isUserLoginIdAlreadyExists(username: string): Promise<any> {
      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: {
            entityName: "UserLogin",
            inputFields: {
              userLoginId: username
            },
            viewSize: 1,
            fieldList: ['userLoginId', 'partyId'],
            distinct: 'Y',
            noConditionFind: 'Y'
          }
        }) as any
        if (!commonUtil.hasError(resp) && resp.data.docs.length) {
          commonUtil.showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: username }))
          return true
        }
        return false
      } catch (err) {
        return false
      }
    },
    async removePartyFromFacility(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/removePartyFromFacility",
        method: "post",
        data: payload
      });
    },
    async removeUserSecurityGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/removePartyUserPermission",
        method: "post",
        data: payload
      });
    },
    async resetPassword(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/resetPassword",
        method: "post",
        data: payload
      });
    },
    async sendResetPasswordEmail(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "sendResetPasswordMail",
        method: "post",
        data: payload
      });
    },
    async updatePartyGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/updatePartyGroup",
        method: "post",
        data: payload
      });
    },
    async updatePerson(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/updatePerson",
        method: "post",
        data: payload
      });
    },
    async updateProductStoreRole(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/updateProductStoreRole",
        method: "post",
        data: payload
      });
    },
    async updateUserLoginStatus(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/updateUserLoginStatus",
        method: "post",
        data: payload
      });
    },
    async uploadPartyImage(payload: any): Promise<any> {
      return client({
        url: 'service/uploadPartyLogoImage',
        method: 'POST',
        data: payload,
        baseURL: commonUtil.getOmsURL(),
        headers: { "Content-Type": "multipart/form-data" },
      })
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
      const permissionId = import.meta.env.VITE_APP_PERMISSION_ID
      const serverPermissions = [] as any
      const viewSize = 50
      let viewIndex = 0

      try {
        let resp
        do {
          resp = await api({
            url: "admin/user/permissions",
            method: "get",
            params: { viewIndex, viewSize }
          }) as any

          if (resp.status === 200 && resp.data.docs?.length && !commonUtil.hasError(resp)) {
            serverPermissions.push(...resp.data.docs.map((permission: any) => permission.permissionId));
            viewIndex++;
          } else {
            resp = null;
          }
        } while (resp);

        if(permissionId) {
          const hasAppPermission = serverPermissions.includes(permissionId)
          if(!hasAppPermission) {
            const permissionError = "You do not have permission to access the app."
            await commonUtil.showToast(translate(permissionError))
            logger.error("error", permissionError)
            return Promise.reject(new Error(permissionError))
          }
        }

        this.permissions = serverPermissions
      } catch(error: any) {
        return Promise.reject(error)
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
    async finishSetup(payload: any): Promise<any> {
      const organizationPartyId = useUtilStore().getOrganizationPartyId;

      try {
        const selectedUser = payload.selectedUser;
        const selectedTemplate = payload.selectedTemplate;
        const partyId = selectedUser.partyId;
        const promises = [];

        if (selectedTemplate.isUserLoginRequired || selectedUser.partyTypeId === "PARTY_GROUP") {
          if (await this.isUserLoginIdAlreadyExists(payload.formData.userLoginId)) {
            throw {
              errorMessage: translate('Could not create login user: user with ID already exists.', { userLoginId: payload.formData.userLoginId }),
            }
          }

          const resp = await this.createNewUserLogin({
            "partyId": partyId,
            "userLoginId": payload.formData.userLoginId,
            "currentPassword": payload.formData.currentPassword,
            "currentPasswordVerify": payload.formData.currentPassword,
            "requirePasswordChange": payload.formData.requirePasswordChange ? "Y" : "N",
            "enabled": "Y",
            "userPrefTypeId": "ORGANIZATION_PARTY",
            "userPrefValue": organizationPartyId
          });
          if (!commonUtil.hasError(resp)) {
            this.addUserToSecurityGroup({
              "userLoginId": payload.formData.userLoginId,
              "groupIds": payload.selectedTemplate.securityGroupId ? [payload.selectedTemplate.securityGroupId] : ["STORE_MANAGER"],
            });
          } else {
            throw resp.data;
          }
        }

        if (selectedTemplate.isEmployeeIdRequired) {
          if (selectedUser.partyTypeId === "PARTY_GROUP") {
            promises.push(this.updatePartyGroup({
              "partyId": partyId,
              "groupName": selectedUser.groupName,
              "externalId": payload.formData.externalId
            }));
          } else {
            promises.push(this.updatePerson({
              "firstName": selectedUser.firstName,
              "lastName": selectedUser.lastName,
              "partyId": partyId,
              "externalId": payload.formData.externalId
            }));
          }
        }

        if (payload.formData.emailAddress && payload.formData.emailAddress !== selectedUser.emailDetails?.email) {
          promises.push(this.createUpdatePartyEmailAddress({
            "partyId": partyId,
            "contactMechId": selectedUser.emailDetails?.contactMechId ? selectedUser.emailDetails?.contactMechId : "",
            "emailAddress": payload.formData.emailAddress,
            "contactMechPurposeTypeId": "PRIMARY_EMAIL",
          }));
        }

        const roleTypeIdSet = new Set<string>();
        if (payload.selectedTemplate.roleTypeId) { roleTypeIdSet.add(payload.selectedTemplate.roleTypeId) }
        if (payload.selectedTemplate.productStoreRoleTypeId && payload.productStores.length > 0 && selectedTemplate.isProductStoreRequired) { roleTypeIdSet.add(payload.selectedTemplate.productStoreRoleTypeId) }

        if (payload.facilities.length > 0) {
          roleTypeIdSet.add(payload.selectedTemplate.facilityRoleTypeId || "WAREHOUSE_PICKER");

          if (selectedUser.partyTypeId === "PARTY_GROUP") { roleTypeIdSet.add("FAC_LOGIN") }
        }

        for (const roleTypeId of roleTypeIdSet) {
          const result = await this.ensurePartyRole({
            partyId,
            roleTypeId,
          });

          if (commonUtil.hasError(result)) {
            throw result.data;
          }
        }

        if (payload.productStores.length > 0 && selectedTemplate.isProductStoreRequired) {
          payload.productStores?.forEach((store: any) => {
            promises.push(this.createProductStoreRole({
              "partyId": partyId,
              "productStoreId": store.productStoreId,
              "roleTypeId": payload.selectedTemplate.productStoreRoleTypeId,
              "fromDate": DateTime.now().toMillis()
            }));
          });
        }

        if (payload.facilities.length > 0) {
          const selectedFacilityIds = new Set(payload.facilities.map((facility: any) => facility.facilityId));
          const facilitiesToAdd = payload.facilities.filter((facility: any) => !selectedUser.facilities?.some((fac: any) => fac.facilityId === facility.facilityId));
          const facilitiestoDelete = selectedUser.facilities?.filter((facility: any) => !selectedFacilityIds.has(facility.facilityId));

          facilitiestoDelete?.forEach((facility: any) => {
            promises.push(this.removePartyFromFacility({
              partyId: partyId,
              facilityId: facility.facilityId,
              roleTypeId: facility.roleTypeId,
              fromDate: facility.fromDate,
              thruDate: DateTime.now().toMillis()
            }));
          });

          facilitiesToAdd?.forEach((facility: any) => {
            promises.push(this.addPartyToFacility({
              "partyId": partyId,
              "facilityId": facility.facilityId,
              "roleTypeId": payload.selectedTemplate.facilityRoleTypeId ? payload.selectedTemplate.facilityRoleTypeId : "WAREHOUSE_PICKER",
            }));
          });

          if (selectedUser.partyTypeId === "PARTY_GROUP") {
            const facilityId = [...selectedFacilityIds][0]

            if (!await this.isRoleTypeExists("FAC_LOGIN")) {
              const resp = await this.createRoleType({
                "roleTypeId": "FAC_LOGIN",
                "description": "Facility Login",
              })
              if (commonUtil.hasError(resp)) {
                throw resp.data;
              }
            }

            promises.push(this.addPartyToFacility({
              "partyId": partyId,
              "facilityId": facilityId,
              "roleTypeId": "FAC_LOGIN"
            }));
          }
        }

        await Promise.all(promises).then(responses => {
          responses.forEach(response => {
            if (commonUtil.hasError(response)) {
              throw response.data;
            }
          });
        })

      } catch (error: any) {
        return Promise.reject(error)
      }
    },
    async getSelectedUserDetails(payload: { partyId: string; isFetchRequired?: boolean }) {
      const currentSelectedUser = JSON.parse(JSON.stringify(this.selectedUser));
      if (currentSelectedUser.partyId === payload.partyId && !payload.isFetchRequired) {
        return;
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
        fieldList: ['createdByUserLogin', 'userLoginId', 'enabled', "hasLoggedOut", 'firstName', 'lastName', 'partyId', 'partyTypeId', 'groupName', 'externalId', 'statusId'],
      };

      try {
        userResp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: params
        });
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

          const contactResp = await api({
            baseURL: commonUtil.getOmsURL(),
            url: 'performFind',
            method: 'POST',
            data: params
          });
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
        selectedUser.facilities = await this.getUserFacilities(selectedUser.partyId);
        selectedUser.securityGroups = await this.getUserSecurityGroups(selectedUser.userLoginId);
        selectedUser.productStores = await this.getUserProductStores(selectedUser.partyId);
        if (selectedUser.userLoginId) {
          let userPreferences = [] as any;
          try {
            const preferencesResp = await api({
              url: 'admin/user/preferences',
              method: 'GET',
              params: {
                userId: selectedUser.userLoginId,
                preferenceKey: 'FAVORITE_PRODUCT_STORE,FAVORITE_SHOPIFY_SHOP',
                preferenceKey_op: 'in',
                pageSize: 2
              }
            }) as any;

            if (!commonUtil.hasError(preferencesResp)) {
              userPreferences = preferencesResp.data;
            } else {
              throw preferencesResp.data;
            }
          } catch (error) {
            logger.error(error)
          }
          if (userPreferences) {
            selectedUser.favoriteProductStorePref = userPreferences.find((preference: any) => preference.preferenceKey === 'FAVORITE_PRODUCT_STORE');
            selectedUser.favoriteShopifyShopPref = userPreferences.find((preference: any) => preference.preferenceKey === 'FAVORITE_SHOPIFY_SHOP');
          }
        }

        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: {
            inputFields: {
              partyId: selectedUser.partyId,
              roleTypeId: 'WAREHOUSE_PICKER'
            },
            viewSize: 1,
            entityName: 'PartyRole',
            fieldList: ['partyId', 'roleTypeId']
          }
        });

        if (!commonUtil.hasError(resp) && resp.data.docs.length) {
          selectedUser.isWarehousePicker = true;
        }
      }

      if (selectedUser['createdByUserLogin']) {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: {
            entityName: "UserLogin",
            inputFields: {
              userLoginId: selectedUser['createdByUserLogin']
            },
            viewSize: 1,
            fieldList: ['partyId'],
            distinct: 'Y',
            noConditionFind: 'Y'
          }
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
    async fetchFilteredUsers(payload: { pageIndex: number; pageSize: number }) {
      if (payload.pageIndex === 0) emitter.emit("presentLoader");

      const params = {
        pageIndex: payload.pageIndex,
        pageSize: payload.pageSize
      } as any;

      if (this.query.queryString) params.keyword = this.query.queryString
      if (this.query.userGroupId) params.userGroupId = this.query.userGroupId
      if (this.query.status) {
        params.disabled = this.query.status === "Y" ? "N" : "Y";
      }

      let users = JSON.parse(JSON.stringify(this.users.list));
      let total = this.users.total;

      try {
        const resp = await api({
          url: "admin/users",
          method: "get",
          params
        }) as any;

        if (!commonUtil.hasError(resp)) {
          // The logged-in user is shown pinned separately at the top of the page, so exclude them from the general list.
          const fetchedUsers = this.query.queryString
            ? resp.data.users
            : resp.data.users.filter((user: any) => user.userId !== this.current.userId);

          users = payload.pageIndex > 0 ? users.concat(fetchedUsers) : fetchedUsers;
          total = resp.data.usersCount;
        } else {
          throw resp.data;
        }
      } catch (error) {
        if (payload.pageIndex === 0) {
          users = [];
          total = 0;
        }
        logger.error(error);
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
    async setFavoriteProductStore(payload: { userId: string; productStoreId: string }) {
      try {
        const params = {
          userId: payload.userId,
          preferenceKey: 'FAVORITE_PRODUCT_STORE',
          preferenceValue: payload.productStoreId
        };
        const resp = await api({
          url: "admin/user/preferences",
          method: "put",
          data: params
        });
        if (!commonUtil.hasError(resp)) {
          this.selectedUser = { ...this.selectedUser, favoriteProductStorePref: params };
          await this.setFavoriteShopifyShop({ userId: payload.userId, shopId: '' });
          return Promise.resolve(resp.data);
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
        return Promise.reject(error);
      }
    },
    async setFavoriteShopifyShop(payload: { userId: string; shopId: string }) {
      try {
        const params = {
          userId: payload.userId,
          preferenceKey: 'FAVORITE_SHOPIFY_SHOP',
          preferenceValue: payload.shopId
        };
        const resp = await api({
          url: "admin/user/preferences",
          method: "put",
          data: params
        });
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
  persist: true
})
