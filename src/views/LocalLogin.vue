<template>
  <ion-page>
    <ion-content>
      <div class="local-login">
        <form class="local-login-form" @submit.prevent="login">
          <div class="local-login-logo">
            <img src="@/assets/images/HWCLogoDarkMode.png" alt="HotWax Commerce" />
          </div>

          <ion-list v-if="errorMessage">
            <ion-item lines="none">
              <ion-icon slot="start" color="warning" :icon="warningOutline" />
              <ion-label>
                {{ translate("Login failed") }}
                <p>{{ errorMessage }}</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-item lines="full">
              <ion-input
                :label="translate('OMS')"
                label-placement="fixed"
                name="instanceUrl"
                v-model="instanceUrl"
                type="text"
                required
              />
            </ion-item>
            <ion-item lines="full">
              <ion-input
                :label="translate('Username')"
                label-placement="fixed"
                name="username"
                v-model="username"
                type="text"
                required
              />
            </ion-item>
            <ion-item lines="none">
              <ion-input
                :label="translate('Password')"
                label-placement="fixed"
                name="password"
                v-model="password"
                type="password"
                required
              />
            </ion-item>
          </ion-list>

          <div class="ion-padding">
            <ion-button expand="block" type="submit" :disabled="isLoggingIn">
              {{ translate("Login") }}
              <ion-spinner v-if="isLoggingIn" slot="end" name="crescent" />
              <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { arrowForwardOutline, warningOutline } from 'ionicons/icons';
import { translate, useAuthStore } from '@hotwax/dxp-components';
import { UserService } from '@/services/UserService';
import store from '@/store';
import { updateInstanceUrl } from '@/adapter';
import { showToast } from '@/utils';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeOmsUrl = (value: string) => value.trim().replace(/\/rest\/s1.*$/, '').replace(/\/api\/?$/, '').replace(/\/+$/, '');

const getExpirationTime = (expirationTime?: string | number) => {
  const parsedExpiration = Number(expirationTime);
  return Number.isFinite(parsedExpiration) && parsedExpiration > Date.now()
    ? parsedExpiration
    : Date.now() + ONE_DAY_IN_MS;
}

export default defineComponent({
  name: 'LocalLogin',
  components: {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner
  },
  data() {
    return {
      arrowForwardOutline,
      warningOutline,
      errorMessage: '',
      instanceUrl: process.env.VUE_APP_LOCAL_MOQUI_URL || store.getters['user/getInstanceUrl'] || 'http://localhost:8080',
      isLoggingIn: false,
      password: process.env.VUE_APP_LOCAL_MOQUI_PASSWORD || '',
      username: process.env.VUE_APP_LOCAL_MOQUI_USERNAME || ''
    }
  },
  mounted() {
    this.syncDxpAuthStore();
    if (store.getters['user/isAuthenticated']) {
      this.$router.replace('/');
    }
  },
  methods: {
    translate(message: string) {
      return translate(message);
    },
    syncDxpAuthStore(token?: string, expirationTime?: string | number, oms?: string) {
      const authStore = useAuthStore();
      const sessionToken = token || store.getters['user/getUserToken'];
      const instanceUrl = oms || store.getters['user/getInstanceUrl'];
      if (!sessionToken || !instanceUrl) return;

      (authStore as any).$patch({
        token: {
          value: sessionToken,
          expiration: getExpirationTime(expirationTime)
        },
        oms: instanceUrl
      });
    },
    async login() {
      if (!this.username.trim() || !this.password || !this.instanceUrl.trim()) {
        showToast(translate('Please fill in the user details'));
        return;
      }

      const oms = normalizeOmsUrl(this.instanceUrl);
      this.errorMessage = '';
      this.isLoggingIn = true;
      updateInstanceUrl(oms);

      try {
        const resp = await UserService.login(this.username.trim(), this.password, oms);
        const token = resp?.data?.token;
        const expirationTime = resp?.data?.expirationTime || resp?.data?.expiresAt;
        if (!token) {
          throw new Error(translate("Login response did not include a token."));
        }

        const redirectPath = await store.dispatch('user/login', {
          token,
          expirationTime,
          oms,
          omsRedirectionUrl: oms
        });
        this.syncDxpAuthStore(token, expirationTime, oms);

        this.$router.replace(typeof redirectPath === 'string' ? redirectPath : '/');
      } catch (error: any) {
        this.errorMessage = error?.response?.data?.errors || error?.message || translate('Something went wrong while login. Please contact administrator');
      } finally {
        this.isLoggingIn = false;
      }
    }
  }
});
</script>

<style scoped>
.local-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
}

.local-login-form {
  width: 100%;
  max-width: 375px;
}

.local-login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.local-login-logo img {
  max-width: 240px;
}
</style>
