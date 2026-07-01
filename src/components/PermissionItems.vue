<template>
  <div class="search-permissions">
    <ion-searchbar :placeholder="translate('Search permissions')" v-model="query.queryString" @ionInput="updateQuery()" />
    <ion-item lines="full">
      <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
      <ion-toggle v-model="query.showSelected" @ionChange="updateQuery()">
        {{ translate("Only selected permissions") }}
      </ion-toggle>
    </ion-item>
    <ion-item lines="full">
      <ion-icon :icon="optionsOutline" slot="start" />
      <ion-select :label="translate('App')" interface="popover" v-model="query.classificationSecurityGroupId" @ionChange="updateQuery()">
        <ion-select-option value="">{{ translate("All") }}</ion-select-option>
        <ion-select-option :value="app.appId" :key="app.appId" v-for="app in appPermissionCatalogs">
          {{ app.appName }}
        </ion-select-option>
        <ion-select-option value="OTHERS">{{ translate("Other permissions") }}</ion-select-option>
      </ion-select>
    </ion-item>
  </div>

  <template v-if="arePermissionsAvailable()">
    <div v-for="group in filteredPermissionGroups" :key="group.groupId">
      <ion-item-divider v-if="group.permissions.length" class="ion-margin-vertical" color="light">
        <ion-label>
          {{ group.groupName || group.groupId }}
        </ion-label>
        <ion-note slot="end">{{ group.permissions.length }}</ion-note>
      </ion-item-divider>

      <section>
        <ion-card v-for="permission in group.permissions" :key="permission.permissionId" button @click="updatePermissionAssociation(permission)">
          <ion-card-header>
            <div>
              <ion-card-title>{{ permission.title || permission.permissionId }}</ion-card-title>
              <ion-card-subtitle>{{ permission.permissionId }}</ion-card-subtitle>
              <p>{{ permission.description }}</p>
            </div>
            <ion-spinner v-if="permission.isStatusUpdating" name="crescent" data-spinner-size="medium" />
            <ion-checkbox v-else :disabled="permission.isChecked ? !userStore.hasPermission('SECURITY_UPDATE OR SECURITY_ADMIN') : !userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')" :checked="permission.isChecked" />
          </ion-card-header>
        </ion-card>
      </section>
    </div>
    <hr/>
  </template>
  <div v-else class="empty-state">
    <p>{{ translate("No record found") }}</p>
  </div>

</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCheckbox, IonIcon, IonItem, IonItemDivider, IonLabel, IonNote, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonToggle } from '@ionic/vue';
import { commonUtil, translate, logger } from '@common';
import { optionsOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { DateTime } from 'luxon';
import { usePermissionStore } from '@/store/permission';
import { useUserStore } from '@/store/user';
import { appPermissionCatalogs, AppPermissionCatalog, AppPermissionDefinition } from '@/config/app-permissions';

const permissionStore = usePermissionStore();
const userStore = useUserStore();

const updatingPermissionIds = reactive<Record<string, boolean>>({});

const query = computed(() => permissionStore.getQuery);
const currentGroupPermissions = computed(() => permissionStore.getCurrentGroupPermissions);
const currentGroup = computed(() => permissionStore.getCurrentGroup);
const permissionsByClassificationGroups = computed(() => permissionStore.getPermissionsByClassificationGroups);
const allPermissions = computed(() => permissionStore.getAllPermissions);

const getHiddenPermissionIds = () => {
  return new Set((permissionsByClassificationGroups.value?.SGC_HIDDEN?.permissions || []).map((permission: any) => permission.permissionId));
};

const getPermissionItem = (permissionId: string, definition?: AppPermissionDefinition) => {
  const serverPermission = allPermissions.value?.[permissionId] || {};

  return {
    ...serverPermission,
    ...definition,
    permissionId,
    title: definition?.title || serverPermission.permissionId,
    description: definition?.description || serverPermission.description,
    isChecked: !!currentGroupPermissions.value[permissionId],
    isStatusUpdating: !!updatingPermissionIds[permissionId]
  };
};

const matchesQuery = (permission: any, group: any) => {
  const queryString = query.value.queryString?.toLowerCase();
  if (!queryString) return true;

  return permission.permissionId?.toLowerCase().includes(queryString)
    || permission.title?.toLowerCase().includes(queryString)
    || permission.description?.toLowerCase().includes(queryString)
    || permission.category?.toLowerCase().includes(queryString)
    || group.groupName?.toLowerCase().includes(queryString);
};

const matchesSelectedFilter = (permission: any) => {
  return !query.value.showSelected || permission.isChecked;
};

const appPermissionGroups = computed<any[]>(() => {
  const catalogPermissionIds = new Set<string>();
  const hiddenPermissionIds = getHiddenPermissionIds();
  const catalogs = appPermissionCatalogs as readonly AppPermissionCatalog[];

  const groups = catalogs.map((app: AppPermissionCatalog): any => {
    const permissions = [...app.permissions]
      .filter((permission: AppPermissionDefinition) => !hiddenPermissionIds.has(permission.permissionId))
      .map((permission: AppPermissionDefinition) => {
        catalogPermissionIds.add(permission.permissionId);
        return getPermissionItem(permission.permissionId, permission);
      });

    return {
      groupId: app.appId,
      groupName: app.appName,
      permissions
    };
  });

  const otherPermissions = Object.values(allPermissions.value || {})
    .filter((permission: any) => permission.permissionId && !catalogPermissionIds.has(permission.permissionId) && !hiddenPermissionIds.has(permission.permissionId))
    .map((permission: any) => getPermissionItem(permission.permissionId));

  groups.push({
    groupId: 'OTHERS',
    groupName: translate('Other permissions'),
    permissions: otherPermissions
  });

  return groups;
});

const filteredPermissionGroups = computed<any[]>(() => {
  const selectedGroupId = query.value.classificationSecurityGroupId;
  const groups = appPermissionGroups.value.filter((group: any) => !selectedGroupId || group.groupId === selectedGroupId);

  return groups.map((group: any) => ({
    ...group,
    permissions: group.permissions.filter((permission: any) => matchesQuery(permission, group) && matchesSelectedFilter(permission))
  }));
});

const updateQuery = async () => {
  await permissionStore.updateQuery(query.value);
};

const updatePermissionAssociation = async (permission: any) => {
  let resp = {} as any;
  const payload = {
    groupId: currentGroup.value.groupId,
    permissionId: permission.permissionId
  };

  const currentPermissions = JSON.parse(JSON.stringify(currentGroupPermissions.value));
  updatePermissionStatus(permission, true);

  try {
    if (permission.isChecked) {
      const fromDate = currentGroupPermissions.value[permission.permissionId].fromDate;

      resp = await permissionStore.removeSecurityPermissionFromSecurityGroup({
        ...payload,
        thruDate: DateTime.now().toMillis(),
        fromDate
      });

      if (commonUtil.hasError(resp)) {
        throw resp.data;
      }

      delete currentPermissions[permission.permissionId];
    } else {
      const time = DateTime.now().toMillis();
      const params = {
        ...payload,
        fromDate: time
      };

      resp = await permissionStore.addSecurityPermissionToSecurityGroup(params);

      if (commonUtil.hasError(resp)) {
        throw resp.data;
      }

      currentPermissions[permission.permissionId] = params;
    }

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Security group permission association successfully updated."));
      await permissionStore.updateCurrentGroupPermissions({ groupId: currentGroup.value.groupId, currentPermissions});
      permissionStore.checkAssociated();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate("Failed to update security group permission association."));
    logger.error(err);
  }
  updatePermissionStatus(permission, false);
};

const arePermissionsAvailable = () => {
  return filteredPermissionGroups.value.some((group: any) => group.permissions.length);
};

const updatePermissionStatus = (currentPermission: any, status: boolean) => {
  updatingPermissionIds[currentPermission.permissionId] = status;
};
</script>

<style scoped>
ion-card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

ion-card-header > ion-checkbox {
  flex-shrink: 0;
}

section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}
</style>
