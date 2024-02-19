<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Add permissions to", { groupName: currentGroup.groupName }) }}</ion-title>
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
          <ion-button fill="solid" color="primary" @click="openPermissions()" >
            <ion-icon slot="start" :icon="checkmarkDoneOutline" />
            {{ translate("Finish setup") }}
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
import { mapGetters } from 'vuex';

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
  computed: {
    ...mapGetters({
      currentGroup: "permission/getCurrentGroup"
    })
  },
  methods: {
    openPermissions() {
      this.router.push('tabs/permissions')
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