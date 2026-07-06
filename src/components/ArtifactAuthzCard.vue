<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>{{ artifactGroupDescription }}</ion-card-title>
      <ion-card-subtitle>{{ authorization.artifactGroupId }}</ion-card-subtitle>
    </ion-card-header>

    <ion-list>
      <ion-item lines="full">
        <ion-label>
          <p class="overline">{{ translate("Authz type") }}</p>
          {{ authzTypeDescription }}
        </ion-label>
      </ion-item>
      <ion-item :lines="authorization.authzServiceName ? 'full' : 'none'">
        <ion-label>
          <p class="overline">{{ translate("Action") }}</p>
          {{ authzActionDescription }}
        </ion-label>
      </ion-item>
      <ion-item v-if="authorization.authzServiceName" lines="none">
        <ion-label class="ion-text-wrap">
          <p class="overline">{{ translate("Service") }}</p>
          {{ authorization.authzServiceName }}
        </ion-label>
      </ion-item>
    </ion-list>

    <div class="card-actions">
      <ion-button fill="outline" color="medium" expand="block" :disabled="disabled" @click="$emit('edit', authorization)">
        <ion-icon :icon="pencilOutline" slot="start" />
        {{ translate("Edit") }}
      </ion-button>
      <ion-button fill="outline" color="medium" expand="block" :disabled="disabled" @click="$emit('remove', authorization)">
        <ion-icon :icon="trashOutline" slot="start" />
        {{ translate("Remove") }}
      </ion-button>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/vue';
import { PropType } from 'vue';
import { pencilOutline, trashOutline } from 'ionicons/icons';
import { translate } from '@common';

defineProps({
  authorization: {
    type: Object as PropType<any>,
    required: true
  },
  artifactGroupDescription: {
    type: String,
    default: ''
  },
  authzTypeDescription: {
    type: String,
    default: ''
  },
  authzActionDescription: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['edit', 'remove']);
</script>

<style scoped>
.card-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}

.card-actions ion-button {
  flex: 1;
  margin: 0;
}
</style>
