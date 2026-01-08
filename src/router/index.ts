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
    redirect: () => {
      const user = store.getters['user/getUserProfile'] || {};
      if (hasPermission('USERS_LIST_VIEW')) {
        return '/tabs/users';
      }
      return '/tabs/me';
    },
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
        path: 'me',
        component: () => import('@/views/UserDetails.vue'),
        props: () => {
          const user = store.getters['user/getUserProfile'] || {};
          return { partyId: user.partyId };
        }
      },{
        path: 'permissions',
        component: () => import('@/views/Permissions.vue'),
        meta: {
          permissionId: "APP_PERMISSION_VIEW"
        }
      },
    ],
    beforeEnter: authGuard,
  },
  {
    path: '/user-details/:partyId',
    name: 'UserDetails',
    component: UserDetails,
    beforeEnter: authGuard,
    meta: {
      permissionId: "USERS_LIST_VIEW"
    },
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
  const permissionId = to.meta.permissionId;
  if (permissionId && !hasPermission(permissionId)) {
    showToast(translate('The requested page was not available to your user. Please contact your administrator to update your permissions.'));
    if (from.path === '/login' || from.path === '/') {
      return { path: '/tabs/settings' };
    }
    return { path: from.path };
  }
})

export default router