<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select facilities") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list>
      <ion-item v-for="facility in facilities" :key="facility.facilityId">
        <ion-label>
          {{ facility.facilityName }}
          <p>{{ facility.facilityId }}</p>
        </ion-label>
        <ion-checkbox slot="end" :checked="isSelected(facility.facilityId)" @ionChange="toggleFacilitySelection(facility)" />
      </ion-item>
    </ion-list>
  
    <ion-fab @click="saveFacilities()" vertical="bottom" horizontal="end" slot="fixed">
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
  name: "SelectFacilityModal",
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
  props: ["selectedFacilities"],
  data() {
    return {
      selectedFacilityValues: JSON.parse(JSON.stringify(this.selectedFacilities)),
    }
  },
  computed: {
    ...mapGetters({
      facilities: 'util/getFacilities'
    })
  },
  async mounted() {
    await this.store.dispatch('util/fetchFacilities');
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    saveFacilities() {
      // taking out the difference of selected facilities and the originally
      // user associated facilities for adding and removing facilities
      const facilitiesToAdd = this.selectedFacilityValues.filter((selectedFacility: any) => !this.selectedFacilities.some((facility: any) => facility.facilityId === selectedFacility.facilityId))
      const facilitiesToRemove = this.selectedFacilities.filter((facility: any) => !this.selectedFacilityValues.some((selectedFacility: any) => facility.facilityId === selectedFacility.facilityId))
      modalController.dismiss({
        dismissed: true,
        value: {
          selectedFacilities: this.selectedFacilityValues,
          facilitiesToAdd,
          facilitiesToRemove
        }
      });
    },
    toggleFacilitySelection(updatedFacility: any) {
      const selectedFacility = this.selectedFacilityValues.some((facility: any) => facility.facilityId === updatedFacility.facilityId);
      if (selectedFacility) {
        this.selectedFacilityValues = this.selectedFacilityValues.filter((facility: any) => facility.facilityId !== updatedFacility.facilityId);
      } else {
        this.selectedFacilityValues.push(updatedFacility);
      }
    },
    isSelected(facilityId: any) {
      return this.selectedFacilityValues.some((facility: any) => facility.facilityId === facilityId);
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

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>