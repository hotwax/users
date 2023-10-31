<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select product stores") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <div v-if="!productStores.length" class="ion-text-center ion-margin-top">
      {{ translate('No product stores found') }}
    </div>
    <ion-list v-else>
      <ion-item v-for="store in productStores" :key='store.productStoreId' :value="store.productStoreId">
        <ion-label>
          <h2>{{ store.storeName }}</h2>
          <p>{{ store.productStoreId }}</p>
        </ion-label>
        <ion-select interface="popover" :value="getProductStoreRoleType(store.productStoreId)" @ionChange="setProductStoreRole($event, store.productStoreId)">
          <ion-select-option v-for="role in roles" :key="role.roleTypeId" :value="role.roleTypeId">
            {{ role.description }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
    
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="confirmSave" :disabled="!productStoresToCreateUpdate.create.length && !productStoresToCreateUpdate.update.length">
        <ion-icon :icon="saveOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
  alertController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { showToast } from "@/utils";
import { translate } from '@hotwax/dxp-components'
import { UtilService } from "@/services/UtilService";
import { DateTime } from "luxon";

export default defineComponent({
  name: "ProductStoreRoleModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      roles: 'util/getRoles',
      selectedUser: 'user/getSelectedUser',
      productStores: 'util/getProductStores',
      userProductStores: 'util/getUserProductStores',
      getProductStoreRoleType: 'util/getProductStoreRoleType',
    })
  },
  data() {
    return {
      productStoresToCreateUpdate: {
        create: [],
        update: []
      } as any
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    setProductStoreRole(event: CustomEvent, productStoreId: string) {
      // TODO return if set and current roles are same
      const currentRoleTypeId = this.getProductStoreRoleType(productStoreId)
      let createIndex: number, updateIndex: number
      // 'create' case if it was previously 'none' 
      if (currentRoleTypeId === 'none') {
        createIndex = this.productStoresToCreateUpdate.create.findIndex((store: any) => store.productStoreId === productStoreId)
        this.updateProductStoresToUpdate(createIndex, 'create', productStoreId, event.detail.value)
      } else {
        updateIndex = this.productStoresToCreateUpdate.update.findIndex((store: any) => store.productStoreId === productStoreId)
        this.updateProductStoresToUpdate(updateIndex, 'update', productStoreId, event.detail.value, currentRoleTypeId) // required in update service
      }
    },
    updateProductStoresToUpdate(index: number, type: string, productStoreId: string, roleTypeId: string, currentRoleTypeId?: string) {
      if (index === -1) {
        type === 'create'
        ? this.productStoresToCreateUpdate.create.push({
          partyId: this.selectedUser.partyId,
          productStoreId,
          roleTypeId
        }) : this.productStoresToCreateUpdate.update.push({
          partyId: this.selectedUser.partyId,
          productStoreId,
          roleTypeId,
          currentRoleTypeId
        })
      } else {
        type === 'create'
        ? this.productStoresToCreateUpdate.create[index] = {
          partyId: this.selectedUser.partyId,
          productStoreId,
          roleTypeId
        } : this.productStoresToCreateUpdate.update[index] = {
          partyId: this.selectedUser.partyId,
          productStoreId,
          roleTypeId,
          currentRoleTypeId
        }
      }
    },
    async updateProductStoresRole() {
      const updateResponses = await Promise.allSettled(this.productStoresToCreateUpdate.update
        .map(async (payload: any) => await UtilService.updateProductStoreRole({
          partyId: payload.partyId,
          productStoreId: payload.productStoreId,
          roleTypeId: payload.currentRoleTypeId,
          fromDate: this.userProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
          thruDate: DateTime.now().toMillis()
        }))
      )
      const createResponses = await Promise.allSettled(
        [...this.productStoresToCreateUpdate.create, ...this.productStoresToCreateUpdate.update]
          .map(async (payload: any) => {
            delete payload.currentRoleTypeId // removing currentRoleTypeId as its not required for 'create' call
            await UtilService.createProductStoreRole(payload)
          })
      )
      const hasError = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
      if (hasError) {
        showToast(translate('Failed to update some role(s).'))
      } else {
        showToast(translate('Role(s) updated successfully.'))
      }
      // refetching product stores with updated roles
      await this.store.dispatch('util/fetchUserProductStores', this.selectedUser.partyId)
      this.closeModal();
    },
    async confirmSave() {
      const message = 'Are you sure you want to perform this action?'
      const alert = await alertController.create({
        header: translate("Update product store role"),
        message: translate(message),
        buttons: [
          {
            text: translate("No"),
          },
          {
            text: translate("Yes"),
            handler: async () => {
              await this.updateProductStoresRole();
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
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>
