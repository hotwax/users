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

<script lang="ts">
import {
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToggle
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import { optionsOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { mapGetters, useStore } from 'vuex';
import { PermissionService } from '@/services/PermissionService';
import { showToast } from '@/utils';
import { hasError } from '@/adapter';
import { DateTime } from 'luxon';
import { Actions, hasPermission } from '@/authorization'
import { appPermissionCatalogs, AppPermissionCatalog, AppPermissionDefinition } from '@/config/app-permissions';
import logger from '@/logger';

export default defineComponent({
  name: 'PermissionItems',
  components: {
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonNote,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonToggle,
  },
  data() {
    return {
      updatingPermissionIds: {} as Record<string, boolean>
    }
  },
  computed: {
    ...mapGetters({
      query: 'permission/getQuery',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: "permission/getCurrentGroup",
      permissionsByClassificationGroups: 'permission/getPermissionsByClassificationGroups',
      allPermissions: 'permission/getAllPermissions'
    }),
    appPermissionCatalogs(): readonly AppPermissionCatalog[] {
      return appPermissionCatalogs as readonly AppPermissionCatalog[];
    },
    filteredPermissionGroups(): any[] {
      const selectedGroupId = this.query.classificationSecurityGroupId;
      const groups = this.appPermissionGroups.filter((group: any) => !selectedGroupId || group.groupId === selectedGroupId);

      return groups.map((group: any) => ({
        ...group,
        permissions: group.permissions.filter((permission: any) => this.matchesQuery(permission, group) && this.matchesSelectedFilter(permission))
      }));
    },
    appPermissionGroups(): any[] {
      const catalogPermissionIds = new Set<string>();
      const hiddenPermissionIds = this.getHiddenPermissionIds();
      const catalogs = appPermissionCatalogs as readonly AppPermissionCatalog[];

      const groups = catalogs.map((app: AppPermissionCatalog): any => {
        const permissions = [...app.permissions]
          .filter((permission: AppPermissionDefinition) => !hiddenPermissionIds.has(permission.permissionId))
          .map((permission: AppPermissionDefinition) => {
            catalogPermissionIds.add(permission.permissionId);
            return this.getPermissionItem(permission.permissionId, permission);
          });

        return {
          groupId: app.appId,
          groupName: app.appName,
          permissions
        };
      });

      const otherPermissions = Object.values(this.allPermissions || {})
        .filter((permission: any) => permission.permissionId && !catalogPermissionIds.has(permission.permissionId) && !hiddenPermissionIds.has(permission.permissionId))
        .map((permission: any) => this.getPermissionItem(permission.permissionId));

      groups.push({
        groupId: 'OTHERS',
        groupName: translate('Other permissions'),
        permissions: otherPermissions
      });

      return groups;
    }
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('permission/updateQuery', this.query)
    },
    async updatePermissionAssociation(permission: any) {
      let resp = {} as any;
      const payload = {
        groupId: this.currentGroup.groupId,
        permissionId: permission.permissionId
      }

      let currentPermissions = JSON.parse(JSON.stringify(this.currentGroupPermissions))
      this.updatePermissionStatus(permission, true);

      try {
        if(permission.isChecked) {
          const fromDate = this.currentGroupPermissions[permission.permissionId].fromDate

          resp = await PermissionService.removeSecurityPermissionFromSecurityGroup({
            ...payload,
            thruDate: DateTime.now().toMillis(),
            fromDate
          })

          if(hasError(resp)) {
            throw resp.data;
          }

          delete currentPermissions[permission.permissionId]
        } else {
          const time = DateTime.now().toMillis()
          const params = {
            ...payload,
            fromDate: time
          }

          resp = await PermissionService.addSecurityPermissionToSecurityGroup(params)

          if(hasError(resp)) {
            throw resp.data;
          }

          currentPermissions[permission.permissionId] = params
        }

        if(!hasError(resp)) {
          showToast(translate("Security group permission association successfully updated."))
          await this.store.dispatch('permission/updateCurrentGroupPermissions', { groupId: this.currentGroup.groupId, currentPermissions})
          this.store.dispatch('permission/checkAssociated')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update security group permission association."))
        logger.error(err)
      }
      this.updatePermissionStatus(permission, false);
    },
    arePermissionsAvailable() {
      return this.filteredPermissionGroups.some((group: any) => group.permissions.length)
    },
    getHiddenPermissionIds() {
      return new Set((this.permissionsByClassificationGroups?.SGC_HIDDEN?.permissions || []).map((permission: any) => permission.permissionId));
    },
    getPermissionItem(permissionId: string, definition?: AppPermissionDefinition) {
      const serverPermission = this.allPermissions?.[permissionId] || {};

      return {
        ...serverPermission,
        ...definition,
        permissionId,
        title: definition?.title || serverPermission.permissionId,
        description: definition?.description || serverPermission.description,
        isChecked: !!this.currentGroupPermissions[permissionId],
        isStatusUpdating: !!this.updatingPermissionIds[permissionId]
      };
    },
    matchesQuery(permission: any, group: any) {
      const queryString = this.query.queryString?.toLowerCase();
      if (!queryString) return true;

      return permission.permissionId?.toLowerCase().includes(queryString)
        || permission.title?.toLowerCase().includes(queryString)
        || permission.description?.toLowerCase().includes(queryString)
        || permission.category?.toLowerCase().includes(queryString)
        || group.groupName?.toLowerCase().includes(queryString);
    },
    matchesSelectedFilter(permission: any) {
      return !this.query.showSelected || permission.isChecked;
    },
    updatePermissionStatus(currentPermission: any, status: boolean) {
      this.updatingPermissionIds = {
        ...this.updatingPermissionIds,
        [currentPermission.permissionId]: status
      }
    }
  },
  setup() {
    const store = useStore();

    return {
      Actions,
      hasPermission,
      optionsOutline,
      shieldCheckmarkOutline,
      store,
      translate
    }
  }
});
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
