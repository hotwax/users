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

          <ion-button @click="createGroup()" :disabled="!userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')" fill="clear" expand="block">
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

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
import { addOutline, idCardOutline, openOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { commonUtil, emitter, logger, translate } from '@common';
import { useRoute } from 'vue-router';
import router from '@/router';
import { appPermissionCatalogs, AppPermissionCatalog, AppPermissionDefinition } from '@/config/app-permissions';
import AppPermissionCard from '@/components/AppPermissionCard.vue';
import AppPermissionGroupModal from '@/components/AppPermissionGroupModal.vue';
import AppPermissionHistoryModal from '@/components/AppPermissionHistoryModal.vue';
import EditSecurityGroupModal from '@/components/EditSecurityGroupModal.vue';
import PermissionItems from '@/components/PermissionItems.vue';
import { usePermissionStore } from '@/store/permission';
import { useUtilStore } from '@/store/util';
import { useUserStore } from '@/store/user';

const route = useRoute();
const permissionStore = usePermissionStore();
const utilStore = useUtilStore();
const userStore = useUserStore();

const activeGroupsByPermission = reactive<Record<string, any[]>>({});
const assignableSecurityGroups = ref<any[]>([]);
const query = ref('');
const securityGroupUsers = ref<any>({});
const selectedAppId = ref<string>(appPermissionCatalogs[0]?.appId || '');
const viewMode = ref<'app' | 'group'>('app');

const allPermissions = computed(() => permissionStore.getAllPermissions);
const currentGroup = computed(() => permissionStore.getCurrentGroup);
const permissionsByClassificationGroups = computed(() => permissionStore.getPermissionsByClassificationGroups);
const securityGroups = computed(() => utilStore.getSecurityGroups);

const selectedApp = computed<AppPermissionCatalog | undefined>(() => {
  return appPermissionCatalogs.find((app) => app.appId === selectedAppId.value) || appPermissionCatalogs[0];
});

const matchesPermission = (permission: AppPermissionDefinition, queryString: string) => {
  return permission.permissionId.toLowerCase().includes(queryString)
    || permission.title.toLowerCase().includes(queryString)
    || permission.description.toLowerCase().includes(queryString)
    || permission.category.toLowerCase().includes(queryString);
};

const filteredApps = computed<readonly AppPermissionCatalog[]>(() => {
  const queryString = query.value.trim().toLowerCase();
  if (!queryString) return appPermissionCatalogs;

  return appPermissionCatalogs.filter((app) => {
    return app.appName.toLowerCase().includes(queryString)
      || app.appId.toLowerCase().includes(queryString)
      || app.permissions.some((permission) => matchesPermission(permission, queryString));
  });
});

const filteredPermissions = computed<readonly AppPermissionDefinition[]>(() => {
  if (!selectedApp.value) return [];

  const queryString = query.value.trim().toLowerCase();
  if (!queryString) return selectedApp.value.permissions;

  return selectedApp.value.permissions.filter((permission) => matchesPermission(permission, queryString));
});

const getViewModeFromRoute = () => (route.query.view === 'group' ? 'group' : 'app');

const getUsersCount = async () => {
  if (securityGroupUsers.value[currentGroup.value.groupId]) {
    return;
  }

  try {
    const resp = await permissionStore.getSecurityGroupUsers({
      entityName: "PartyAndUserLoginSecurityGroupDetails",
      noConditionFind: "Y",
      fromDateName: "relationshipFromDate",
      thruDateName: "relationshipThruDate",
      filterByDate: "Y",
      distinct: "Y",
      viewSize: 1,
      viewIndex: 0,
      fieldList: ['partyId', 'securityGroupName'],
      inputFields: {
        securityGroupId: currentGroup.value.groupId,
        roleTypeIdTo: "APPLICATION_USER"
      }
    });

    if (!commonUtil.hasError(resp)) {
      securityGroupUsers.value[currentGroup.value.groupId] = resp.data.count;
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
};

const loadGroupPermissions = async () => {
  await utilStore.fetchSecurityGroups();
  await utilStore.fetchClassificationSecurityGroups();
  if (!Object.keys(allPermissions.value).length) await permissionStore.fetchAllPermissions();
  if (!Object.keys(permissionsByClassificationGroups.value).length) await permissionStore.fetchPermissionsByClassificationGroups();
  if (currentGroup.value?.groupId) {
    await permissionStore.fetchPermissionsByGroup(currentGroup.value.groupId);
    await getUsersCount();
  }
};

const loadActiveGroups = async (permissionId: string) => {
  try {
    activeGroupsByPermission[permissionId] = await permissionStore.getActiveGroupsByPermission(permissionId);
  } catch (error) {
    logger.error(error);
    activeGroupsByPermission[permissionId] = [];
  }
};

const loadActiveGroupsForSelectedApp = async () => {
  if (!selectedApp.value) return;

  await Promise.all(selectedApp.value.permissions.map((permission) => loadActiveGroups(permission.permissionId)));
};

const loadAssignableSecurityGroups = async () => {
  if (assignableSecurityGroups.value.length) return;

  await utilStore.fetchSecurityGroups();
  assignableSecurityGroups.value = securityGroups.value;
};

onMounted(async () => {
  viewMode.value = getViewModeFromRoute();

  if (viewMode.value === 'app') {
    await loadActiveGroupsForSelectedApp();
    return;
  }

  await loadGroupPermissions();
});

watch(() => route.query.view, async () => {
  const nextViewMode = getViewModeFromRoute();
  if (viewMode.value === nextViewMode) return;

  viewMode.value = nextViewMode;
  if (viewMode.value === 'group') {
    await loadGroupPermissions();
  }
});

const createGroup = () => {
  router.push({ path: `/create-security-group/` });
};

const editSecurityGroup = async () => {
  const editSecurityGroupModal = await modalController.create({
    component: EditSecurityGroupModal
  });

  editSecurityGroupModal.present();
};

const openCurrentGroupUsers = async () => {
  userStore.updateQuery({ queryString: '', securityGroup: currentGroup.value.groupId, status: '', hideDisabledUser: true });
  router.push('users');
};

const openHistory = async (permission: AppPermissionDefinition) => {
  let records = [] as any[];

  try {
    records = await permissionStore.getPermissionHistory(permission.permissionId);
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
};

const saveSecurityGroups = async (permission: AppPermissionDefinition, originalGroups: any[], selectedGroups: any[]) => {
  const originalIds = originalGroups.map((group) => group.groupId);
  const selectedIds = selectedGroups.map((group) => group.groupId);
  const groupIdsToCreate = selectedIds.filter((groupId) => !originalIds.includes(groupId));
  const groupIdsToRemove = originalIds.filter((groupId) => !selectedIds.includes(groupId));

  try {
    await Promise.all([
      ...groupIdsToCreate.map((groupId) => permissionStore.grantPermissionToGroup({
        groupId,
        permissionId: permission.permissionId
      })),
      ...groupIdsToRemove.map((groupId) => {
        const originalGroup = originalGroups.find((group) => group.groupId === groupId);
        return permissionStore.removePermissionFromGroup({
          groupId,
          permissionId: permission.permissionId,
          fromDate: originalGroup?.fromDate
        });
      })
    ]);

    commonUtil.showToast(translate("Security group permission association successfully updated."));
    await loadActiveGroups(permission.permissionId);
  } catch (error) {
    logger.error(error);
    commonUtil.showToast(translate("Failed to update security group permission association."));
  }
};

const openManageGroups = async (permission: AppPermissionDefinition) => {
  try {
    await loadAssignableSecurityGroups();
  } catch (error) {
    logger.error(error);
    commonUtil.showToast(translate("Something went wrong."));
    return;
  }

  const groupModal = await modalController.create({
    component: AppPermissionGroupModal,
    componentProps: {
      activeGroups: activeGroupsByPermission[permission.permissionId] || [],
      permission,
      securityGroups: assignableSecurityGroups.value
    }
  });

  groupModal.present();

  const result = await groupModal.onDidDismiss();
  if (result.role !== 'save' || !result.data) return;

  await saveSecurityGroups(result.data.permission, result.data.originalGroups, result.data.selectedGroups);
};

const selectApp = async (appId: string) => {
  selectedAppId.value = appId;
  await loadActiveGroupsForSelectedApp();
};

const updateCurrentGroup = async (group: any) => {
  emitter.emit('presentLoader');
  permissionStore.updateCurrentGroup(group);
  await permissionStore.fetchPermissionsByGroup(currentGroup.value.groupId);
  await permissionStore.checkAssociated();
  await getUsersCount();
  permissionStore.updateQuery({ queryString: '', showSelected: false, classificationSecurityGroupId: '' });
  emitter.emit('dismissLoader');
};

const updateViewMode = async (event: CustomEvent) => {
  viewMode.value = event.detail.value === 'group' ? 'group' : 'app';
  const query = { ...route.query } as any;
  if (viewMode.value === 'group') {
    query.view = 'group';
  } else {
    delete query.view;
  }

  await router.replace({
    path: '/tabs/app-permissions',
    query
  });

  if (viewMode.value === 'group') {
    await loadGroupPermissions();
  } else {
    await loadActiveGroupsForSelectedApp();
  }
};
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
