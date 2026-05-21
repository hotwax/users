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
      <ion-select :label="translate('Filters')" interface="popover" v-model="query.classificationSecurityGroupId" @ionChange="updateQuery()">
        <ion-select-option value="">{{ translate("All") }}</ion-select-option>
        <ion-select-option :value="classificationSecurityGroup.groupId" :key="classificationSecurityGroup.groupId" v-for="classificationSecurityGroup in classificationSecurityGroups">
          {{ classificationSecurityGroup.groupName }}
        </ion-select-option>
        <ion-select-option value="OTHERS">{{ translate("Others") }}</ion-select-option>
      </ion-select>
    </ion-item>
  </div>

  <template v-if="arePermissionsAvailable()">
    <div v-for="(group, groupId) in filteredPermissions" :key="groupId">
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
              <ion-card-title>{{ permission.permissionId }}</ion-card-title>
              <ion-card-subtitle>{{ permission.description }}</ion-card-subtitle>
            </div>
            <ion-spinner v-if="permission.isStatusUpdating" name="crescent" data-spinner-size="medium" />
            <ion-checkbox v-else :disabled="permission.isChecked ? !hasPermission(Actions.APP_PERMISSION_UPDATE) : !hasPermission(Actions.APP_PERMISSION_CREATE)" :checked="permission.isChecked" />
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
import { computed } from 'vue';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCheckbox, IonIcon, IonItem, IonItemDivider, IonLabel, IonNote, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonToggle } from '@ionic/vue';
import { translate } from '@hotwax/dxp-components';
import { optionsOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { PermissionService } from '@/services/PermissionService';
import { showToast } from '@/utils';
import { hasError } from '@/adapter';
import { DateTime } from 'luxon';
import { Actions, hasPermission } from '@/authorization'
import logger from '@/logger';
import { usePermissionStore } from '@/store/permission';
import { useUtilStore } from '@/store/util';

const permissionStore = usePermissionStore();
const utilStore = useUtilStore();

const query = computed(() => permissionStore.getQuery);
const currentGroupPermissions = computed(() => permissionStore.getCurrentGroupPermissions);
const currentGroup = computed(() => permissionStore.getCurrentGroup);
const filteredPermissions = computed(() => permissionStore.getFilteredPermissions);
const classificationSecurityGroups = computed(() => utilStore.getClassificationSecurityGroups);
const permissionsByClassificationGroups = computed(() => permissionStore.getPermissionsByClassificationGroups);

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

      resp = await PermissionService.removeSecurityPermissionFromSecurityGroup({
        ...payload,
        thruDate: DateTime.now().toMillis(),
        fromDate
      });

      if (hasError(resp)) {
        throw resp.data;
      }

      delete currentPermissions[permission.permissionId];
    } else {
      const time = DateTime.now().toMillis();
      const params = {
        ...payload,
        fromDate: time
      };

      resp = await PermissionService.addSecurityPermissionToSecurityGroup(params);

      if (hasError(resp)) {
        throw resp.data;
      }

      currentPermissions[permission.permissionId] = params;
    }

    if (!hasError(resp)) {
      showToast(translate("Security group permission association successfully updated."));
      await permissionStore.updateCurrentGroupPermissions({ groupId: currentGroup.value.groupId, currentPermissions});
      permissionStore.checkAssociated();
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate("Failed to update security group permission association."));
    logger.error(err);
  }
  updatePermissionStatus(permission, false);
};

const arePermissionsAvailable = () => {
  return Object.values(filteredPermissions.value).some((groupType: any) => groupType.permissions.length);
};

const updatePermissionStatus = (currentPermission: any, status: boolean) => {
  const permissionsByGroup = JSON.parse(JSON.stringify(permissionsByClassificationGroups.value));

  Object.values(permissionsByGroup).map((group: any) => {
    const permission = group.permissions.find((permission: any) => permission.permissionId === currentPermission.permissionId);
    if (permission) {
      permission["isStatusUpdating"] = status;
    }
  });

  permissionStore.updatePermissionsByClassificationGroups(permissionsByGroup);
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
