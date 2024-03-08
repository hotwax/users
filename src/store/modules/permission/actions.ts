import { PermissionService } from '@/services/PermissionService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import PermissionState from './PermissionState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'

const actions: ActionTree<PermissionState, RootState> = {
  async getAllPermissions({ commit }) {
    const permissions = {} as any;
    let viewIndex = 0, resp;

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
          resp.data.docs.map((permission: any) => {
            permissions[permission.permissionId] = permission
          })
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

  async getPermissionsByClassificationGroups({ state, commit, dispatch }) {
    let permissions = [] as any, resp;
    let viewIndex = 0;

    try {
      do {
        resp = await PermissionService.getPermissionsByClassificationGroups({
          entityName: "SecurityGroupAndPermission",
          distinct: "Y",
          noConditionFind: "Y",
          fieldList: ["description", "permissionId", "groupId", "groupName"],
          viewSize: 250,
          viewIndex: viewIndex,
          inputFields: {
            groupTypeEnumId: "PRM_CLASS_TYPE",
            groupId: "SGC_HIDDEN",
            groupId_op: "notEqual"
          }
        })

        if(!hasError(resp)) {
          permissions = permissions.concat(resp.data.docs)
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

    // Filtering all the permissions which are not part of any group type.
    const otherPermissions = JSON.parse(JSON.stringify(state.allPermissions))
    Object.values(groupTypes).map((group: any) => {
      group.permissions.map((permission: any) => {
        permission.description = state.allPermissions[permission.permissionId]?.description
        delete otherPermissions[permission.permissionId]
      })
    })

    // Others category for permissions not in any internal group.
    groupTypes['OTHERS'] = {
      groupId: 'OTHERS',
      groupName: 'Other Category',
      permissions: Object.values(otherPermissions)
    }

    commit(types.PERMISSION_BY_CLASSIFICATION_GROUPS_UPDATED, groupTypes)
  },

  async getPermissionsByGroup({ state, commit }, groupId) {
    const permissions = {} as any
    let viewIndex = 0, resp;

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
          resp.data.docs.map((permission: any) => {
            if(!permissions[permission.permissionId]) {
              permissions[permission.permissionId] = permission
            }
          })
          viewIndex++;
        } else {
          throw resp.data
        }
      }
      while (resp.data.docs.length >= 250);
    } catch(error) {
      console.error(error);
    }

    const permissionsByGroup = JSON.parse(JSON.stringify(state.permissionsByGroup))
    permissionsByGroup[groupId] = permissions

    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, permissionsByGroup)
  },

  async checkAssociated({ state, dispatch }) {
    const permissionsByClassificationGroups = JSON.parse(JSON.stringify(state.permissionsByClassificationGroups))

    Object.values(permissionsByClassificationGroups).map((group: any) => {
      group.permissions.map((permission: any) => {
        const currentGroupPermissions = state.permissionsByGroup[state.currentGroup.groupId] ? JSON.parse(JSON.stringify(state.permissionsByGroup[state.currentGroup.groupId])) : []

        if (currentGroupPermissions[permission.permissionId]) {
          permission.isChecked = true
        } else {
          permission.isChecked = false
        }
      })
    })

    dispatch('updatePermissionsByClassificationGroups', permissionsByClassificationGroups)
  },

  updateQuery({ commit }, query) {
    commit(types.PERMISSION_QUERY_UPDATED, { query })
  },

  updateCurrentGroupPermissions({ commit, state }, payload) {
    const permissionsByGroup = JSON.parse(JSON.stringify(state.permissionsByGroup))
    permissionsByGroup[payload.groupId] = payload.currentPermissions

    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, permissionsByGroup)
  },

  updatePermissionsByClassificationGroups({commit}, payload) {
    commit(types.PERMISSION_BY_CLASSIFICATION_GROUPS_UPDATED, payload)
  },

  updateCurrentGroup({ commit }, payload) {
    commit(types.PERMISSION_CURRENT_GROUP_UPDATED, payload)
  },

  clearPermissionState({ commit }) {
    commit(types.PERMISSION_CURRENT_GROUP_UPDATED, {})
    commit(types.PERMISSION_BY_CLASSIFICATION_GROUPS_UPDATED, [])
    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, [])
    commit(types.PERMISSION_QUERY_UPDATED, {query: {queryString: '', showSelected: false}})
    commit(types.PERMISSION_ALL_PERMISSIONS_UPDATED, [])
  }
}

export default actions;