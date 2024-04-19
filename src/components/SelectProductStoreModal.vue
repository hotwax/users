<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select product stores") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  
  <ion-content>
    <ion-list>
      <ion-item v-for="productStore in productStores" :key="productStore.productStoreId">
        <ion-checkbox :checked="isSelected(productStore.productStoreId)" @ionChange="toggleProductStoreSelection(productStore)">
          <ion-label>
            {{ productStore.storeName || productStore.productStoreId }}
            <p>{{ productStore.productStoreId }}</p>
          </ion-label>
        </ion-checkbox>
      </ion-item>
    </ion-list>
  
    <ion-fab @click="saveProductStores()" vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button>
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "SelectProductStoreModal",
  components: { 
    IonButtons,
    IonButton,
    IonCheckbox,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  props: ["selectedProductStores"],
  data() {
    return {
      selectedProductStoreValues: JSON.parse(JSON.stringify(this.selectedProductStores)),
    }
  },
  computed: {
    ...mapGetters({
      productStores: 'util/getProductStores'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    saveProductStores() {
      const productStoresToCreate = this.selectedProductStoreValues.filter((selectedStore: any) => !this.selectedProductStores.some((store: any) => store.productStoreId === selectedStore.productStoreId))
      const productStoresToRemove = this.selectedProductStores.filter((store: any) => !this.selectedProductStoreValues.some((selectedStore: any) => store.productStoreId === selectedStore.productStoreId))

      modalController.dismiss({
        dismissed: true,
        value: {
          selectedProductStores: this.selectedProductStoreValues,
          productStoresToCreate,
          productStoresToRemove
        }
      });
    },
    toggleProductStoreSelection(updatedStore: any) {
      let selectedStore = this.selectedProductStoreValues.some((store :any) => store.productStoreId === updatedStore.productStoreId);
      if (selectedStore) {
        this.selectedProductStoreValues = this.selectedProductStoreValues.filter((store :any) => store.productStoreId !== updatedStore.productStoreId);
      } else {
        this.selectedProductStoreValues.push(updatedStore);
      }
    },
    isSelected (productStoreId: any) {
      return this.selectedProductStoreValues.some((productStore :any) => productStore.productStoreId === productStoreId);
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
    