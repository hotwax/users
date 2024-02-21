<template>
  <div class="search-permissions">
    <ion-searchbar :placeholder="translate('Search permissions')" :value="query.queryString" @keyup.enter="query.queryString = $event.target.value; updateQuery()" />
    <ion-item lines="none">
      <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
      <ion-label>{{ translate("Only selected permissions") }}</ion-label>
      <ion-toggle slot="end" v-model="query.showSelected" @ionChange="updateQuery()"/>
    </ion-item>
  </div>

  <div v-for="(group, groupId) in currentPermissionsByGroupType" :key="groupId">
    <ion-item-divider v-if="group.permissions.length" class="ion-margin-vertical" color="light">
      <ion-label>
        {{ group.groupName }}
      </ion-label>
    </ion-item-divider>

    <section>
      <ion-card v-for="permission in group.permissions" :key="permission.permissionId">
        <ion-card-header>
          <div>
            <ion-card-title>{{ permission.permissionId }}</ion-card-title>
            <ion-card-subtitle>{{ permission.description }}</ion-card-subtitle>
          </div>
          <ion-checkbox :checked="permission.isChecked" @click="updatePermissionAssociation(permission)" />
        </ion-card-header>
      </ion-card>
    </section>
  </div>

  <hr/>
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
  IonToggle
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { mapGetters, useStore } from 'vuex';
import { PermissionService } from '@/services/PermissionService';
import { showToast } from '@/utils';
import { hasError } from '@/adapter';
import { DateTime } from 'luxon';
import emitter from '@/event-bus';

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
    IonToggle,
  },
  computed: {
    ...mapGetters({
      query: 'permission/getQuery',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: "permission/getCurrentGroup",
      currentPermissionsByGroupType: "permission/getCurrentPermissionsByGroupType"
    })
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
      emitter.emit('presentLoader')

      try {
        if(permission.isChecked) {
          const fromDate = this.currentGroupPermissions[permission.permissionId].fromDate

          resp = await PermissionService.removeSecurityPermissionFromSecurityGroup({
            ...payload,
            thruDate: DateTime.now().toMillis(),
            fromDate
          })

          delete currentPermissions[permission.permissionId]
        } else {
          const time = DateTime.now().toMillis()
          const params = {
            ...payload,
            fromDate: time
          }

          resp = await PermissionService.addSecurityPermissionToSecurityGroup(params)
          currentPermissions[permission.permissionId] = params
        }

        if(!hasError(resp)) {
          showToast(translate("Security group permission association successfully updated."))
          await this.store.dispatch('permission/updateCurrentGroupPermissions', { groupId: this.currentGroup.groupId, currentPermissions})
          await this.store.dispatch('permission/checkAssociated')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update security group permission association."))
        console.error(err)
      }
      emitter.emit('dismissLoader')
    }
  },
  setup() {
    const store = useStore();

    return {
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
  justify-content: space-between;
  align-items: center;
}
section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}
</style>