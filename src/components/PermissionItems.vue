<template>
  <div class="search-permissions">
    <ion-searchbar :placeholder="translate('Search permissions')" v-model="query.queryString" @ionInput="updateQuery()" />
    <ion-item lines="none">
      <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
      <ion-toggle v-model="query.showSelected" @ionChange="updateQuery()">
        {{ translate("Only selected permissions") }}
      </ion-toggle>
    </ion-item>
    <ion-item lines="none">
      <ion-icon :icon="optionsOutline" slot="start" />
      <ion-select :label="translate('Filters')" interface="popover" v-model="query.classificationSecurityGroupId" @ionChange="updateQuery()">
        <ion-select-option value="">{{ translate("All") }}</ion-select-option>
        <ion-select-option :value="classificationSecurityGroup.groupId" :key="classificationSecurityGroup.groupId" v-for="classificationSecurityGroup in classificationSecurityGroups">
          {{ classificationSecurityGroup.groupName }}
        </ion-select-option>
      </ion-select>
    </ion-item>
  </div>

  <template v-if="arePermissionsAvailable()">
    <div v-for="(group, groupId) in filteredPermissions" :key="groupId">
      <ion-item-divider v-if="group.permissions.length" class="ion-margin-vertical" color="light">
        <ion-label>
          {{ group.groupName || group.groupId }}
        </ion-label>
      </ion-item-divider>

      <section>
        <ion-card v-for="permission in group.permissions" :key="permission.permissionId">
          <ion-card-header>
            <div>
              <ion-card-title>{{ permission.permissionId }}</ion-card-title>
              <ion-card-subtitle>{{ permission.description }}</ion-card-subtitle>
            </div>
            <ion-checkbox :disabled="!hasPermission(Actions.APP_PERMISSION_UPDATE)" :checked="permission.isChecked" @click="updatePermissionAssociation($event, permission)" />
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
  IonSearchbar,
  IonSelect,
  IonSelectOption,
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
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonToggle,
  },
  computed: {
    ...mapGetters({
      query: 'permission/getQuery',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: "permission/getCurrentGroup",
      filteredPermissions: "permission/getFilteredPermissions",
      classificationSecurityGroups: 'util/getClassificationSecurityGroups'
    })
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('permission/updateQuery', this.query)
    },
    async updatePermissionAssociation(event: any, permission: any) {
      event.stopPropagation();

      let resp = {} as any;
      const payload = {
        groupId: this.currentGroup.groupId,
        permissionId: permission.permissionId
      }

      let currentPermissions = JSON.parse(JSON.stringify(this.currentGroupPermissions))

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
          event.target.checked = !permission.isChecked
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update security group permission association."))
        logger.error(err)
      }
    },
    arePermissionsAvailable() {
      return Object.values(this.filteredPermissions).some((groupType: any) => groupType.permissions.length)
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