<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Permissions") }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment value="app">
          <ion-segment-button value="app">
            <ion-label>{{ translate("By app") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="group" @click="openGroupPermissions()">
            <ion-label>{{ translate("By group") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="app-permissions">
        <aside>
          <ion-searchbar :placeholder="translate('Search permissions')" v-model="query" />
          <ion-list>
            <ion-item v-for="app in filteredApps" :key="app.appId" button detail @click="selectApp(app.appId)">
              <ion-label :color="app.appId === selectedAppId ? 'primary' : ''">
                {{ app.appName }}
                <p>{{ app.permissions.length }} {{ translate("Configured permissions") }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="selectedApp">
          <ion-item lines="none">
            <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
            <ion-label>
              <ion-note>{{ selectedApp.appId }}</ion-note>
              <h1>{{ selectedApp.appName }}</h1>
              <p>{{ selectedApp.appDescription }}</p>
            </ion-label>
          </ion-item>

          <ion-list>
            <ion-item>
              <ion-label>{{ translate("Configured permissions") }}</ion-label>
              <ion-note slot="end">{{ selectedApp.permissions.length }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("App access") }}</ion-label>
              <ion-note slot="end">{{ selectedApp.appAccessPermissionIds.join(", ") }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Admin permissions") }}</ion-label>
              <ion-note slot="end">{{ selectedApp.adminPermissionIds.join(", ") }}</ion-note>
            </ion-item>
          </ion-list>

          <section>
            <AppPermissionCard
              v-for="permission in filteredPermissions"
              :key="permission.permissionId"
              :permission="permission"
              :active-groups="activeGroupsByPermission[permission.permissionId] || []"
              @history="openHistory"
              @manage="openManageGroups"
            />
          </section>

          <div v-if="!filteredPermissions.length" class="empty-state">
            <p>{{ translate("No record found") }}</p>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  modalController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import { appPermissionCatalogs, AppPermissionCatalog, AppPermissionDefinition } from '@/config/app-permissions';
import AppPermissionCard from '@/components/AppPermissionCard.vue';
import AppPermissionGroupModal from '@/components/AppPermissionGroupModal.vue';
import AppPermissionHistoryModal from '@/components/AppPermissionHistoryModal.vue';
import { AppPermissionService } from '@/services/AppPermissionService';
import { showToast } from '@/utils';
import logger from '@/logger';

export default defineComponent({
  name: 'AppPermissions',
  components: {
    AppPermissionCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar
  },
  data() {
    return {
      activeGroupsByPermission: {} as Record<string, any[]>,
      assignableSecurityGroups: [] as any[],
      query: '',
      selectedAppId: (appPermissionCatalogs[0]?.appId || '') as string
    }
  },
  computed: {
    filteredApps(): readonly AppPermissionCatalog[] {
      const query = this.query.trim().toLowerCase();
      if (!query) return appPermissionCatalogs;

      return appPermissionCatalogs.filter((app) => {
        return app.appName.toLowerCase().includes(query)
          || app.appId.toLowerCase().includes(query)
          || app.permissions.some((permission) => this.matchesPermission(permission, query));
      });
    },
    filteredPermissions(): readonly AppPermissionDefinition[] {
      if (!this.selectedApp) return [];

      const query = this.query.trim().toLowerCase();
      if (!query) return this.selectedApp.permissions;

      return this.selectedApp.permissions.filter((permission) => this.matchesPermission(permission, query));
    },
    selectedApp(): AppPermissionCatalog | undefined {
      return appPermissionCatalogs.find((app) => app.appId === this.selectedAppId) || appPermissionCatalogs[0];
    }
  },
  async mounted() {
    await this.loadActiveGroupsForSelectedApp();
  },
  methods: {
    matchesPermission(permission: AppPermissionDefinition, query: string) {
      return permission.permissionId.toLowerCase().includes(query)
        || permission.title.toLowerCase().includes(query)
        || permission.description.toLowerCase().includes(query)
        || permission.category.toLowerCase().includes(query);
    },
    async loadActiveGroupsForSelectedApp() {
      if (!this.selectedApp) return;

      await Promise.all(this.selectedApp.permissions.map(async (permission) => {
        await this.loadActiveGroups(permission.permissionId);
      }));
    },
    async loadActiveGroups(permissionId: string) {
      try {
        this.activeGroupsByPermission[permissionId] = await AppPermissionService.getActiveGroupsByPermission(permissionId);
      } catch (error) {
        logger.error(error);
        this.activeGroupsByPermission[permissionId] = [];
      }
    },
    async loadAssignableSecurityGroups() {
      if (this.assignableSecurityGroups.length) return;

      this.assignableSecurityGroups = await AppPermissionService.getAssignableSecurityGroups();
    },
    openGroupPermissions() {
      this.$router.push('/tabs/permissions');
    },
    async openHistory(permission: AppPermissionDefinition) {
      let records = [] as any[];

      try {
        records = await AppPermissionService.getPermissionHistory(permission.permissionId);
      } catch (error) {
        logger.error(error);
      }

      const historyModal = await modalController.create({
        component: AppPermissionHistoryModal,
        componentProps: {
          records
        }
      });

      historyModal.present();
    },
    async openManageGroups(permission: AppPermissionDefinition) {
      try {
        await this.loadAssignableSecurityGroups();
      } catch (error) {
        logger.error(error);
        showToast(translate("Something went wrong."));
        return;
      }

      const groupModal = await modalController.create({
        component: AppPermissionGroupModal,
        componentProps: {
          activeGroups: this.activeGroupsByPermission[permission.permissionId] || [],
          permission,
          securityGroups: this.assignableSecurityGroups
        }
      });

      groupModal.present();

      const result = await groupModal.onDidDismiss();
      if (result.role !== 'save' || !result.data) return;

      await this.saveSecurityGroups(result.data.permission, result.data.originalGroups, result.data.selectedGroups);
    },
    async saveSecurityGroups(permission: AppPermissionDefinition, originalGroups: any[], selectedGroups: any[]) {
      const originalIds = originalGroups.map((group) => group.groupId);
      const selectedIds = selectedGroups.map((group) => group.groupId);
      const groupIdsToCreate = selectedIds.filter((groupId) => !originalIds.includes(groupId));
      const groupIdsToRemove = originalIds.filter((groupId) => !selectedIds.includes(groupId));

      try {
        await Promise.all([
          ...groupIdsToCreate.map((groupId) => AppPermissionService.grantPermissionToGroup({
            groupId,
            permissionId: permission.permissionId
          })),
          ...groupIdsToRemove.map((groupId) => {
            const originalGroup = originalGroups.find((group) => group.groupId === groupId);
            return AppPermissionService.removePermissionFromGroup({
              groupId,
              permissionId: permission.permissionId,
              fromDate: originalGroup?.fromDate
            });
          })
        ]);

        showToast(translate("Security group permission association successfully updated."));
        await this.loadActiveGroups(permission.permissionId);
      } catch (error) {
        logger.error(error);
        showToast(translate("Failed to update security group permission association."));
      }
    },
    async selectApp(appId: string) {
      this.selectedAppId = appId;
      await this.loadActiveGroupsForSelectedApp();
    }
  },
  setup() {
    return {
      shieldCheckmarkOutline,
      translate
    }
  }
});
</script>

<style scoped>
.app-permissions {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(220px, 320px) 1fr;
  padding: 16px;
}

section {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.empty-state {
  padding: 16px;
  text-align: center;
}

@media screen and (max-width: 800px) {
  .app-permissions,
  section {
    grid-template-columns: 1fr;
  }
}
</style>
