<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>{{ permission.title }}</ion-card-title>
      <ion-card-subtitle>{{ permission.permissionId }}</ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <p>{{ permission.description }}</p>
    </ion-card-content>

    <ion-list>
      <ion-item-divider color="light">
        <ion-label>{{ translate("Security groups with access") }}</ion-label>
        <ion-note slot="end">{{ activeGroups.length }}</ion-note>
      </ion-item-divider>

      <ion-item button lines="full" @click="$emit('history', permission)">
        <ion-icon :icon="timeOutline" slot="start" />
        <ion-label>{{ translate("View assignment history") }}</ion-label>
      </ion-item>

      <ion-item v-for="group in activeGroups" :key="group.groupId">
        <ion-label>
          {{ group.groupName || group.groupId }}
          <p>{{ group.groupId }}</p>
        </ion-label>
      </ion-item>

      <ion-item v-if="!activeGroups.length" lines="none">
        <ion-label>{{ translate("No security groups assigned") }}</ion-label>
      </ion-item>

      <ion-button fill="outline" expand="block" class="ion-margin" @click="$emit('manage', permission)">
        <ion-icon :icon="peopleOutline" slot="start" />
        {{ translate("Manage security groups") }}
      </ion-button>
    </ion-list>
  </ion-card>
</template>

<script lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonNote
} from '@ionic/vue';
import { defineComponent, PropType } from 'vue';
import { peopleOutline, timeOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import { AppPermissionDefinition } from '@/config/app-permissions';

export default defineComponent({
  name: 'AppPermissionCard',
  components: {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonNote
  },
  props: {
    permission: {
      type: Object as PropType<AppPermissionDefinition>,
      required: true
    },
    activeGroups: {
      type: Array as PropType<any[]>,
      default: () => []
    }
  },
  emits: ['history', 'manage'],
  setup() {
    return {
      peopleOutline,
      timeOutline,
      translate
    }
  }
});
</script>
