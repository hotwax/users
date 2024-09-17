<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ productStore.storeName || productStore.productStoreId }}</ion-list-header>
      <ion-item>
        <ion-label>
          {{ getDateTime(productStore.fromDate) }}
          <p>{{ translate('added to product store') }}</p>
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
  name: "ProductStoreActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ['productStore'],
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      userProductStores: 'user/getUserProductStores',
    })
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    getDateTime(time: any) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
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