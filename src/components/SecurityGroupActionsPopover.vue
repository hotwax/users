<template>
    <ion-content>
      <ion-list>
        <ion-list-header>{{ securityGroup.groupName || securityGroup.groupId }}</ion-list-header>
        <ion-item>
          <ion-label>
            {{ getDateTime(securityGroup.fromDate) }}
            <p>{{ translate('added to group') }}</p>
          </ion-label>
        </ion-item>
        <ion-item button @click="confirmRemove()" lines="none">
          {{ translate("Remove") }}
        </ion-item>
      </ion-list>
    </ion-content>
  </template>
  
  <script lang="ts">
  import {
    alertController,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    popoverController,
  } from "@ionic/vue";
  import { defineComponent } from "vue";
  import { translate } from "@hotwax/dxp-components";
  import { mapGetters, useStore } from 'vuex';
  import { UserService } from "@/services/UserService";
  import { DateTime } from "luxon";
  import { showToast } from "@/utils";
  import { hasError } from "@/adapter";
  import logger from '@/logger';
  
  export default defineComponent({
    name: "SecurityGroupActionsPopover",
    components: {
      IonContent,
      IonItem,
      IonLabel,
      IonList,
      IonListHeader
    },
    props: ['securityGroup'],
    computed: {
      ...mapGetters({
        selectedUser: 'user/getSelectedUser',
        userSecurityGroups: 'user/getUserSecurityGroups',
      })
    },
    methods: {
      closePopover(userSecurityGroups: any) {
        popoverController.dismiss(userSecurityGroups);
      },
      getDateTime(time: any) {
        return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
      },
      async removeUserSecurityGroup() {
        try {
          const resp = await UserService.removeUserSecurityGroup({
              groupId: this.securityGroup.groupId,
              userLoginId: this.selectedUser.userLoginId
          })
          
          if (hasError(resp)) throw resp.data
          showToast(translate('Security group removed successfully.'))
        } catch (error) {
          showToast(translate('Something went wrong.'));
          logger.error(error)
        }
        // refetching security groups
        const userSecurityGroups = await UserService.getUserSecurityGroups(this.selectedUser.userLoginId)
        this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, securityGroups: userSecurityGroups })
        this.closePopover(userSecurityGroups)
      },
      async confirmRemove() {
        const message = `Removing this security group may limit user's access to certain features. Are you sure you want to continue?`
        const alert = await alertController.create({
          header: translate("Remove security group"),
          message: translate(message),
          buttons: [
            {
              text: translate("Keep Group"),
            },
            {
              text: translate("Remove"),
              handler: async () => {
                await this.removeUserSecurityGroup();
              }
            }
          ],
        });
        return alert.present();
      }
    },
    setup() {
      const store = useStore();
  
      return {
        store,
        translate
      }
    }
  });
  </script>