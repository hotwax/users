import { PermissionService } from '@/services/PermissionService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import PermissionState from './PermissionState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'

const actions: ActionTree<PermissionState, RootState> = {
  async getpermissionsByGroupType({ state, commit }, payload) {
    console.log('type');
    
    let permissions = [] as any, resp;
    let viewIndex = 0;
    try {
      do{
        resp = await PermissionService.getpermissionsByGroupType({
          entityName: "SecurityGroupAndPermission",
          distinct: "Y",
          noConditionFind: "Y",
          // fieldList: ["description", "permissionId"],
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
          // fieldList: ["description", "permissionId"],
          viewSize: 250,
          viewIndex: viewIndex,
          inputFields: {
            groupId
          }
        })
        if (!hasError(resp) && resp.data.count) {
          const permissionIds =  resp.data.docs.map((count: any) => count.permissionId)
          permissions = permissions.concat(permissionIds)
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
    console.log('new', typeof result);
    console.log('res', result);
    
    result[groupId] = permissions    
    console.log('new', typeof result);
    console.log('res', result);

    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, result)
  },

  async updatePermissionsByGroup({ commit }, payload) {
    commit(types.PERMISSION_PERMISSIONS_BY_GROUP_UPDATED, payload )
  },

  updateQuery({ commit }, query) {
    commit(types.PERMISSION_QUERY_UPDATED, { query })
  },

  updateCurrentGroup({ commit }, payload) {
    commit(types.PERMISSION_CURRENT_GROUP_UPDATED, payload)
  },
}

export default actions;