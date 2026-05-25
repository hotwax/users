<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/permissions" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create security group") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-list>
          <ion-item>
            <ion-input :label="translate('Name')" label-placement="floating" @ionBlur="formData.groupId ? null : setGroupId(formData.groupName)" v-model="formData.groupName" />
          </ion-item>
          <ion-item ref="groupIdRef" lines="none">
            <ion-input :label="translate('Internal ID')" label-placement="floating" @ionChange="validateGroupId" @ionBlur="markGroupIdTouched" v-model="formData.groupId" :errorText="translate('Internal ID cannot be more than 20 characters.')" />
          </ion-item>
          <ion-item lines="none">
            <ion-textarea :label="translate('Description')" label-placement="floating" v-model="formData.description" :counter="true" :maxlength="255"/>
          </ion-item>
        </ion-list>
  
        <div class="ion-text-center ion-margin">
          <ion-button @click="createGroup()">
            <ion-icon slot="start" :icon="addOutline" />
            {{ translate("Create security group") }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IonBackButton, IonButton, IonContent, IonHeader, IonIcon, IonItem, IonList, IonPage, IonTextarea, IonTitle, IonToolbar, IonInput } from "@ionic/vue";
import { useRouter } from 'vue-router';
import { useUtilStore } from "@/store/util";
import { usePermissionStore } from "@/store/permission";
import { addOutline } from 'ionicons/icons';
import { commonUtil, translate, logger } from "@common";

const router = useRouter();
const utilStore = useUtilStore();
const permissionStore = usePermissionStore();

const groupIdRef = ref<any>(null);

const formData = ref({
  groupName: '',
  groupId: '',
  description: ''
});

const setGroupId = (groupName: string) => {
  formData.value.groupId = commonUtil.generateInternalId(groupName);
};

const validateGroupId = (event: any) => {
  const value = event.target.value;
  if (!groupIdRef.value) return;
  groupIdRef.value.$el.classList.remove('ion-valid');
  groupIdRef.value.$el.classList.remove('ion-invalid');

  if (value === '') return;

  formData.value.groupId.length <= 20
    ? groupIdRef.value.$el.classList.add('ion-valid')
    : groupIdRef.value.$el.classList.add('ion-invalid');
};

const markGroupIdTouched = () => {
  if (groupIdRef.value) {
    groupIdRef.value.$el.classList.add('ion-touched');
  }
};

const createGroup = async () => {
  if (!formData.value.groupName?.trim()) {
    commonUtil.showToast(translate("Security group name is required."));
    return;
  }

  if (formData.value.groupId.length > 20) {
    commonUtil.showToast(translate("Internal ID cannot be more than 20 characters."));
    return;
  }

  if (!formData.value.groupId) {
    setGroupId(formData.value.groupName);
  }

  try {
    const resp = await permissionStore.createSecurityGroup(formData.value);

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Security group created successfully."));
      utilStore.securityGroups.push({ ...formData.value });
      permissionStore.updateCurrentGroup({ ...formData.value });
      permissionStore.updateQuery({ queryString: '', showSelected: false });
      await permissionStore.checkAssociated();
      router.replace('/add-permissions');
    } else {
      throw resp.data;
    }
  } catch (err: any) {
    logger.error(err);
    if (err.response?.data?.error?.message) {
      commonUtil.showToast(err.response.data.error.message);
    } else {
      commonUtil.showToast(translate("Failed to create security group."));
    }
  }
};
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>
