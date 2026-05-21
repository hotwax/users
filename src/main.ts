import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import logger from '@/logger';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';
import '@hotwax/apps-theme';

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import permissionPlugin, { Actions, hasPermission, setPermissions } from '@/authorization';
import permissionRules from '@/authorization/Rules';
import permissionActions from '@/authorization/Actions';

import { dxpComponents } from '@hotwax/dxp-components'
import { login, logout, loader } from '@/utils/user';
import localeMessages from '@/locales';
import { getConfig, initialise, setUserLocale, setUserTimeZone, getAvailableTimeZones } from '@/adapter';
import { useUserStore } from '@/store/user';

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
  .use(IonicVue, {
    mode: 'md',
    innerHTMLTemplatesEnabled: true
  })
  .use(pinia)
  .use(router)
  .use(permissionPlugin, {
    rules: permissionRules,
    actions: permissionActions
  })
  .use(logger, {
    level: process.env.VUE_APP_DEFAULT_LOG_LEVEL
  })
  .use(dxpComponents, {
    Actions,
    appLoginUrl: process.env.VUE_APP_LOGIN_URL as string,
    defaultImgUrl: require("@/assets/images/defaultImage.png"),
    getConfig,
    initialise,
    loader,
    login,
    logout,
    localeMessages,
    setUserLocale,
    setUserTimeZone,
    getAvailableTimeZones,
    hasPermission
  });

setPermissions(useUserStore(pinia).getUserPermissions);

router.isReady().then(() => {
  app.mount('#app');
});
