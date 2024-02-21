<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Add permissions to", { groupName: currentGroup.groupName }) }}</ion-title>
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
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import { checkmarkDoneOutline } from 'ionicons/icons';
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
      this.router.replace('tabs/permissions')
    }
  },
  setup() {
    const router = useRouter();

    return {
      checkmarkDoneOutline,
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