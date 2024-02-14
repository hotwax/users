<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Delete security group") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-item>
        <ion-icon :icon="personOutline" slot="start"/>
        <ion-label  class="ion-text-wrap">{{ "There are <groupMembersCount> linked to this group. Please unlink them before deleting the group." }}</ion-label>
      </ion-item>
      <ion-item lines="none">
        <ion-icon :icon="warningOutline" slot="start" />
        <ion-label class="ion-text-wrap">{{ "Users linked with this security group may lose access to the Hotwax Commerce apps they use." }}</ion-label>
      </ion-item>

      <!-- <ion-button class="ion-margin-left" color="warning" fill="outline">
        <ion-icon :icon="personRemoveOutline" slot="start" />
        {{ translate("Remove users") }}
      </ion-button> -->
    </ion-list>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button color="danger">
        <ion-icon :icon="trashOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, personOutline, personRemoveOutline, trashOutline, warningOutline } from "ionicons/icons";
import { useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "DeleteSecurityGroupModal",
  components: {
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      personOutline,
      personRemoveOutline,
      trashOutline,
      warningOutline,
      store,
      translate
    };
  },
});
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>