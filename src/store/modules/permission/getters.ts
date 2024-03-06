import { GetterTree } from 'vuex'
import PermissionState from './PermissionState'
import RootState from '@/store/RootState'

const getters: GetterTree<PermissionState, RootState> = {
  getPermissionsByClassificationGroups(state) {
    return state.permissionsByClassificationGroups
  },
  getFilteredPermissions(state) {
    const groupType = JSON.parse(JSON.stringify(state.permissionsByClassificationGroups))
    const query = state.query

    if(query.showSelected) {
      Object.values(groupType).map((group: any) => {
        groupType[group.groupId] = {
          ...group,
          permissions: group.permissions.filter((permission: any) => permission.isChecked)
        }
      })
    }

    if(query.queryString) {
      Object.values(groupType).map((group: any) => {
        groupType[group.groupId] = {
          ...group,
          permissions: group.permissions.filter((permission: any) => permission.description && permission.description.toLowerCase().includes(query.queryString.toLowerCase()))
        }
      })
    }

    return groupType
  },
  getQuery(state) {
    return state.query
  },
  getCurrentGroup(state) {
    return state.currentGroup
  },
  getCurrentGroupPermissions(state) {
    return state.permissionsByGroup[state.currentGroup.groupId] ? JSON.parse(JSON.stringify(state.permissionsByGroup[state.currentGroup.groupId])) : []
  },
  getPermissionsByGroup(state) {
    return state.permissionsByGroup
  },
  getAllPermissions(state) {
    return state.allPermissions
  },
  getPermissionDescription: (state) => (permissionId: any) => {
    return state.allPermissions[permissionId]?.description ? state.allPermissions[permissionId].description : permissionId
  }
}
export default getters;