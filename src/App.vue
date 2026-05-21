<template>
  <IonApp>
    <IonSplitPane content-id="main-content" when="lg">
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </IonSplitPane>
  </IonApp>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { createAnimation, IonApp, IonRouterOutlet, IonSplitPane, loadingController } from '@ionic/vue';
import emitter from "@/event-bus"
import { useUserStore } from '@/store/user'
import { initialise, resetConfig } from '@/adapter'
import { translate } from '@hotwax/dxp-components';

const userStore = useUserStore();

const loader = ref<any>(null);
const maxAge = process.env.VUE_APP_CACHE_MAX_AGE ? parseInt(process.env.VUE_APP_CACHE_MAX_AGE) : 0;

const userToken = computed(() => userStore.getUserToken);
const instanceUrl = computed(() => userStore.getInstanceUrl);

const presentLoader = async (options = { message: '', backdropDismiss: false }) => {
  // When having a custom message remove already existing loader
  if (options.message && loader.value) dismissLoader();

  if (!loader.value) {
    loader.value = await loadingController
      .create({
        message: options.message ? translate(options.message) : (options.backdropDismiss ? translate("Click the backdrop to dismiss.") : translate("Loading...")),
        translucent: true,
        backdropDismiss: options.backdropDismiss || false
      });
  }
  loader.value.present();
};

const dismissLoader = () => {
  if (loader.value) {
    loader.value.dismiss();
    loader.value = null;
  } else {
    // Added this else case as there are some scenarios in which the loader is not created and before that the dismissLoader gets called, resulting in the loader not getting dismissed
    // So checking that when the loader is not found then try dismissing the loader again after 3 secs.
    // The above case appears when changing the security group in permissions page in case when permissions are stored in state for that group.
    // TODO: need to find a more better approach to dismiss the loader in such case
    setTimeout(() => {
      if (loader.value) {
        dismissLoader();
      }
    }, 3000)
  }
};

const playAnimation = () => {
  const aside = document.querySelector('aside') as Element;
  const main = document.querySelector('main') as Element;

  const revealAnimation = createAnimation()
    .addElement(aside)
    .duration(1500)
    .easing('ease')
    .keyframes([
      { offset: 0, flex: '0', opacity: '0' },
      { offset: 0.5, flex: '1', opacity: '0' },
      { offset: 1, flex: '1', opacity: '1' }
    ]);

  const gapAnimation = createAnimation()
    .addElement(main)
    .duration(500)
    .fromTo('gap', '0', 'var(--spacer-2xl)');

  createAnimation()
    .addAnimation([gapAnimation, revealAnimation])
    .play();
};

const unauthorized = async () => {
  // Mark the user as unauthorised, this will help in not making the logout api call in actions
  await userStore.logout({ isUserUnauthorised: true });
  const redirectUrl = window.location.origin + '/login';
  window.location.href = `${process.env.VUE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`;
};

initialise({
  token: userToken.value,
  instanceUrl: instanceUrl.value,
  cacheMaxAge: maxAge,
  events: {
    unauthorised: unauthorized,
    responseError: () => {
      setTimeout(() => dismissLoader(), 100);
    },
    queueTask: (payload: any) => {
      emitter.emit("queueTask", payload);
    }
  }
});

onMounted(async () => {
  loader.value = await loadingController
    .create({
      message: translate("Loading..."),
      translucent: true,
      backdropDismiss: false
    });
  emitter.on('presentLoader', presentLoader);
  emitter.on('dismissLoader', dismissLoader);
  emitter.on('playAnimation', playAnimation);
});

onUnmounted(() => {
  emitter.off('presentLoader', presentLoader);
  emitter.off('dismissLoader', dismissLoader);
  emitter.off('playAnimation', playAnimation);
  resetConfig();
});
</script>
