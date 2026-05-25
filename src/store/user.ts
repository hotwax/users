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
  oms: any;
  omsRedirectionInfo: any;
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
    oms: "",
    omsRedirectionInfo: {
      url: ''
    }
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
    getBaseUrl: (state): string => commonUtil.getOmsURL() || state.oms || state.instanceUrl,
    getOmsRedirectionInfo: (state): any => state.omsRedirectionInfo?.url ? state.omsRedirectionInfo : { url: state.oms || commonUtil.getOMSInstanceName() },
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
    async fetchUsers(payload: any): Promise<any> {
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
        baseURL: this.getBaseUrl,
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
          let userFavorites = [] as any;
          try {
            const favoritesResp = await api({
              baseURL: commonUtil.getOmsURL(),
              url: 'performFind',
              method: 'POST',
              data: {
                inputFields: {
                  userLoginId: selectedUser.userLoginId,
                  userPrefTypeId: ['FAVORITE_PRODUCT_STORE', 'FAVORITE_SHOPIFY_SHOP'],
                  userPrefTypeId_op: 'in'
                },
                viewSize: 2,
                entityName: 'UserPreference',
                fieldList: ['userPrefTypeId', 'userPrefValue', 'userPrefGroupTypeId', 'userLoginId']
              }
            }) as any;

            if (!commonUtil.hasError(favoritesResp)) {
              userFavorites = favoritesResp.data.docs;
            } else {
              throw favoritesResp.data;
            }
          } catch (error) {
            logger.error(error)
          }
          if (userFavorites) {
            selectedUser.favoriteProductStorePref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_PRODUCT_STORE');
            selectedUser.favoriteShopifyShopPref = userFavorites.find((userFavorite: any) => userFavorite.userPrefTypeId === 'FAVORITE_SHOPIFY_SHOP');
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
    async fetchFilteredUsers(payload: { currentUserPartyId: string; viewIndex: number; viewSize: number }) {
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
      
      try {
        const resp = await this.fetchUsers(params);
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
      try {
        const params = {
          'userPrefLoginId': payload.userLoginId,
          'userPrefTypeId': 'FAVORITE_PRODUCT_STORE',
          'userPrefValue': payload.productStoreId
        };
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "service/setUserPreference",
          method: "post",
          data: params
        });
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
      try {
        const params = {
          'userPrefLoginId': payload.userLoginId,
          'userPrefTypeId': 'FAVORITE_SHOPIFY_SHOP',
          'userPrefValue': payload.shopId
        };
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "service/setUserPreference",
          method: "post",
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
  persist: {
    pick: ['current', 'token', 'instanceUrl', 'permissions', 'omsRedirectionInfo']
  }
})
