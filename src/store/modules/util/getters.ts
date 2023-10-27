import { GetterTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState';

const getters: GetterTree <UtilState, RootState> = {
    getSecurityGroupOptions (state) {
      return state.securityGroups
    },
}
export default getters;