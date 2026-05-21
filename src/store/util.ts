import { defineStore } from 'pinia'
import { hasError } from '@/adapter'
import logger from '@/logger'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'

export interface UtilState {
  roles: any[];
  productStores: any[];
  securityGroups: any[];
  classificationSecurityGroups: any[];
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
    getFacilities: (state): any[] => state.facilities,
    getShopifyShops: (state): any[] => state.shopifyShops,
    getOrganizationPartyId: (state): string => state.organizationPartyId
  },
  actions: {
    async fetchRoles() {
      if (this.roles.length) {
        return;
      }

      const { UtilService } = await import('@/services/UtilService');

      let roles = [];
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
      };

      try {
        const resp = await UtilService.fetchRoles(params);
        if (!hasError(resp)) {
          roles = resp.data.docs;
          roles.push({
            roleTypeId: 'none',
            parentTypeId: 'none',
            description: 'None',
          });
        } else {
          throw resp.data;
        }
      } catch (error) {
        showToast(translate('Something went wrong.'));
        logger.error(error);
      }
      this.roles = roles;
    },

    async getProductStores() {
      const { UtilService } = await import('@/services/UtilService');

      let productStores = [];
      const params = {
        viewSize: 100,
        noConditionFind: 'Y',
        entityName: 'ProductStore',
        fieldList: ['productStoreId', 'storeName']
      };

      try {
        const resp = await UtilService.fetchProductStores(params);
        if (!hasError(resp)) {
          productStores = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (error) {
        showToast(translate('Something went wrong.'));
        logger.error(error);
      }
      this.productStores = productStores;
    },

    async fetchShopifyShopConfigs() {
      const { UtilService } = await import('@/services/UtilService');

      let shopifyShops = [];
      try {
        const resp = await UtilService.getShopifyConfigs();
        if (!hasError(resp)) {
          shopifyShops = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.shopifyShops = shopifyShops;
    },

    async getSecurityGroups() {
      const { UtilService } = await import('@/services/UtilService');

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
      };
      let securityGroups = [];

      try {
        const resp = await UtilService.getSecurityGroups(payload);
        if (!hasError(resp)) {
          securityGroups = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.securityGroups = securityGroups;
    },

    async getClassificationSecurityGroups() {
      const { UtilService } = await import('@/services/UtilService');

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
      };
      let securityGroups = [];

      try {
        const resp = await UtilService.getSecurityGroups(payload);
        if (!hasError(resp)) {
          securityGroups = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.classificationSecurityGroups = securityGroups;
    },

    async fetchFacilities() {
      const { UtilService } = await import('@/services/UtilService');

      let facilities: Array<any> = [];
      let viewIndex = 0;
      let respCount = 0;
      const viewSize = 100;

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
          };

          const resp = await UtilService.fetchFacilities(payload);
          if (!hasError(resp) && resp.data?.docs?.length > 0) {
            facilities = facilities.concat(resp.data.docs);
            respCount = resp.data.docs.length;
            viewIndex++;
          } else {
            throw resp.data;
          }
        } catch (err) {
          logger.error('Failed to fetch facilities', err);
          respCount = 0;
        }
      } while (respCount >= viewSize);
      this.facilities = facilities;
    },

    async fetchProductStores() {
      const { UtilService } = await import('@/services/UtilService');

      let stores = [];
      try {
        const payload = {
          "entityName": "ProductStore",
          "noConditionFind": "Y",
          "viewSize": 100
        };

        const resp = await UtilService.fetchProductStores(payload);
        if (!hasError(resp) && resp.data.count > 0) {
          stores = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error('Failed to fetch product stores', err);
      }
      this.productStores = stores;
    },

    async fetchOrganizationPartyId() {
      const { UtilService } = await import('@/services/UtilService');

      let partyId = "";
      const params = {
        entityName: "PartyRole",
        inputFields: {
          roleTypeId: 'INTERNAL_ORGANIZATIO'
        },
        noConditionFind: 'Y',
        fieldList: ["partyId"],
        viewSize: 1
      };

      try {
        const resp = await UtilService.fetchOrganizationPartyId(params);
        if (!hasError(resp)) {
          partyId = resp.data.docs[0]?.partyId;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.organizationPartyId = partyId;
    },

    updateSecurityGroup(payload: any) {
      this.securityGroups = payload;
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
