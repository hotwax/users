<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="close()">
            <ion-icon :icon="closeOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ translate("Security group history") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list v-if="records.length">
        <ion-item v-for="record in records" :key="`${record.groupId}-${record.fromDate || ''}-${record.thruDate || ''}`">
          <ion-label>
            {{ record.groupName || record.groupId }}
            <p>{{ record.groupId }}</p>
          </ion-label>
          <ion-note slot="end">
            {{ getDateTime(record.fromDate) }}
            -
            {{ record.thruDate ? getDateTime(record.thruDate) : translate("Current") }}
          </ion-note>
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <p>{{ translate("No history found.") }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  modalController
} from '@ionic/vue';
import { defineComponent, PropType } from 'vue';
import { DateTime } from 'luxon';
import { closeOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';

export default defineComponent({
  name: 'AppPermissionHistoryModal',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar
  },
  props: {
    records: {
      type: Array as PropType<any[]>,
      default: () => []
    }
  },
  methods: {
    close() {
      modalController.dismiss(null, 'cancel');
    },
    getDateTime(time: any) {
      if (!time) return "";
      const millis = typeof time === "string" ? parseInt(time, 10) : time;
      return DateTime.fromMillis(millis).toLocaleString(DateTime.DATETIME_MED);
    }
  },
  setup() {
    return {
      closeOutline,
      translate
    }
  }
});
</script>

<style scoped>
.empty-state {
  padding: 16px;
  text-align: center;
}
</style>
