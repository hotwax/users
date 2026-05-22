<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ productStore.storeName || productStore.productStoreId }}</ion-list-header>
      <ion-item button @click="redirectToStore()" :disabled="!omsRedirectionInfo.url">
        <ion-label>
          {{ translate("View product store") }}
        </ion-label>
      </ion-item>
      <ion-item button @click="confirmRemove()" lines="none">
        {{ translate("Remove") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { alertController, IonContent, IonItem, IonLabel, IonList, IonListHeader, popoverController } from "@ionic/vue";
import { commonUtil, logger, translate } from '@common';
import { useUserStore } from "@/store/user";
import { UserService } from "@/services/UserService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";

const props = defineProps({
  productStore: {
    type: Object,
    required: true
  }
});

const userStore = useUserStore();

const selectedUser = computed(() => userStore.selectedUser);
const userProductStores = computed(() => userStore.getUserProductStores);
const omsRedirectionInfo = computed(() => userStore.getOmsRedirectionInfo);

const closePopover = () => {
  popoverController.dismiss();
};

const removeProductStoreRole = async () => {
  try {
    const resp = await UserService.updateProductStoreRole({
      partyId: selectedUser.value.partyId,
      productStoreId: props.productStore.productStoreId,
      roleTypeId: props.productStore.roleTypeId,
      fromDate: userProductStores.value.find((store: any) => props.productStore.productStoreId === store.productStoreId).fromDate,
      thruDate: DateTime.now().toMillis()
    });
    if (commonUtil.hasError(resp)) throw resp.data;
    showToast(translate('Role removed successfully.'));
  } catch (error) {
    showToast(translate('Something went wrong.'));
    logger.error(error);
  }
  
  const updatedUserProductStores = await UserService.getUserProductStores(selectedUser.value.partyId);
  userStore.updateSelectedUser({ ...selectedUser.value, productStores: updatedUserProductStores });
  closePopover();
};

const confirmRemove = async () => {
  const message = 'Are you sure you want to perform this action?';
  const alert = await alertController.create({
    header: translate("Remove product store"),
    message: translate(message),
    buttons: [
      {
        text: translate("No"),
      },
      {
        text: translate("Yes"),
        handler: async () => {
          await removeProductStoreRole();
        }
      }
    ],
  });
  return alert.present();
};

const redirectToStore = () => {
  const companyDetailUrl = `${import.meta.env.VITE_COMPANY_LOGIN_URL}?oms=${omsRedirectionInfo.value.url}&token=${commonUtil.getToken()}&expirationTime=${commonUtil.getTokenExpiration()}&omsRedirectionUrl=${commonUtil.getOMSInstanceName()}&productStoreId=${props.productStore.productStoreId}`;
  window.open(companyDetailUrl, "_blank");
};
</script>
