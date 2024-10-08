<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Permissions") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="downloadCSVForPermissions()">
            <ion-icon :icon="downloadOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
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
          <p>{{ "Select a security group to view its details" }}</p>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  alertController,
  modalController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import { addOutline, downloadOutline, idCardOutline, openOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import PermissionItems from '@/components/PermissionItems.vue'
import { mapGetters, useStore } from 'vuex';
import { jsonToCsv } from '@/utils';
import { hasError } from '@/adapter';
import emitter from "@/event-bus";
import { PermissionService } from '@/services/PermissionService';
import { DateTime } from 'luxon';
import EditSecurityGroupModal from '@/components/EditSecurityGroupModal.vue';
import { Actions, hasPermission } from '@/authorization'
import logger from '@/logger';

export default defineComponent({
  name: 'Permissions',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar,
    PermissionItems
  },
  data() {
    return {
      securityGroupUsers: {} as any
    }
  },
  computed: {
    ...mapGetters({
      securityGroups: 'util/getSecurityGroups',
      permissionsByClassificationGroups: 'permission/getPermissionsByClassificationGroups',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: 'permission/getCurrentGroup',
      allPermissions: 'permission/getAllPermissions'
    })
  },
  async mounted() {
    await this.store.dispatch('util/getSecurityGroups')
    await this.store.dispatch('util/getClassificationSecurityGroups')
    if(!this.allPermissions.length) await this.store.dispatch('permission/getAllPermissions')
    if(!Object.keys(this.permissionsByClassificationGroups).length) await this.store.dispatch('permission/getPermissionsByClassificationGroups')
    if(this.currentGroup.groupId) {
      await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId)
      await this.getUsersCount()
    }
  },
  methods: {
    createGroup() {
      this.$router.replace({ path: `/create-security-group/` })
    },
    async updateCurrentGroup(group: any) {
      emitter.emit('presentLoader')
      await this.store.dispatch('permission/updateCurrentGroup', group)
      await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId)
      await this.store.dispatch('permission/checkAssociated')
      await this.getUsersCount()
      await this.store.dispatch('permission/updateQuery', {queryString: '', showAllSelected: false, classificationSecurityGroupId: ''})
      emitter.emit('dismissLoader')
    },
    async editSecurityGroup() {
      const editSecurityGroupModal = await modalController.create({
        component: EditSecurityGroupModal
      })

      editSecurityGroupModal.present()
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
        })

        if(!hasError(resp)) {
          this.securityGroupUsers[this.currentGroup.groupId] = resp.data.count
        } else {
          throw resp.data;
        }
      } catch(err) {
        logger.error(err)
      }
    },
    async openCurrentGroupUsers() {
      await this.store.dispatch('user/updateQuery', {queryString: '', securityGroup: this.currentGroup.groupId, status: '', hideDisabledUser: true})
      this.router.replace('users')
    },
    async downloadCSVForPermissions() {
      if(this.currentGroup.groupId && !Object.keys(this.currentGroupPermissions).length) {
        const alert = await alertController.create({
          header: translate("No permissions associated"),
          message: translate("No permissions have been linked to this group yet. Permissions for a group cannot be downloaded."),
          buttons: [
            {
              text: translate("Dismiss"),
              role: "cancel"
            }
          ],
        });
        return alert.present();
      }

      let permissionsJson = [] as any

      if(this.currentGroup.groupId) {
        Object.values(this.currentGroupPermissions).map((permission: any) => {
          permissionsJson.push({
            "Group ID": permission.groupId,
            "Permission ID": permission.permissionId,
            "Permission Desc": permission.permissionDescription,
            "Association date": DateTime.fromMillis(permission.fromDate).toFormat('dd-MM-yyyy')
          })
        })
      } else {
        permissionsJson =  await this.downloadCSVForAllPermissionsCSV()
      }

      const fileName = `HotWaxSecurityGroupExport_${DateTime.now().toFormat('yyyy_MM_dd_HH:mm')}`

      await jsonToCsv(permissionsJson, { download: true, name: fileName })
    },
    async downloadCSVForAllPermissionsCSV() {
     let permissionsByGroup = [] as any;

      try {
        await Promise.allSettled(this.securityGroups.map(async (group: any) => {
          let viewIndex = 0, resp;
          do {
            resp = await PermissionService.getPermissionsByGroup({
              entityName: "SecurityGroupAndPermission",
              distinct: "Y",
              noConditionFind: "Y",
              filterByDate: "Y",
              viewSize: 250,
              viewIndex: viewIndex,
              inputFields: {
                groupId: group.groupId
              }
            });

            if (!hasError(resp) && resp.data.count) {
              resp.data.docs.map((permission: any) => {
                permissionsByGroup.push({
                  "Group Id": permission.groupId,
                  "Permission ID": permission.permissionId,
                  "Permission Desc": permission.permissionDescription,
                  "Association date": DateTime.fromMillis(permission.fromDate).toFormat('dd-MM-yyyy')
                });
              });
              viewIndex++;
            } else {
              throw resp.data;
            }
          } while (resp.data.docs.length >= 250);
        }));
      } catch (err) {
        logger.error(err);
      }

      return permissionsByGroup;
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      Actions,
      addOutline,
      downloadOutline,
      hasPermission,
      idCardOutline,
      openOutline,
      router,
      store,
      translate
    }
  }
});
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header>ion-item {
  width: 50%;
}
</style>
