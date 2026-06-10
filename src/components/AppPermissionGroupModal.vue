<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="close()">
            <ion-icon :icon="closeOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ translate("Select security groups") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-searchbar :placeholder="translate('Search security groups')" v-model="query" />

      <ion-list v-if="filteredSecurityGroups.length">
        <ion-item v-for="securityGroup in filteredSecurityGroups" :key="securityGroup.groupId">
          <ion-checkbox :checked="isSelected(securityGroup.groupId)" @ionChange="toggleSecurityGroup(securityGroup)">
            <ion-label>
              {{ securityGroup.groupName || securityGroup.groupId }}
              <p>{{ securityGroup.groupId }}</p>
            </ion-label>
          </ion-checkbox>
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <p>{{ translate("No security groups found") }}</p>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="save()">
          <ion-icon :icon="saveOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  modalController
} from '@ionic/vue';
import { defineComponent, PropType } from 'vue';
import { closeOutline, saveOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import { AppPermissionDefinition } from '@/config/app-permissions';

export default defineComponent({
  name: 'AppPermissionGroupModal',
  components: {
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSearchbar,
    IonTitle,
    IonToolbar
  },
  props: {
    permission: {
      type: Object as PropType<AppPermissionDefinition>,
      required: true
    },
    securityGroups: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    activeGroups: {
      type: Array as PropType<any[]>,
      default: () => []
    }
  },
  data() {
    return {
      query: '',
      selectedGroups: [] as any[]
    }
  },
  computed: {
    filteredSecurityGroups(): any[] {
      const query = this.query.trim().toLowerCase();
      if (!query) return this.securityGroups;

      return this.securityGroups.filter((securityGroup: any) => {
        return securityGroup.groupId.toLowerCase().includes(query)
          || (securityGroup.groupName && securityGroup.groupName.toLowerCase().includes(query));
      });
    }
  },
  mounted() {
    this.selectedGroups = this.activeGroups.map((group: any) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      fromDate: group.fromDate
    }));
  },
  methods: {
    close() {
      modalController.dismiss(null, 'cancel');
    },
    isSelected(groupId: string) {
      return this.selectedGroups.some((group: any) => group.groupId === groupId);
    },
    save() {
      modalController.dismiss({
        permission: this.permission,
        originalGroups: this.activeGroups,
        selectedGroups: this.selectedGroups
      }, 'save');
    },
    toggleSecurityGroup(securityGroup: any) {
      if (this.isSelected(securityGroup.groupId)) {
        this.selectedGroups = this.selectedGroups.filter((group: any) => group.groupId !== securityGroup.groupId);
        return;
      }

      this.selectedGroups.push({
        groupId: securityGroup.groupId,
        groupName: securityGroup.groupName
      });
    }
  },
  setup() {
    return {
      closeOutline,
      saveOutline,
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
