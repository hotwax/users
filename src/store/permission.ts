import { defineStore } from 'pinia'
import { api, commonUtil, logger } from '@common';

export interface PermissionState {
  permissionsByClassificationGroups: any;
  query: {
    queryString: string;
    showSelected: boolean;
    classificationSecurityGroupId: string;
  };
  currentGroup: any;
  permissionsByGroup: any;
  allPermissions: any;
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    permissionsByClassificationGroups: {},
    query: {
      queryString: '',
      showSelected: false,
      classificationSecurityGroupId: ''
    },
    currentGroup: {},
    permissionsByGroup: {},
    allPermissions: {}
  }),
  getters: {
    getPermissionsByClassificationGroups: (state): any => state.permissionsByClassificationGroups,
    getFilteredPermissions: (state): any => {
      let groupType = JSON.parse(JSON.stringify(state.permissionsByClassificationGroups));
      const query = state.query;

      if (query.classificationSecurityGroupId) {
        const filteredGroupType = {} as any;
        if (groupType[query.classificationSecurityGroupId]) {
          filteredGroupType[query.classificationSecurityGroupId] = groupType[query.classificationSecurityGroupId];
        }
        groupType = filteredGroupType;
      }

      if (query.showSelected) {
        Object.values(groupType).map((group: any) => {
          groupType[group.groupId] = {
            ...group,
            permissions: group.permissions.filter((permission: any) => permission.isChecked)
          };
        });
      }

      if (query.queryString) {
        Object.values(groupType).map((group: any) => {
          groupType[group.groupId] = {
            ...group,
            permissions: group.permissions.filter((permission: any) => 
              (permission.permissionId.toLowerCase().includes(query.queryString.toLowerCase())) || 
              (permission.description && permission.description.toLowerCase().includes(query.queryString.toLowerCase()))
            )
          };
        });
      }

      // Remove the hidden permissions so to not display them on the UI
      delete groupType["SGC_HIDDEN"];

      return groupType;
    },
    getQuery: (state): any => state.query,
    getCurrentGroup: (state): any => state.currentGroup,
    getCurrentGroupPermissions: (state): any => {
      return state.permissionsByGroup[state.currentGroup?.groupId] 
        ? JSON.parse(JSON.stringify(state.permissionsByGroup[state.currentGroup.groupId])) 
        : {};
    },
    getPermissionsByGroup: (state): any => state.permissionsByGroup,
    getAllPermissions: (state): any => state.allPermissions
  },
  actions: {
    async addSecurityPermissionToSecurityGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/addSecurityPermissionToSecurityGroup",
        method: "post",
        data: payload
      });
    },

    async createSecurityGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/createSecurityGroup",
        method: "post",
        data: payload
      });
    },

    async fetchPermissionsByGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "performFind",
        method: "POST",
        data: payload,
        cache: true
      });
    },

    async getSecurityGroupUsers(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "performFind",
        method: "POST",
        data: payload
      });
    },

    async removeSecurityPermissionFromSecurityGroup(payload: any): Promise<any> {
      return api({
        baseURL: commonUtil.getOmsURL(),
        url: "service/updateSecurityPermissionToSecurityGroup",
        method: "post",
        data: payload
      });
    },

    async fetchAllPermissions() {
      const permissions = {} as any;
      let viewIndex = 0, resp;

      try {
        do {
          resp = await api({
            baseURL: commonUtil.getOmsURL(),
            url: "performFind",
            method: "POST",
            cache: true,
            data: {
              entityName: "SecurityPermission",
              distinct: "Y",
              noConditionFind: "Y",
              fieldList: ["description", "permissionId"],
              viewSize: 250,
              viewIndex: viewIndex,
            }
          });

          if (!commonUtil.hasError(resp) && resp.data.count) {
            resp.data.docs.map((permission: any) => {
              permissions[permission.permissionId] = permission;
            });
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.docs.length >= 250);
      } catch (error) {
        logger.error(error);
      }

      this.allPermissions = permissions;
    },

    async getPermissionsByClassificationGroups() {
      let permissions = [] as any, resp;
      let viewIndex = 0;

      try {
        do {
          resp = await api({
            baseURL: commonUtil.getOmsURL(),
            url: "performFind",
            method: "POST",
            cache: true,
            data: {
              entityName: "SecurityGroupAndPermission",
              distinct: "Y",
              noConditionFind: "Y",
              filterByDate: "Y",
              fieldList: ["description", "permissionId", "groupId", "groupName"],
              viewSize: 250,
              viewIndex: viewIndex,
              inputFields: {
                groupTypeEnumId: "PRM_CLASS_TYPE"
              }
            }
          });

          if (!commonUtil.hasError(resp)) {
            permissions = permissions.concat(resp.data.docs);
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.docs.length >= 250);
      } catch (error) {
        logger.error(error);
      }

      const groupTypes = {} as any;

      permissions.map((permission: any) => {
        if (groupTypes[permission.groupId]) {
          groupTypes[permission.groupId].permissions.push(permission);
        } else {
          groupTypes[permission.groupId] = {
            groupId: permission.groupId,
            groupName: permission.groupName,
            permissions: [permission]
          };
        }
      });

      // Mapping permission description to the description of permission data fetched.
      const allPermissions = this.allPermissions;
      Object.values(groupTypes).map((group: any) => {
        group.permissions.map((permission: any) => {
          permission.description = allPermissions[permission.permissionId]?.description;
        });
      });

      const otherPermissions = JSON.parse(JSON.stringify(this.allPermissions));
      Object.values(groupTypes).map((group: any) => {
        group.permissions.map((permission: any) => {
          delete otherPermissions[permission.permissionId];
        });
      });

      // Others category for permissions not in any internal group.
      groupTypes['OTHERS'] = {
        groupId: 'OTHERS',
        groupName: 'Others',
        permissions: Object.values(otherPermissions)
      };

      this.permissionsByClassificationGroups = groupTypes;
    },

    async getPermissionsByGroup(groupId: string) {
      if (this.permissionsByGroup[groupId]) {
        return;
      }

      const permissions = {} as any;
      let viewIndex = 0, resp;

      try {
        do {
          resp = await this.fetchPermissionsByGroup({
            entityName: "SecurityGroupAndPermission",
            distinct: "Y",
            noConditionFind: "Y",
            filterByDate: "Y",
            viewSize: 250,
            viewIndex: viewIndex,
            inputFields: {
              groupId
            }
          });

          if (!commonUtil.hasError(resp) && resp.data.count) {
            resp.data.docs.map((permission: any) => {
              if (!permissions[permission.permissionId]) {
                permissions[permission.permissionId] = permission;
              }
            });
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.docs.length >= 250);
      } catch (error) {
        logger.error(error);
      }

      this.permissionsByGroup = {
        ...this.permissionsByGroup,
        [groupId]: permissions
      };
    },

    async checkAssociated() {
      const permissionsByClassificationGroups = JSON.parse(JSON.stringify(this.permissionsByClassificationGroups));

      Object.values(permissionsByClassificationGroups).map((group: any) => {
        group.permissions.map((permission: any) => {
          const currentGroupPermissions = this.permissionsByGroup[this.currentGroup.groupId] 
            ? JSON.parse(JSON.stringify(this.permissionsByGroup[this.currentGroup.groupId])) 
            : [];

          if (currentGroupPermissions[permission.permissionId]) {
            permission.isChecked = true;
          } else {
            permission.isChecked = false;
          }
        });
      });

      this.updatePermissionsByClassificationGroups(permissionsByClassificationGroups);
    },

    updateQuery(query: any) {
      this.query = query;
    },

    updateCurrentGroupPermissions(payload: { groupId: string; currentPermissions: any }) {
      this.permissionsByGroup = {
        ...this.permissionsByGroup,
        [payload.groupId]: payload.currentPermissions
      };
    },

    updatePermissionsByClassificationGroups(payload: any) {
      this.permissionsByClassificationGroups = payload;
    },

    updateCurrentGroup(payload: any) {
      this.currentGroup = payload;
    },

    clearPermissionState() {
      this.currentGroup = {};
      this.permissionsByClassificationGroups = {};
      this.permissionsByGroup = {};
      this.query = { queryString: '', showSelected: false, classificationSecurityGroupId: '' };
      this.allPermissions = {};
    }
  }
})
