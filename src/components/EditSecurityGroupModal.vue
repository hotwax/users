<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Update Security Group") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="updateSecurityGroup()">
      <ion-item>
        <ion-input :label="translate('Name')" v-model="group.groupName" />
      </ion-item>
      <ion-item lines="none">
        <ion-textarea :label="translate('Description')" :counter="true" :maxlength="255" :auto-grow="true" v-model="group.description" />
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="updateSecurityGroup()" :disabled="!isGroupUpdated()">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonTextarea, IonTitle, IonToolbar, modalController } from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { commonUtil, translate, logger } from "@common";
import { usePermissionStore } from "@/store/permission";
import { useUtilStore } from "@/store/util";

const permissionStore = usePermissionStore();
const utilStore = useUtilStore();

const group = ref<any>({});
const currentGroup = computed(() => permissionStore.getCurrentGroup);

onMounted(() => {
  group.value = JSON.parse(JSON.stringify(currentGroup.value));
});

const closeModal = () => {
  modalController.dismiss();
};

const isGroupUpdated = () => {
  return JSON.stringify(group.value) !== JSON.stringify(currentGroup.value);
};

const updateSecurityGroup = async () => {
  try {
    const payload = {
      groupId: currentGroup.value.groupId,
      groupName: group.value.groupName,
      description: group.value.description
    };
    const resp = await utilStore.updateSecurityGroup(payload);

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Security group updated successfully."));
      const updatedCurrentGroup = {
        ...currentGroup.value,
        groupName: group.value.groupName,
        description: group.value.description
      };
      await permissionStore.updateCurrentGroup(updatedCurrentGroup);
      modalController.dismiss();
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate("Failed to update security group."));
    logger.error(error);
  }
};
</script>
