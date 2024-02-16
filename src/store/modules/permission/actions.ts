import { PermissionService } from '@/services/PermissionService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import PermissionState from './PermissionState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'

const actions: ActionTree<PermissionState, RootState> = {
  async getAllPermissions({ commit }) {
    let permissions = [] as any, resp;
    let viewIndex = 0;

    try {
      do {
        resp = await PermissionService.getAllPermissions({
          entityName: "SecurityPermission",
          distinct: "Y",
          noConditionFind: "Y",
          fieldList: ["description", "permissionId"],
          viewSize: 250,
          viewIndex: viewIndex,
        })
        if (!hasError(resp) && resp.data.count) {
          permissions = permissions.concat(resp.data.docs)
          viewIndex++;
        } else {
          throw resp.data
        }
      }
      while (resp.data.docs.length >= 250);
    } catch (error) {
      console.error(error);
    }

    commit(types.PERMISSION_ALL_PERMISSIONS_UPDATED, permissions)
  },

  async getpermissionsByGroupType({ state, commit }, payload) {
    let permissions = [] as any, resp;
    let viewIndex = 0;
    try {
      do{
        resp = await PermissionService.getpermissionsByGroupType({
          entityName: "SecurityGroupAndPermission",
          distinct: "Y",
          noConditionFind: "Y",
          fieldList: ["description", "permissionId", "groupId", "groupName"],
          viewSize: 250,
          viewIndex: viewIndex,
          inputFields: {
            groupTypeEnumId_op: "not-empty"
          }
        })
        if(!hasError(resp)) {
          permissions = JSON.parse(JSON.stringify(permissions)).concat(resp.data.docs)
          viewIndex++;
        } else {
          throw resp.data
        }
      }
      while(resp.data.docs.length >= 250);
    } catch(error) {
      console.error(error);
    }

    const groupTypes = {} as any;

    permissions.map((permission: any) => {
      if(groupTypes[permission.groupId]) {
        groupTypes[permission.groupId].permissions.push(permission)
      } else {
        groupTypes[permission.groupId] = {
          groupId: permission.groupId,
          groupName: permission.groupName,
          permissions: [permission]
        }
      }
    })

    let allPermissions = JSON.parse(JSON.stringify(state.allPermissions))
    Object.values(groupTypes).map((group: any) => {
      group.permissions.map((permission: any) => {
        allPermissions = allPermissions.filter((perm: any) => perm.permissionId !== permission.permissionId)
      })
    })
    
    // Others category for permissions not in any internal group.
    groupTypes['OTHERS'] = {
      groupId: 'OTHERS',
      groupName: 'Other Category',
      permissions: allPermissions
    }

    commit(types.PERMISSION_BY_GROUP_TYPE_UPDATED, groupTypes)
  },

  async getPermissionsByGroup({ state, commit }, groupId) {
    let permissions = [] as any, resp;
    let viewIndex = 0;

    if(state.permissionsByGroup[groupId]) {
      return;
    }

    try {
      do {
        resp = await PermissionService.getPermissionsByGroup({
          entityName: "SecurityGroupAndPermission",
          distinct: "Y",
          noConditionFind: "Y",
          filterByDate: "Y",
          viewSize: 250,
          viewIndex: viewIndex,
          inputFields: {
            groupId
          }
        })
        if (!hasError(resp) && resp.data.count) {
          permissions = permissions.concat(resp.data.docs)
          viewIndex++;
        } else {
          throw resp.data
        }
      }
      while (resp.data.docs.length >= 250);
    } catch(error) {
      console.error(error);
    }

    const result = JSON.parse(JSON.stringify(state.permissionsByGroup))
    result[groupId] = permissions

    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, result)
  },

  async updatePermissionsByGroup({ commit }, payload) {
    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, payload )
  },
 
  updateQuery({ commit }, query) {
    commit(types.PERMISSION_QUERY_UPDATED, { query })
  },

  updateCurrentGroupPermissions({ commit, state }, payload) {
    const permissionsByGroup = JSON.parse(JSON.stringify(state.permissionsByGroup))
    const permissions = permissionsByGroup[payload.groupId]

    if(permissions.includes(payload.permissionId)) {
      permissions.remove(payload.permissionId)
    } else {
      permissions.push(payload.permissionId)
    }

    permissionsByGroup[payload.groupId] = permissions
    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, permissionsByGroup)
  },

  updatePermissionsByGroupType({commit}, payload) {
    commit(types.PERMISSION_BY_GROUP_TYPE_UPDATED, payload)
  },

  updateCurrentGroup({ commit }, payload) {
    commit(types.PERMISSION_CURRENT_GROUP_UPDATED, payload)
  },
}

export default actions;