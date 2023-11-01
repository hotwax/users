<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ productStore.storeName }}</ion-list-header>
      <ion-item button @click="selectProductStoreRole()">
        {{ translate("Edit role") }}
      </ion-item>
      <!-- <ion-item button>
        {{ translate("View product store") }}
      </ion-item> -->
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
  modalController,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from 'vuex';
import ProductStoreRoleModal from '@/components/ProductStoreRoleModal.vue'
import { UserService } from "@/services/UserService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";
import { hasError } from "@/adapter";

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
      getProductStoreRoleType: 'util/getProductStoreRoleType',
      userProductStores: 'user/getUserProductStores',
    })
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    async selectProductStoreRole() {
      const selectProductStoreRoleModal = await modalController.create({
        component: ProductStoreRoleModal,
      });

      this.closePopover()
      return selectProductStoreRoleModal.present();
    },
    async removeProductStoreRole() {
      try {
        const resp = await UserService.updateProductStoreRole({
          partyId: this.selectedUser.partyId,
          productStoreId: this.productStore.productStoreId,
          roleTypeId: this.getProductStoreRoleType(this.productStore.productStoreId),
          fromDate: this.userProductStores.find((store: any) => this.productStore.productStoreId === store.productStoreId).fromDate,
          thruDate: DateTime.now().toMillis()
        })
        if (hasError(resp)) throw resp.data
        showToast(translate('Role removed successfully.'))
      } catch (error) {
        showToast(translate('Something went wrong.'));
        console.error(error)
      }
      // refetching product stores with updated roles
      const userProductStores = await this.store.dispatch('user/getUserProductStores', this.selectedUser.partyId)
      this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, productStores: userProductStores })
      this.closePopover()
    },
    async confirmRemove() {
      const message = 'Are you sure you want to perform this action?'
      const alert = await alertController.create({
        header: translate("Remove product store role"),
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