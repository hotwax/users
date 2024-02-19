<template>
  <div class="search-permissions">
    <ion-searchbar :placeholder="translate('Search permissions')" v-model="query.queryString" @keyup.enter="updateQuery()" />
    <ion-item lines="none">
      <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
      <ion-label>{{ translate("Only selected permissions") }}</ion-label>
      <ion-toggle slot="end" />
    </ion-item>
  </div>

  <div v-for="(group, groupId) in permissionsByGroupType" :key="groupId">
    <ion-item-divider class="ion-margin-vertical" color="light">
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
          <ion-checkbox :checked="permission.isChecked" @click="updatePermissionAssociation(permission, permission.isChecked)" />
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
  IonToggle,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import {
  idCardOutline,
  openOutline,
  shieldCheckmarkOutline,
  trashOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { PermissionService } from '@/services/PermissionService';
import { showToast } from '@/utils';
import { hasError } from '@hotwax/oms-api';
import { DateTime } from 'luxon';

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
      permissionsByGroupType: 'permission/getPermissionsByGroupType',
      query: 'permission/getQuery',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: "permission/getCurrentGroup",
      allPermissions: "permission/getAllPermissions"
    })
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('permission/updateQuery', this.query)
      // await this.store.dispatch('permission/getpermissionsByGroupType')
    },
    async updatePermissionAssociation(permission: any, isChecked: boolean) {
      let resp = {} as any;
      const payload = {
        groupId: this.currentGroup.groupId,
        permissionId: permission.permissionId
      }

      let currentPermissions = JSON.parse(JSON.stringify(this.currentGroupPermissions))
      console.log('before', this.currentGroupPermissions);

      try {
        if(isChecked) {
          const fromDate = this.currentGroupPermissions[permission.permissionId].fromDate
          
          resp = await PermissionService.removeSecurityPermissionFromSecurityGroup({
            ...payload,
            thruDate: DateTime.now().toMillis(),
            fromDate
          })

          delete currentPermissions[permission.permissionId]
        } else {
          const time = DateTime.now().toMillis() 
          resp = await PermissionService.addSecurityPermissionToSecurityGroup({
            ...payload,
            fromDate: time
          })

          currentPermissions[permission.permissionId] = {
            ...payload,
            fromDate: time
          }
        }

        console.log('updated', currentPermissions);
        

        if(!hasError(resp)) {
          showToast(translate("Permission association with security group updated successfully."))
          await this.store.dispatch('permission/updateCurrentGroupPermissions', { groupId: this.currentGroup.groupId, currentPermissions})
          this.checkAssociated()
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update permission association to security group."))
        console.error(err)
      }
      
    },
    async checkAssociated() {
      const permissionsByGroupTypeValues = JSON.parse(JSON.stringify(this.permissionsByGroupType))
      Object.values(permissionsByGroupTypeValues).map((group: any) => {
        group.permissions.map((permission: any) => {
          if (this.currentGroupPermissions[permission.permissionId]) {
            permission.isChecked = true
          } else {
            permission.isChecked = false
          }
        })
      })
      await this.store.dispatch('permission/updatePermissionsByGroupType', permissionsByGroupTypeValues)
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      idCardOutline,
      openOutline,
      shieldCheckmarkOutline,
      router,
      store,
      translate,
      trashOutline
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