<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <div class="permission-toolbar-content">
          <ion-title>{{ translate("Manage authorization") }}</ion-title>
          <ion-segment :value="viewMode" @ionChange="updateViewMode($event)">
            <ion-segment-button value="permissions">
              <ion-label>{{ translate("Permissions") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="authorizations">
              <ion-label>{{ translate("Authorizations") }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="manage-authorization">
        <aside>
          <h1>{{ translate("User Groups") }}</h1>

          <ion-list>
            <ion-item v-for="group in userGroups" :key="group.userGroupId" button detail @click="selectGroup(group.userGroupId)">
              <ion-label :color="group.userGroupId === currentUserGroupId ? 'primary' : ''">
                <p class="overline">{{ group.userGroupId }}</p>
                {{ group.description || group.userGroupId }}
              </ion-label>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="currentUserGroupId">
          <div class="section-header">
            <ion-item lines="none">
              <ion-icon :icon="keyOutline" slot="start" />
              <ion-label>
                <ion-note class="overline">{{ currentUserGroup?.userGroupId }}</ion-note>
                <h1>{{ currentUserGroup?.description || currentUserGroup?.userGroupId }}</h1>
                <p v-if="currentUserGroup?.groupTypeEnumId">{{ getUserGroupTypeDescription(currentUserGroup.groupTypeEnumId) }}</p>
              </ion-label>
              <ion-button slot="end" fill="outline" :disabled="!userStore.hasPermission('SECURITY_UPDATE OR SECURITY_ADMIN')" @click="editUserGroup()">{{ translate("Edit") }}</ion-button>
            </ion-item>
          </div>
          <hr />

          <template v-if="viewMode === 'permissions'">
            <ion-searchbar :placeholder="translate('Search permissions')" v-model="query" />

            <template v-if="filteredUserPermissions.length">
              <section>
                <ion-card v-for="permission in filteredUserPermissions" :key="permission.userPermissionId" button @click="togglePermission(permission)">
                  <ion-card-header>
                    <div>
                      <ion-card-title>{{ permission.userPermissionId }}</ion-card-title>
                      <p>{{ permission.description }}</p>
                    </div>
                    <ion-spinner v-if="updatingPermissionIds[permission.userPermissionId]" name="crescent" data-spinner-size="medium" />
                    <ion-checkbox
                      v-else
                      :disabled="permission.isChecked ? !userStore.hasPermission('SECURITY_UPDATE OR SECURITY_ADMIN') : !userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')"
                      :checked="permission.isChecked"
                    />
                  </ion-card-header>
                </ion-card>
              </section>
            </template>
            <div v-else class="empty-state">
              <p>{{ translate("No record found") }}</p>
            </div>
          </template>

          <template v-else>
            <div class="section-header">
              <h2>{{ translate("Authorizations") }}</h2>
              <ion-button :disabled="!userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')" @click="openAddAuthorization()">
                <ion-icon slot="start" :icon="addOutline" />
                {{ translate("Add") }}
              </ion-button>
            </div>

            <section v-if="groupAuthorizations.length">
              <ArtifactAuthzCard
                v-for="authorization in groupAuthorizations"
                :key="authorization.artifactAuthzId"
                :authorization="authorization"
                :artifact-group-description="getArtifactGroupDescription(authorization.artifactGroupId)"
                :authz-type-description="getAuthzTypeDescription(authorization.authzTypeEnumId)"
                :authz-action-description="getAuthzActionDescription(authorization.authzActionEnumId)"
                :disabled="!userStore.hasPermission('SECURITY_UPDATE OR SECURITY_ADMIN')"
                @edit="openEditAuthorization"
                @remove="confirmRemoveAuthorization"
              />
            </section>
            <div v-else class="empty-state">
              <p>{{ translate("No record found") }}</p>
            </div>
          </template>
        </main>

        <main v-else class="empty-state">
          <p>{{ translate("Select a user group to view its details") }}</p>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
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
  IonSpinner,
  IonTitle,
  IonToolbar,
  alertController,
  modalController
} from '@ionic/vue';
import { addOutline, keyOutline } from 'ionicons/icons';
import { DateTime } from 'luxon';
import { commonUtil, logger, translate } from '@common';
import { useRoute } from 'vue-router';
import router from '@/router';
import ArtifactAuthzCard from '@/components/ArtifactAuthzCard.vue';
import ArtifactAuthzModal from '@/components/ArtifactAuthzModal.vue';
import EditUserGroupModal from '@/components/EditUserGroupModal.vue';
import { useAuthorizationStore } from '@/store/authorization';
import { useUtilStore } from '@/store/util';
import { useUserStore } from '@/store/user';

const route = useRoute();
const authorizationStore = useAuthorizationStore();
const utilStore = useUtilStore();
const userStore = useUserStore();

const currentUserGroupId = ref('');
const query = ref('');
const viewMode = ref<'permissions' | 'authorizations'>('permissions');
const updatingPermissionIds = ref<Record<string, boolean>>({});

const userGroups = computed(() => utilStore.getUserGroups);
const currentUserGroup = computed(() => userGroups.value.find((group: any) => group.userGroupId === currentUserGroupId.value));
const userPermissions = computed(() => authorizationStore.getUserPermissions);
const artifactGroups = computed(() => authorizationStore.getArtifactGroups);
const authzTypeEnums = computed(() => authorizationStore.getAuthzTypeEnums);
const authzActionEnums = computed(() => authorizationStore.getAuthzActionEnums);
const userGroupTypeEnums = computed(() => authorizationStore.getUserGroupTypeEnums);
const groupPermissions = computed(() => authorizationStore.getGroupPermissions(currentUserGroupId.value));
const groupAuthorizations = computed(() => authorizationStore.getGroupAuthorizations(currentUserGroupId.value));

const filteredUserPermissions = computed(() => {
  const queryString = query.value.trim().toLowerCase();

  return Object.values(userPermissions.value)
    .filter((permission: any) => !queryString
      || permission.userPermissionId.toLowerCase().includes(queryString)
      || (permission.description && permission.description.toLowerCase().includes(queryString)))
    .map((permission: any) => ({
      ...permission,
      isChecked: !!groupPermissions.value[permission.userPermissionId]
    }));
});

const getArtifactGroupDescription = (artifactGroupId: string) => {
  return artifactGroups.value.find((artifactGroup: any) => artifactGroup.artifactGroupId === artifactGroupId)?.description || artifactGroupId;
};

const getAuthzTypeDescription = (authzTypeEnumId: string) => {
  return authzTypeEnums.value.find((authzType: any) => authzType.enumId === authzTypeEnumId)?.description || authzTypeEnumId;
};

const getAuthzActionDescription = (authzActionEnumId: string) => {
  return authzActionEnums.value.find((authzAction: any) => authzAction.enumId === authzActionEnumId)?.description || authzActionEnumId;
};

const getUserGroupTypeDescription = (groupTypeEnumId: string) => {
  return userGroupTypeEnums.value.find((groupType: any) => groupType.enumId === groupTypeEnumId)?.description || groupTypeEnumId;
};

const getViewModeFromRoute = () => (route.query.view === 'authorizations' ? 'authorizations' : 'permissions');

const loadSegmentData = async () => {
  if (!currentUserGroupId.value) return;

  if (viewMode.value === 'permissions') {
    await authorizationStore.fetchUserGroupPermissions(currentUserGroupId.value);
  } else {
    await authorizationStore.fetchArtifactAuthorizations(currentUserGroupId.value);
  }
};

onMounted(async () => {
  viewMode.value = getViewModeFromRoute();
  await Promise.all([
    utilStore.fetchUserGroups(),
    authorizationStore.fetchUserPermissions(),
    authorizationStore.fetchArtifactGroups(),
    authorizationStore.fetchAuthzEnums(),
    authorizationStore.fetchUserGroupTypeEnums()
  ]);
});

watch(() => route.query.view, async () => {
  const nextViewMode = getViewModeFromRoute();
  if (viewMode.value === nextViewMode) return;

  viewMode.value = nextViewMode;
  await loadSegmentData();
});

const selectGroup = async (userGroupId: string) => {
  currentUserGroupId.value = userGroupId;
  await loadSegmentData();
};

const updateViewMode = async (event: CustomEvent) => {
  viewMode.value = event.detail.value === 'authorizations' ? 'authorizations' : 'permissions';
  const updatedQuery = { ...route.query } as any;
  if (viewMode.value === 'authorizations') {
    updatedQuery.view = 'authorizations';
  } else {
    delete updatedQuery.view;
  }

  await router.replace({
    path: '/tabs/manage-authorization',
    query: updatedQuery
  });

  await loadSegmentData();
};

const togglePermission = async (permission: any) => {
  updatingPermissionIds.value[permission.userPermissionId] = true;

  try {
    let resp;
    if (permission.isChecked) {
      const fromDate = groupPermissions.value[permission.userPermissionId].fromDate;
      resp = await authorizationStore.removeUserGroupPermission({
        userGroupId: currentUserGroupId.value,
        userPermissionId: permission.userPermissionId,
        fromDate,
        thruDate: DateTime.now().toMillis()
      });
    } else {
      resp = await authorizationStore.addUserGroupPermission({
        userGroupId: currentUserGroupId.value,
        userPermissionId: permission.userPermissionId,
        fromDate: DateTime.now().toMillis()
      });
    }

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("User group permission association successfully updated."));
      await authorizationStore.fetchUserGroupPermissions(currentUserGroupId.value);
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate("Failed to update user group permission association."));
    logger.error(error);
  }

  updatingPermissionIds.value[permission.userPermissionId] = false;
};

const editUserGroup = async () => {
  const editUserGroupModal = await modalController.create({
    component: EditUserGroupModal,
    componentProps: { userGroup: currentUserGroup.value }
  });

  return editUserGroupModal.present();
};

const openAddAuthorization = async () => {
  const authorizationModal = await modalController.create({
    component: ArtifactAuthzModal,
    componentProps: { userGroupId: currentUserGroupId.value }
  });

  authorizationModal.present();
  const result = await authorizationModal.onDidDismiss();
  if (result.role === 'save') {
    await authorizationStore.fetchArtifactAuthorizations(currentUserGroupId.value);
  }
};

const openEditAuthorization = async (authorization: any) => {
  const authorizationModal = await modalController.create({
    component: ArtifactAuthzModal,
    componentProps: { userGroupId: currentUserGroupId.value, authorization }
  });

  authorizationModal.present();
  const result = await authorizationModal.onDidDismiss();
  if (result.role === 'save') {
    await authorizationStore.fetchArtifactAuthorizations(currentUserGroupId.value);
  }
};

const removeAuthorization = async (authorization: any) => {
  try {
    const resp = await authorizationStore.deleteArtifactAuthz({
      userGroupId: currentUserGroupId.value,
      artifactAuthzId: authorization.artifactAuthzId
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Authorization removed successfully."));
      await authorizationStore.fetchArtifactAuthorizations(currentUserGroupId.value);
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate("Failed to remove authorization."));
    logger.error(error);
  }
};

const confirmRemoveAuthorization = async (authorization: any) => {
  const alert = await alertController.create({
    header: translate("Remove authorization"),
    message: translate("Are you sure you want to remove this authorization?"),
    buttons: [
      { text: translate("No") },
      { text: translate("Yes"), handler: async () => { await removeAuthorization(authorization); } }
    ]
  });

  return alert.present();
};
</script>

<style scoped>
.manage-authorization {
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

section {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

ion-card-header {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

ion-card-header > ion-checkbox {
  flex-shrink: 0;
}

.empty-state {
  padding: 16px;
  text-align: center;
}

@media screen and (max-width: 800px) {
  .manage-authorization,
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
}
</style>
