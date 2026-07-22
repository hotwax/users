import { defineStore } from 'pinia'
import { api, commonUtil, translate, logger } from '@common';

export interface UtilState {
  roles: any[];
  productStores: any[];
  securityGroups: any[];
  classificationSecurityGroups: any[];
  userGroups: any[];
  facilities: any[];
  shopifyShops: any[];
  organizationPartyId: string;
}

export const useUtilStore = defineStore('util', {
  state: (): UtilState => ({
    roles: [],
    productStores: [],
    securityGroups: [],
    classificationSecurityGroups: [],
    userGroups: [],
    facilities: [],
    shopifyShops: [],
    organizationPartyId: ''
  }),
  getters: {
    getRoles: (state): any[] => state.roles,
    getProductStores: (state): any[] => state.productStores,
    getRoleTypeDesc: (state) => (roleTypeId: string): string | undefined => {
      return state.roles.find((role: any) => role.roleTypeId === roleTypeId)?.description;
    },
    getSecurityGroups: (state): any[] => state.securityGroups,
    getClassificationSecurityGroups: (state): any[] => state.classificationSecurityGroups,
    getUserGroups: (state): any[] => state.userGroups,
    getFacilities: (state): any[] => state.facilities,
    getShopifyShops: (state): any[] => state.shopifyShops,
    getOrganizationPartyId: (state): string => state.organizationPartyId
  },
  actions: {
    async fetchRoles() {
      if (this.roles.length) {
        return;
      }

      let roles = [];
      try {
        const resp = await api({
          url: 'admin/roleTypes',
          method: 'get',
          params: { pageSize: 500 },
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          roles = (resp.data || []).filter((role: any) => role.parentTypeId === 'APPLICATION_USER' || role.roleTypeId === 'APPLICATION_USER');
          roles.push({
            roleTypeId: 'none',
            parentTypeId: 'none',
            description: 'None',
          });
        } else {
          throw resp.data;
        }
      } catch (error) {
        commonUtil.showToast(translate('Something went wrong.'));
        logger.error(error);
      }
      this.roles = roles;
    },

    async fetchShopifyShopConfigs() {
      let shopifyShops = [];
      const params = {
        "fieldList": ["shopifyConfigId", "name", "shopId", "productStoreId"],
        "pageSize": 250
      };

      try {
        const resp = await api({
          url: "admin/shopifyShops",
          method: "get",
          params,
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          shopifyShops = resp.data;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.shopifyShops = shopifyShops;
    },

    async fetchSecurityGroups() {
      let securityGroups: any[] = [];

      try {
        const resp = await api({
          url: "admin/groups",
          method: "get",
          params: { pageSize: 500 },
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          securityGroups = Array.from(
            new Map((resp.data || [])
              .filter((group: any) => group.groupTypeEnumId !== 'PRM_CLASS_TYPE')
              .map((group: any) => [group.groupId, group])).values()
          );
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.securityGroups = securityGroups;
    },

    async fetchUserGroups() {
      if (this.userGroups.length) {
        return;
      }

      let userGroups = [];
      try {
        const resp = await api({
          url: "admin/userGroups",
          method: "get",
          cache: true
        }) as any;
        if (!commonUtil.hasError(resp)) {
          userGroups = resp.data;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.userGroups = userGroups;
    },

    async updateUserGroup(payload: { userGroupId: string; description: string }): Promise<any> {
      return api({
        url: `admin/userGroups/${payload.userGroupId}`,
        method: "put",
        data: payload
      });
    },

    updateUserGroupInState(updatedGroup: { userGroupId: string; description: string }) {
      this.userGroups = this.userGroups.map((group: any) => group.userGroupId === updatedGroup.userGroupId ? { ...group, ...updatedGroup } : group);
    },

    async fetchClassificationSecurityGroups() {
      let securityGroups: any[] = [];

      try {
        const resp = await api({
          url: "admin/groups",
          method: "get",
          params: { groupTypeEnumId: 'PRM_CLASS_TYPE', pageSize: 500, orderByField: 'groupName' },
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          securityGroups = Array.from(
            new Map((resp.data || [])
              .filter((group: any) => group.groupId !== 'SGC_HIDDEN')
              .map((group: any) => [group.groupId, group])).values()
          );
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.classificationSecurityGroups = securityGroups;
    },

    async fetchFacilities() {
      let facilities: Array<any> = [];

      try {
        const resp = await api({
          url: "admin/facilities",
          method: "GET",
          params: {
            pageSize: 500,
            facilityTypeId: "VIRTUAL_FACILITY",
            facilityTypeId_not: "Y",
            parentTypeId: "VIRTUAL_FACILITY",
            parentTypeId_not: "Y",
          },
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          facilities = resp.data;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error('Failed to fetch facilities', err);
      }
      this.facilities = facilities;
    },

    async fetchProductStores() {
      let stores = [];
      try {
        const resp = await api({
          url: "admin/productStores",
          method: "GET",
          params: { pageSize: 500 },
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
          stores = resp.data;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error('Failed to fetch product stores', err);
      }
      this.productStores = stores;
    },

    async fetchOrganizationPartyId() {
      let partyId = "";
      
      try {
        const resp = await api({
          url: "admin/organizations",
          method: "get",
          params: {roleTypeId: 'INTERNAL_ORGANIZATIO', pageSize: 1}
        });
        if (!commonUtil.hasError(resp)) {
          partyId = resp.data?.[0]?.partyId;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.organizationPartyId = partyId;
    },

    async updateSecurityGroup(payload: any): Promise<any> {
      const resp = await api({
        url: `admin/groups/${payload.groupId}`,
        method: "put",
        data: payload
      });

      if (!commonUtil.hasError(resp)) {
        this.securityGroups = this.securityGroups.map((securityGroup: any) => {
          if (securityGroup.groupId === payload.groupId) {
            return {
              ...securityGroup,
              groupName: payload.groupName,
              description: payload.description
            };
          }
          return securityGroup;
        });
      }

      return resp;
    },

    clearUtilState() {
      this.facilities = [];
      this.securityGroups = [];
      this.productStores = [];
      this.organizationPartyId = "";
    }
  },
  persist: true
})
