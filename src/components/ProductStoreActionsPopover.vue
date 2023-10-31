<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getUserProductStoreName(productStore.productStoreId) }}</ion-list-header>
      <ion-item button @click="selectProductStore()">
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
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import { UtilService } from "@/services/UtilService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";
import { hasError } from "@hotwax/oms-api";

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
      getUserProductStoreName: 'util/getUserProductStoreName',
      getProductStoreRoleType: 'util/getProductStoreRoleType',
      userProductStores: 'util/getUserProductStores',
    })
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: {
          email: this.selectedUser.emailDetails?.email,
          userLoginId: this.selectedUser.userLoginId
        }
      });

      this.closePopover()
      return selectProductStoreModal.present();
    },
    async removeProductStoreRole() {
      try {
        const resp = await UtilService.updateProductStoreRole({
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
      await this.store.dispatch('util/getUserProductStores', this.selectedUser.partyId)
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