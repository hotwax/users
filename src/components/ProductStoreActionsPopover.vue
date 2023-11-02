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
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
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
      userProductStores: 'user/getUserProductStores',
    })
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    async selectProductStoreRole() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { selectedProductStores: this.userProductStores }
      });

      selectProductStoreModal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.value) {
          const productStoresToCreate = result.data.value.productStoresToCreate
          const productStoresToRemove = result.data.value.productStoresToRemove

          const updateResponses = await Promise.allSettled(productStoresToRemove
            .map(async (payload: any) => await UserService.updateProductStoreRole({
              partyId: this.selectedUser.partyId,
              productStoreId: payload.productStoreId,
              roleTypeId: payload.roleTypeId,
              fromDate: this.userProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
              thruDate: DateTime.now().toMillis()
            }))
          )

          // explicitly calling ensurePartyRole (ensurePartyRole) as addToPartyTole
          // and removeFromPartyRole are running in parallel on the server causing issues
          if (productStoresToCreate.length) {
            try {
              const resp = await UserService.ensurePartyRole({
                partyId: this.selectedUser.partyId,
                roleTypeId: "APPLICATION_USER",
              })
              if (hasError(resp)) {
                showToast(translate('Something went wrong.'));
                throw resp.data
              }
            } catch (error) {
              console.error(error)
              return
            }
          }

          const createResponses = await Promise.allSettled(productStoresToCreate
            .map(async (payload: any) => await UserService.createProductStoreRole({
              productStoreId: payload.productStoreId,
              partyId: this.selectedUser.partyId,
              roleTypeId: "APPLICATION_USER",
            }))
          )

          const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some role(s).'))
          } else {
            showToast(translate('Role(s) updated successfully.'))
          }
          // refetching product stores with updated roles
          const userProductStores = await UserService.getUserProductStores(this.selectedUser.partyId)
          this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, productStores: userProductStores })
        }
      })

      this.closePopover()
      return selectProductStoreModal.present();
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
        console.error(error)
      }
      // refetching product stores with updated roles
      const userProductStores = await UserService.getUserProductStores(this.selectedUser.partyId)
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