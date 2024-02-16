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
      
      try {
        if(isChecked) {
          const fromDate = this.allPermissions.filter((perm: any) => perm.permissionId === permission.permissionId)
          resp = await PermissionService.removeSecurityPermissionFromSecurityGroup({
            ...payload,
            thruDate: DateTime.now().toMillis(),
            fromDate
          })
        } else {
          resp = await PermissionService.addSecurityPermissionToSecurityGroup({
            ...payload,
            fromDate: DateTime.now().toMillis()
          })
        }
        console.log('resp', resp);
        

        if(!hasError(resp)) {
          console.log('resp');
          
          showToast(translate("Permission successfully associated to security group."))
          await this.store.dispatch('permission/updateCurrentGroupPermissions', { groupId: this.currentGroup.groupId, permissionId: permission.permissionId})
          this.checkAssociated()
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to associated permission to security group."))
        console.error(err)
      }
      
    },
    async checkAssociated() {
      const permissionsByGroupTypeValues = JSON.parse(JSON.stringify(this.permissionsByGroupType))
      Object.values(permissionsByGroupTypeValues).map((groupType: any) => {
        groupType.permissions.map((permission: any) => {
          if (this.currentGroupPermissions.includes(permission.permissionId)) {
            permission.isChecked = true
          } else {
            permission.isChecked = false
          }
        })
      })
      
      await this.store.dispatch('permission/updatePermissionsByGroupType', permissionsByGroupTypeValues)
    },
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