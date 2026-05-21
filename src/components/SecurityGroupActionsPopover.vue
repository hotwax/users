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

<script setup lang="ts">
import { alertController, IonContent, IonItem, IonLabel, IonList, IonListHeader, popoverController } from "@ionic/vue";
import { computed } from "vue";
import { translate } from "@hotwax/dxp-components";
import { useUserStore } from "@/store/user";
import { UserService } from "@/services/UserService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from '@/logger';

const props = defineProps({
  securityGroup: {
    type: Object,
    required: true
  }
});

const userStore = useUserStore();

const selectedUser = computed(() => userStore.getSelectedUser);

const closePopover = (userSecurityGroups: any) => {
  popoverController.dismiss(userSecurityGroups);
};

const getDateTime = (time: any) => {
  return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
};

const removeUserSecurityGroup = async () => {
  try {
    const resp = await UserService.removeUserSecurityGroup({
        groupId: props.securityGroup.groupId,
        userLoginId: selectedUser.value.userLoginId
    })
    
    if (hasError(resp)) throw resp.data
    showToast(translate('Security group removed successfully.'))
  } catch (error) {
    showToast(translate('Something went wrong.'));
    logger.error(error)
  }
  // refetching security groups
  const userSecurityGroups = await UserService.getUserSecurityGroups(selectedUser.value.userLoginId)
  userStore.updateSelectedUser({ ...selectedUser.value, securityGroups: userSecurityGroups })
  closePopover(userSecurityGroups)
};

const confirmRemove = async () => {
  const username = selectedUser.value.groupName ? selectedUser.value.groupName : `${selectedUser.value.firstName} ${selectedUser.value.lastName}`
  const message = "Removing this security group may limit 's access to certain features or data. Are you sure you want to continue?"
  const alert = await alertController.create({
    header: translate("Remove security group"),
    message: translate(message, { username }),
    buttons: [
      {
        text: translate("Keep Group"),
      },
      {
        text: translate("Remove"),
        handler: async () => {
          await removeUserSecurityGroup();
        }
      }
    ],
  });
  return alert.present();
};
</script>