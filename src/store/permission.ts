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
        url: `admin/permissions/${payload.permissionId}`,
        method: "post",
        data: { groupId: payload.groupId, fromDate: payload.fromDate }
      });
    },

    async createSecurityGroup(payload: any): Promise<any> {
      return api({
        url: `admin/groups/${payload.groupId}`,
        method: "post",
        data: payload
      });
    },

    async getSecurityGroupUsers(payload: any): Promise<any> {
      return api({
        url: `admin/groups/${payload.inputFields?.securityGroupId}/users`,
        method: "get",
      });
    },

    async removeSecurityPermissionFromSecurityGroup(payload: any): Promise<any> {
      return api({
        url: `admin/permissions/${payload.permissionId}`,
        method: "put",
        data: { groupId: payload.groupId, fromDate: payload.fromDate, thruDate: payload.thruDate }
      });
    },

    async getPagedSecurityGroupPermissions(inputFields: any, options: any = {}): Promise<any[]> {
      const permissions = [] as any[];
      let viewIndex = 0, resp;

      do {
        resp = await api({
          url: "admin/groups",
          method: "get",
          params: {
            pageSize: 250,
            pageIndex: viewIndex,
            ...inputFields,
            ...options
          }
        }) as any;

        if (commonUtil.hasError(resp)) {
          throw resp.data;
        }

        permissions.push(...(resp.data || []));
        viewIndex++;
      } while ((resp.data || []).length >= 250);

      return permissions;
    },

    async getActiveGroupsByPermission(permissionId: string): Promise<any[]> {
      const now = Date.now();
      const groups = await this.getPagedSecurityGroupPermissions({ permissionId });
      return groups.filter((group: any) => {
        const fromDate = group.fromDate ? new Date(group.fromDate).getTime() : 0;
        const thruDate = group.thruDate ? new Date(group.thruDate).getTime() : Number.POSITIVE_INFINITY;
        return fromDate <= now && thruDate > now;
      });
    },

    async getPermissionHistory(permissionId: string): Promise<any[]> {
      const groups = await this.getPagedSecurityGroupPermissions({ permissionId }, { orderByField: "-thruDate" });
      return groups.sort((a: any, b: any) => {
        const aDate = a.thruDate ? new Date(a.thruDate).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.thruDate ? new Date(b.thruDate).getTime() : Number.POSITIVE_INFINITY;
        return bDate - aDate;
      });
    },

    async grantPermissionToGroup(payload: { groupId: string; permissionId: string; fromDate?: number }): Promise<any> {
      return this.addSecurityPermissionToSecurityGroup({
        ...payload,
        fromDate: payload.fromDate || Date.now()
      });
    },

    async removePermissionFromGroup(payload: { groupId: string; permissionId: string; fromDate?: number; thruDate?: number }): Promise<any> {
      return this.removeSecurityPermissionFromSecurityGroup({
        ...payload,
        thruDate: payload.thruDate || Date.now()
      });
    },

    async fetchAllPermissions() {
      const permissions = {} as any;
      let viewIndex = 0, resp;

      try {
        do {
          resp = await api({
            url: "admin/permissions",
            method: "get",
            cache: true,
            params: {
              pageSize: 250,
              pageIndex: viewIndex,
            }
          });

          if (!commonUtil.hasError(resp)) {
            resp.data.map((permission: any) => {
              permissions[permission.permissionId] = permission;
            });
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.length >= 250);
      } catch (error) {
        logger.error(error);
      }

      this.allPermissions = permissions;
    },

    async fetchPermissionsByClassificationGroups() {
      let permissions = [] as any, resp;
      let viewIndex = 0;

      try {
        do {
          resp = await api({
            url: "admin/groups",
            method: "get",
            cache: true,
            params: {
              groupTypeEnumId: "PRM_CLASS_TYPE",
              pageSize: 250,
              pageIndex: viewIndex,
            }
          });

          if (!commonUtil.hasError(resp)) {
            const now = Date.now();
            permissions = permissions.concat((resp.data || []).filter((permission: any) => {
              const fromDate = permission.fromDate ? new Date(permission.fromDate).getTime() : 0;
              const thruDate = permission.thruDate ? new Date(permission.thruDate).getTime() : Number.POSITIVE_INFINITY;
              return fromDate <= now && thruDate > now;
            }));
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.length >= 250);
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

    async fetchPermissionsByGroup(groupId: string) {
      if (this.permissionsByGroup[groupId]) {
        return;
      }

      const permissions = {} as any;
      let viewIndex = 0, resp;

      try {
        do {
          resp = await api({
            url: "admin/groups",
            method: "get",
            params: {
              groupId,
              pageSize: 250,
              pageIndex: viewIndex,
            },
            cache: true
          });

          if (!commonUtil.hasError(resp)) {
            const now = Date.now();
            resp.data.filter((permission: any) => {
              const fromDate = permission.fromDate ? new Date(permission.fromDate).getTime() : 0;
              const thruDate = permission.thruDate ? new Date(permission.thruDate).getTime() : Number.POSITIVE_INFINITY;
              return fromDate <= now && thruDate > now;
            }).map((permission: any) => {
              if (!permissions[permission.permissionId]) {
                permissions[permission.permissionId] = permission;
              }
            });
            viewIndex++;
          } else {
            throw resp.data;
          }
        } while (resp.data.length >= 250);
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
