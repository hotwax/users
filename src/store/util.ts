import { defineStore } from 'pinia'
import { api, commonUtil, translate, logger } from '@common';

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
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: 'performFind',
          method: 'POST',
          data: params,
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
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
        commonUtil.showToast(translate('Something went wrong.'));
        logger.error(error);
      }
      this.roles = roles;
    },

    async fetchShopifyShopConfigs() {
      let shopifyShops = [];
      const params = {
        "entityName": "ShopifyShopAndConfig",
        "noConditionFind": "Y",
        "fieldList": ["shopifyConfigId", "name", "shopId", "productStoreId"],
        "viewSize": 250
      };

      try {
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "get",
          params,
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
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
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload,
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
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
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload,
          cache: true
        });
        if (!commonUtil.hasError(resp)) {
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

          const resp = await api({
            baseURL: commonUtil.getOmsURL(),
            url: "performFind",
            method: "POST",
            data: payload,
            cache: true
          });
          if (!commonUtil.hasError(resp) && resp.data?.docs?.length > 0) {
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
      let stores = [];
      try {
        const payload = {
          "entityName": "ProductStore",
          "noConditionFind": "Y",
          "viewSize": 100
        };

        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: payload,
          cache: true
        });
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
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
        const resp = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "POST",
          data: params
        });
        if (!commonUtil.hasError(resp)) {
          partyId = resp.data.docs[0]?.partyId;
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
        baseURL: commonUtil.getOmsURL(),
        url: "service/updateSecurityGroup",
        method: "post",
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
