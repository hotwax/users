<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Add permissions") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon :icon="downloadOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <PermissionItems />
      </main>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="end" >
          <ion-button color="medium" class="ion-margin-end">{{ translate("Add later") }}</ion-button>
          <ion-button fill="solid" color="primary">
            <ion-icon slot="start" :icon="checkmarkDoneOutline" />
            {{ translate("Add permissions") }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import {
  addOutline,
  checkmarkDoneOutline,
  downloadOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import PermissionItems from '@/components/PermissionItems.vue';

export default defineComponent({
  name: 'Permissions',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    // IonItem,
    IonPage,
    IonTitle,
    IonToolbar,
    PermissionItems
  },
  methods: {
    createGroup() {
      this.$router.replace({ path: `/create-security-group/` })
    }
  },
  setup() {
    const router = useRouter();

    return {
      addOutline,
      checkmarkDoneOutline,
      downloadOutline,
      shieldCheckmarkOutline,
      router,
      translate
    }
  }
});
</script>

<style scoped>
@media screen and (min-width: 700px) {
  ion-content > main {
    margin: var(--spacer-lg)
  }
}
</style>