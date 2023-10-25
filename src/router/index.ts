import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import UserDetails from '@/views/UserDetails.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/user-details/:partyId',
    name: 'UserDetails',
    component: UserDetails,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router