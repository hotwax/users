import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import UserDetails from '@/views/UserDetails.vue'
import { DxpLogin, useAuthStore } from '@hotwax/dxp-components';
import LocalLogin from '@/views/LocalLogin.vue'
import { loader } from '@/utils/user';
import store from '@/store'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'
import { Actions, hasPermission } from '@/authorization';
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

const isLocalMoquiLogin = process.env.VUE_APP_LOCAL_MOQUI_LOGIN === 'true';

const syncLocalAuthStore = (authStore = useAuthStore()) => {
  if (!isLocalMoquiLogin || !store.getters['user/isAuthenticated']) return;

  (authStore as any).$patch({
    token: {
      value: store.getters['user/getUserToken'],
      expiration: Date.now() + 24 * 60 * 60 * 1000
    },
    oms: store.getters['user/getInstanceUrl']
  });
}

const authGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  syncLocalAuthStore(authStore);
  if (!authStore.isAuthenticated || !store.getters['user/isAuthenticated']) {
    if (isLocalMoquiLogin) {
      next('/login');
      return;
    }

    await loader.present('Authenticating')
    // TODO use authenticate() when support is there
    const redirectUrl = window.location.origin + '/login'
    window.location.href = `${process.env.VUE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`
    loader.dismiss()
    return;
  }
  next()
};

const loginGuard = (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  syncLocalAuthStore(authStore);
  if (authStore.isAuthenticated && store.getters['user/isAuthenticated'] && !to.query?.token && !to.query?.oms) {
    next('/')
    return;
  }
  next();
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: () => {
      if (hasPermission(Actions.APP_USERS_LIST_VIEW)) {
        return '/tabs/users';
      }
      return '/tabs/me';
    },
  },
  {
    path: '/login',
    name: 'DxpLogin',
    component: isLocalMoquiLogin ? LocalLogin : DxpLogin,
    beforeEnter: loginGuard
  },
  {
    path: '/tabs',
    component: Tabs,
    children: [
      {
        path: 'users',
        component: () => import('@/views/Users.vue'),
        meta: {
          permissionId: "USERS_LIST_VIEW"
        }
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
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_SECURITY_GROUP_CREATE"
    }
  },
  {
    path: '/add-permissions',
    name: 'AddPermissions',
    component: AddPermissions,
    beforeEnter: authGuard,
    meta: {
      permissionId: "APP_PERMISSION_CREATE"
    }
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
