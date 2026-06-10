<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <div class="permission-toolbar-content">
          <ion-title>{{ translate("Permissions") }}</ion-title>
          <ion-segment :value="viewMode" @ionChange="updateViewMode($event)">
            <ion-segment-button value="app">
              <ion-label>{{ translate("By app") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="group">
              <ion-label>{{ translate("By group") }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="viewMode === 'app'" class="app-permissions">
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

      <div v-else class="app-permissions">
        <aside>
          <h1>{{ translate("Security Groups") }}</h1>

          <ion-list>
            <ion-item v-for="group in securityGroups" :key="group?.groupId" button detail @click="updateCurrentGroup(group)">
              <ion-label :color="group.groupId === currentGroup?.groupId ? 'primary' : ''">
                <p class="overline">{{ group.groupId }}</p>
                {{ group?.groupName || group?.groupId }}
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-button @click="createGroup()" :disabled="!hasPermission(Actions.APP_SECURITY_GROUP_CREATE)" fill="clear" expand="block">
            <ion-icon slot="start" :icon="addOutline" />
            <ion-label>{{ translate("Create security group") }}</ion-label>
          </ion-button>
        </aside>

        <main v-if="currentGroup?.groupId">
          <div class="section-header">
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>
                <ion-note class="overline">{{ currentGroup.groupId }}</ion-note>
                <h1>{{ currentGroup.groupName || currentGroup.groupId }}</h1>
                <p class="ion-text-wrap">{{ currentGroup.description }}</p>
              </ion-label>
              <ion-button slot="end" @click="editSecurityGroup()" fill="outline">{{ translate("Edit") }}</ion-button>
            </ion-item>
            <ion-button v-if="securityGroupUsers[currentGroup.groupId]" fill="clear" color="medium" @click="openCurrentGroupUsers()">
              {{ translate(securityGroupUsers[currentGroup.groupId] > 1 ? "users" : "user", { userCount: securityGroupUsers[currentGroup.groupId] }) }}
              <ion-icon :icon="openOutline" slot="end" />
            </ion-button>
          </div>
          <hr />
          <PermissionItems />
        </main>

        <main v-else class="empty-state">
          <p>{{ translate("Select a security group to view its details") }}</p>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
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
import { addOutline, idCardOutline, openOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import { appPermissionCatalogs, AppPermissionCatalog, AppPermissionDefinition } from '@/config/app-permissions';
import AppPermissionCard from '@/components/AppPermissionCard.vue';
import AppPermissionGroupModal from '@/components/AppPermissionGroupModal.vue';
import AppPermissionHistoryModal from '@/components/AppPermissionHistoryModal.vue';
import EditSecurityGroupModal from '@/components/EditSecurityGroupModal.vue';
import PermissionItems from '@/components/PermissionItems.vue';
import { AppPermissionService } from '@/services/AppPermissionService';
import { PermissionService } from '@/services/PermissionService';
import { showToast } from '@/utils';
import { hasError } from '@/adapter';
import { Actions, hasPermission } from '@/authorization';
import { mapGetters, useStore } from 'vuex';
import { useRouter } from 'vue-router';
import emitter from "@/event-bus";
import logger from '@/logger';

export default defineComponent({
  name: 'AppPermissions',
  components: {
    AppPermissionCard,
    IonButton,
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
    PermissionItems
  },
  data() {
    return {
      activeGroupsByPermission: {} as Record<string, any[]>,
      assignableSecurityGroups: [] as any[],
      query: '',
      securityGroupUsers: {} as any,
      selectedAppId: (appPermissionCatalogs[0]?.appId || '') as string,
      viewMode: 'app'
    }
  },
  computed: {
    ...mapGetters({
      allPermissions: 'permission/getAllPermissions',
      currentGroup: 'permission/getCurrentGroup',
      permissionsByClassificationGroups: 'permission/getPermissionsByClassificationGroups',
      securityGroups: 'util/getSecurityGroups'
    }),
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
  watch: {
    '$route.query.view': {
      async handler() {
        const nextViewMode = this.getViewModeFromRoute();
        if (this.viewMode === nextViewMode) return;

        this.viewMode = nextViewMode;
        if (this.viewMode === 'group') {
          await this.loadGroupPermissions();
        }
      }
    }
  },
  async mounted() {
    this.viewMode = this.getViewModeFromRoute();

    if (this.viewMode === 'app') {
      await this.loadActiveGroupsForSelectedApp();
      return;
    }

    await this.loadGroupPermissions();
  },
  methods: {
    createGroup() {
      this.$router.push({ path: `/create-security-group/` });
    },
    async editSecurityGroup() {
      const editSecurityGroupModal = await modalController.create({
        component: EditSecurityGroupModal
      });

      editSecurityGroupModal.present();
    },
    async getUsersCount() {
      if(this.securityGroupUsers[this.currentGroup.groupId]) {
        return;
      }

      try {
        const resp = await PermissionService.getSecurityGroupUsers({
          entityName: "PartyAndUserLoginSecurityGroupDetails",
          noConditionFind: "Y",
          fromDateName: "relationshipFromDate",
          thruDateName: "relationshipThruDate",
          filterByDate: "Y",
          distinct: "Y",
          viewSize: 1,
          viewIndex: 0,
          fieldList: ['partyId','securityGroupName'],
          inputFields: {
            securityGroupId: this.currentGroup.groupId,
            roleTypeIdTo: "APPLICATION_USER"
          }
        });

        if(!hasError(resp)) {
          this.securityGroupUsers[this.currentGroup.groupId] = resp.data.count;
        } else {
          throw resp.data;
        }
      } catch(err) {
        logger.error(err);
      }
    },
    getViewModeFromRoute() {
      return this.$route.query.view === 'group' ? 'group' : 'app';
    },
    async loadGroupPermissions() {
      await this.store.dispatch('util/getSecurityGroups');
      await this.store.dispatch('util/getClassificationSecurityGroups');
      if(!this.allPermissions.length) await this.store.dispatch('permission/getAllPermissions');
      if(!Object.keys(this.permissionsByClassificationGroups).length) await this.store.dispatch('permission/getPermissionsByClassificationGroups');
      if(this.currentGroup.groupId) {
        await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId);
        await this.getUsersCount();
      }
    },
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
    async openCurrentGroupUsers() {
      await this.store.dispatch('user/updateQuery', {queryString: '', securityGroup: this.currentGroup.groupId, status: '', hideDisabledUser: true});
      this.router.push('users');
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
    },
    async updateCurrentGroup(group: any) {
      emitter.emit('presentLoader');
      await this.store.dispatch('permission/updateCurrentGroup', group);
      await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId);
      await this.store.dispatch('permission/checkAssociated');
      await this.getUsersCount();
      await this.store.dispatch('permission/updateQuery', {queryString: '', showAllSelected: false, classificationSecurityGroupId: ''});
      emitter.emit('dismissLoader');
    },
    async updateViewMode(event: CustomEvent) {
      this.viewMode = event.detail.value === 'group' ? 'group' : 'app';
      const query = { ...this.$route.query } as any;
      if (this.viewMode === 'group') {
        query.view = 'group';
      } else {
        delete query.view;
      }

      await this.router.replace({
        path: '/tabs/app-permissions',
        query
      });

      if (this.viewMode === 'group') {
        await this.loadGroupPermissions();
      } else {
        await this.loadActiveGroupsForSelectedApp();
      }
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      Actions,
      addOutline,
      hasPermission,
      idCardOutline,
      openOutline,
      router,
      shieldCheckmarkOutline,
      store,
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

.permission-toolbar-content {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-inline-end: 16px;
}

.permission-toolbar-content ion-segment {
  max-width: 320px;
  width: 100%;
}

.section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.section-header > ion-item {
  width: 50%;
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

  .permission-toolbar-content {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding-block: 8px;
  }

  .permission-toolbar-content ion-segment {
    max-width: none;
  }

  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .section-header > ion-item {
    width: 100%;
  }
}
</style>
