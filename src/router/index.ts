import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import UserDetails from '@/views/UserDetails.vue'
import { useUserStore } from '@/store/user'
import { commonUtil, translate, useAuth, Login } from '@common'
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
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value) {
    if (!commonUtil.isAppEmbedded()) next('/login')
    else next('/shopify-login')
  } else {
    next()
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: () => {
      if (useUserStore().hasPermission('USERS_LIST_VIEW')) {
        return '/tabs/users';
      }
      return '/tabs/me';
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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
          const user = useUserStore().getUserProfile || {};
          return { partyId: user.partyId };
        }
      },{
        path: 'permissions',
        component: () => import('@/views/Permissions.vue'),
        meta: {
          permissionId: "SECURITY_VIEW OR SECURITY_ADMIN"
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
      permissionId: "SECURITY_CREATE OR SECURITY_ADMIN"
    }
  },
  {
    path: '/user-confirmation/:partyId',
    name: 'UserConfirmation',
    component: UserConfirmation,
    beforeEnter: authGuard,
    props: true,
    meta: {
      permissionId: "SECURITY_CREATE OR SECURITY_ADMIN"
    }
  },
  {
    path: '/user-quick-setup/:partyId',
    name: 'UserQuickSetup',
    component: UserQuickSetup,
    beforeEnter: authGuard,
    props: true,
    meta: {
      permissionId: "SECURITY_CREATE OR SECURITY_ADMIN"
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
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  const permissionId = to.meta.permissionId;
  if (permissionId && !useUserStore().hasPermission(permissionId)) {
    commonUtil.showToast(translate('The requested page was not available to your user. Please contact your administrator to update your permissions.'));
    if (from.path === '/login' || from.path === '/') {
      return { path: '/tabs/settings' };
    }
    return { path: from.path };
  }
})

export default router
