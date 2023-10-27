import { GetterTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState';

const getters: GetterTree <UtilState, RootState> = {
  getSecurityGroups(state) {
    return state.securityGroups
  },
  getFacilities(state) {
    return state.facilities
  }
}
export default getters;