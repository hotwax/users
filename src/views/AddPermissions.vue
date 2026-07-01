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

<script setup lang="ts">
import { computed } from 'vue';
import { IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { translate } from '@common';
import { checkmarkDoneOutline } from 'ionicons/icons';
import router from '@/router';
import PermissionItems from '@/components/PermissionItems.vue';
import { usePermissionStore } from '@/store/permission';

const permissionStore = usePermissionStore();

const currentGroup = computed(() => permissionStore.getCurrentGroup);

const openPermissions = () => {
  router.replace('/tabs/app-permissions?view=group');
};
</script>

<style scoped>
@media screen and (min-width: 700px) {
  ion-content > main {
    margin: var(--spacer-lg)
  }
}
</style>