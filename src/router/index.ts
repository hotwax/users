import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import UserDetails from '@/views/UserDetails.vue'
import { DxpLogin, useAuthStore } from '@hotwax/dxp-components';
import { loader } from '@/utils/user';
import store from '@/store'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'
import { hasPermission } from '@/authorization';
import Tabs from '@/components/Tabs.vue'
import CreateUser from '@/views/CreateUser.vue'
import UserConfirmation from '@/views/UserConfirmation.vue'
import UserQuickSetup from '@/views/UserQuickSetup.vue'
import CreateSecurityGroup from '@/views/CreateSecurityGroup.vue';
import AddPermissions from '@/views/AddPermissions.vue';

declare module 'vue-router' {
  interface RouteMeta {
    permissionId?: string;
  }
}

const authGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated || !store.getters['user/isAuthenticated']) {
    await loader.present('Authenticating')
    // TODO use authenticate() when support is there
    const redirectUrl = window.location.origin + '/login'
    window.location.href = `${process.env.VUE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`
    loader.dismiss()
  }
  next()
};

const loginGuard = (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated && !to.query?.token && !to.query?.oms) {
    next('/')
  }
  next();
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/users'
  },
  {
    path: '/login',
    name: 'DxpLogin',
    component: DxpLogin,
    beforeEnter: loginGuard
  },
  {
    path: '/tabs',
    component: Tabs,
    children: [
      {
        path: 'users',
        component: () => import('@/views/Users.vue'),
      },{
        path: 'settings',
        component: () => import('@/views/Settings.vue')
      },{
        path: 'permissions',
        component: () => import('@/views/Permissions.vue')
      },
    ],
    beforeEnter: authGuard,
  },
  {
    path: '/user-details/:partyId',
    name: 'UserDetails',
    component: UserDetails,
    beforeEnter: authGuard,
    props: true
  },
  {
    path: '/create-user',
    name: 'CreateUser',
    component: CreateUser,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_USER_CREATE"
    }
  },
  {
    path: '/user-confirmation/:partyId',
    name: 'UserConfirmation',
    component: UserConfirmation,
    beforeEnter: authGuard,
    props: true,
    meta: {
      permissionId: "APP_USER_CREATE"
    }
  },
  {
    path: '/user-quick-setup/:partyId',
    name: 'UserQuickSetup',
    component: UserQuickSetup,
    beforeEnter: authGuard,
    props: true,
    meta: {
      permissionId: "APP_USER_CREATE"
    }
  },
  {
    path: '/create-security-group',
    name: 'CreateSecurityGroup',
    component: CreateSecurityGroup,
    beforeEnter: authGuard
  },
  {
    path: '/add-permissions',
    name: 'AddPermissions',
    component: AddPermissions,
    beforeEnter: authGuard
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  if (to.meta.permissionId && !hasPermission(to.meta.permissionId)) {
    let redirectToPath = from.path;
    // If the user has navigated from Login page or if it is page load, redirect user to settings page without showing any toast
    if (redirectToPath == "/login" || redirectToPath == "/") redirectToPath = "/settings";
    else {
      showToast(translate('You do not have permission to access this page'));
    }
    return {
      path: redirectToPath,
    }
  }
})

export default router