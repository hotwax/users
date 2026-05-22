<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Security group history") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list v-if="userGroupAssocHistories.length">
      <ion-item v-for="assocHistory in userGroupAssocHistories" :key="assocHistory.groupId">
        <ion-label>
          {{ assocHistory.groupName ? assocHistory.groupName : assocHistory.groupId }}
          <p>{{ assocHistory.groupId }}</p>
        </ion-label>
        <ion-note slot="end">{{ getDateWithOrdinalSuffix(assocHistory.fromDate) }} - {{ assocHistory.thruDate ? getDateWithOrdinalSuffix(assocHistory.thruDate) : translate('Current') }}</ion-note>
      </ion-item>
    </ion-list>
    <div class="empty-state" v-else>
      <p>{{ translate("No history found.") }}</p>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonButtons, IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonTitle, IonToolbar, modalController } from "@ionic/vue";
import { ref, computed, onMounted } from "vue";
import { closeOutline } from "ionicons/icons";
import { commonUtil, translate } from '@common';
import { useUserStore } from "@/store/user";
import { useUtilStore } from "@/store/util";
import { getDateWithOrdinalSuffix } from "@/utils";
import { UserService } from "@/services/UserService";

const userStore = useUserStore();
const utilStore = useUtilStore();

const selectedUser = computed(() => userStore.getSelectedUser);
const securityGroups = computed(() => utilStore.getSecurityGroups);

const userGroupAssocHistories = ref<any[]>([]);

const closeModal = () => {
  modalController.dismiss({ dismissed: true });
};

const fetchUserSecurityGroupAssoHistory = async () => {
  if (!selectedUser.value.userLoginId) return;

  const securityGroupNameByGroupId = {} as any;
  let histories = [] as any;
  try {
    const resp = await UserService.fetchUserSecurityGroupAssocHistory({
      entityName: "UserLoginAndSecurityGroup",
      inputFields: {
        userLoginId: selectedUser.value.userLoginId,
      },
      orderBy: "thruDate DESC",
      viewSize: 250
    });
    if (!commonUtil.hasError(resp)) {
      histories = resp.data.docs;
      securityGroups.value.forEach((group: any) => securityGroupNameByGroupId[group.groupId] = group.groupName);
      histories.forEach((history: any) => {
        history["groupName"] = securityGroupNameByGroupId[history.groupId];
      });
      const currentSecurityGroups = histories.filter((history: any) => !history.thruDate);
      const expiredSecurityGroups = histories.filter((history: any) => history.thruDate);
      histories = currentSecurityGroups.concat(expiredSecurityGroups);
    } else {
      throw resp.data;
    }
  } catch (error: any) {
    console.error(error);
  }
  userGroupAssocHistories.value = histories;
};

onMounted(() => {
  fetchUserSecurityGroupAssoHistory();
});
</script>
