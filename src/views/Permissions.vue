<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Users management") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button>
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
            <ion-item v-for="group in securityGroups" :key="group.groupId" button detail @click="updateCurrentGroup(group)">
              <ion-label  :color="group.groupId === currentGroup.groupId ? 'primary' : ''">
                <p class="overline">{{ group.groupId }}</p>
                {{ group.groupName }}
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-button @click="createGroup()" fill="clear" expand="block">
            <ion-icon slot="start" :icon="addOutline" />
            <ion-label>{{ translate("Create security group") }}</ion-label>
          </ion-button>
        </aside>
        <main v-if="Object.keys(currentGroup).length">
          <div class="section-header">
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>
                <ion-note class="overline">{{ currentGroup.groupId }}</ion-note>
                <h1>{{ currentGroup.groupName }}</h1>
                <p class="ion-text-wrap">{{ currentGroup.description }}</p>
              </ion-label>
              <ion-button slot="end" @click="editGroupName()" fill="outline">{{ translate("Edit") }}</ion-button>
            </ion-item>
            <ion-buttons>
              <ion-button color="medium">
                10 users
                <ion-icon :icon="openOutline" slot="end" />
              </ion-button>
            </ion-buttons>
          </div>
          <hr />
          <PermissionItems />
        </main>
        <main v-else class="ion-text-center">
          <h1>{{ "Select a security group to view its details" }}</h1>
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
import {
  addOutline,
  downloadOutline,
  idCardOutline,
  openOutline,
  shieldCheckmarkOutline,
  trashOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import PermissionItems from '@/components/PermissionItems.vue'
import DeleteSecurityGroupModal from '@/components/DeleteSecurityGroupModal.vue';
import { mapGetters, useStore } from 'vuex';
import { showToast } from '@/utils';
import { hasError } from '@/adapter';
import { UtilService } from '@/services/UtilService';
import emitter from "@/event-bus";

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
  computed: {
    ...mapGetters({
      securityGroups: 'util/getSecurityGroups',
      permissionsByGroupType: 'permission/getPermissionsByGroupType',
      currentGroupPermissions: 'permission/getCurrentGroupPermissions',
      currentGroup: "permission/getCurrentGroup"
    })
  },
  async mounted() {
    await this.store.dispatch('util/getSecurityGroups')
    if(!Object.keys(this.permissionsByGroupType).length) await this.store.dispatch('permission/getpermissionsByGroupType')
    if(this.currentGroup) await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId)
    await this.store.dispatch('permission/updateCurrentGroup', this.securityGroups[0])
    this.checkAssociated()
  },
  methods: {
    createGroup() {
      this.$router.replace({ path: `/create-security-group/` })
    },
    async openDeleteSecurityGroupModal() {
      const deleteSecurityGroupModal = await modalController.create({
        component: DeleteSecurityGroupModal,
      });

      return deleteSecurityGroupModal.present();
    },
    async updateCurrentGroup(group: any) {
      await this.store.dispatch('permission/updateCurrentGroup', group)
      await this.store.dispatch('permission/getPermissionsByGroup', this.currentGroup.groupId)
      this.checkAssociated()
    },
    checkAssociated() {
      Object.values(this.permissionsByGroupType).map((groupType: any) => {
        groupType.permissions.map((permission: any) => {
          if (this.currentGroupPermissions.includes(permission.permissionId)) {            
            permission.isChecked = true
          } else {
            permission.isChecked = false
          }
        })
      })
    },
    async editGroupName() {
      const alert = await alertController.create({
        header: translate("Rename Security Group"),
        inputs: [{
          name: "groupName",
          value: this.currentGroup.groupName
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Apply'),
          handler: async (data: any) => {
            if (data.groupName) {
              emitter.emit('presentLoader')

              try {
                const resp = await UtilService.updateSecurityGroup({
                  groupId: this.currentGroup.groupId,
                  groupName: data.groupName
                })

                if (!hasError(resp)) {
                  console.log(resp);
                  showToast(translate("Security group renamed successfully."))
                } else {
                  throw resp.data
                }
              } catch (error) {
                showToast(translate('Failed to rename security group.'))
                console.error(error)
              }

              emitter.emit('dismissLoader')
            }
          }
        }]
      })

      await alert.present()
    },
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      downloadOutline,
      idCardOutline,
      openOutline,
      router,
      shieldCheckmarkOutline,
      store,
      translate,
      trashOutline
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
</style>
