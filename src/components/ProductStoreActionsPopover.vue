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
import { translate, useAuthStore } from "@hotwax/dxp-components";
import { mapGetters, useStore } from 'vuex';
import { UserService } from "@/services/UserService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from '@/logger';

export default defineComponent({
  name: "ProductStoreActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader
  },
  props: ['productStore'],
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      userProductStores: 'user/getUserProductStores',
      omsRedirectionInfo: 'user/getOmsRedirectionInfo',
    })
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    async removeProductStoreRole() {
      try {
        const resp = await UserService.updateProductStoreRole({
          partyId: this.selectedUser.partyId,
          productStoreId: this.productStore.productStoreId,
          roleTypeId: this.productStore.roleTypeId,
          fromDate: this.userProductStores.find((store: any) => this.productStore.productStoreId === store.productStoreId).fromDate,
          thruDate: DateTime.now().toMillis()
        })
        if (hasError(resp)) throw resp.data
        showToast(translate('Role removed successfully.'))
      } catch (error) {
        showToast(translate('Something went wrong.'));
        logger.error(error)
      }
      // refetching product stores with updated roles
      const userProductStores = await UserService.getUserProductStores(this.selectedUser.partyId)
      this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, productStores: userProductStores })
      this.closePopover()
    },
    async confirmRemove() {
      const message = 'Are you sure you want to perform this action?'
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
              await this.removeProductStoreRole();
            }
          }
        ],
      });
      return alert.present();
    },
    redirectToStore() {
      const companyDetailUrl = `${process.env.VUE_APP_COMPANY_LOGIN_URL}?oms=${this.omsRedirectionInfo.url}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}&omsRedirectionUrl=${this.authStore.getOms}&productStoreId=${this.productStore.productStoreId}`
      window.open(companyDetailUrl, "_blank");
    }
  },
  setup() {
    const authStore = useAuthStore();
    const store = useStore();

    return {
      authStore,
      store,
      translate
    }
  }
});
</script>