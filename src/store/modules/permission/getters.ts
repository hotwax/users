import { GetterTree } from 'vuex'
import PermissionState from './PermissionState'
import RootState from '@/store/RootState'

const getters: GetterTree<PermissionState, RootState> = {
  getPermissionsByGroupType(state) {
    return state.permissionsByGroupType
  },
  getCurrentPermissionsByGroupType(state) {
    const groupType = JSON.parse(JSON.stringify(state.permissionsByGroupType))
    const filteredData = {} as any
    const query = state.query

    for (const typeId in groupType) {
      const group = groupType[typeId];

      if(state.query.showSelected) {
        filteredData[typeId] = {
          ...group,
          permissions: group.permissions.filter((permission: any) => permission.description && permission.description.toLowerCase().includes(query.queryString.toLowerCase()) && permission.isChecked)
        };
      } else {
        filteredData[typeId] = {
          ...group,
          permissions: group.permissions.filter((permission: any) => permission.description && permission.description.toLowerCase().includes(query.queryString.toLowerCase()))
        };
      }
    }

    return filteredData
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
  }
}
export default getters;