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
import { translate, emitter } from '@common';
import { useUserStore } from '@/store/user'

const loader = ref<any>(null);

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

onMounted(async () => {
  loader.value = await loadingController
    .create({
      message: translate("Loading..."),
      translucent: true,
      backdropDismiss: false
    });
  emitter.on("presentLoader", (options: any) => presentLoader(options));
  emitter.on('dismissLoader', dismissLoader);
  emitter.on('playAnimation', playAnimation);
});

onUnmounted(() => {
  emitter.off("presentLoader", (options: any) => presentLoader(options));
  emitter.off('dismissLoader', dismissLoader);
  emitter.off('playAnimation', playAnimation);
});
</script>
