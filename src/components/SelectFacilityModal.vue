<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select facilities") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list>
      <ion-item v-for="facility in facilities" :key="facility.facilityId" :value="facility.facilityId" @click="updateSelectedFacilities(facility)">
        <ion-label>
          <h2>{{ facility.facilityName }}</h2>
          <p>{{ facility.facilityId }}</p>
        </ion-label>
        <ion-checkbox :checked="isChecked(facility.facilityId )"/>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="confirmSave">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
import { 
  alertController,
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
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { showToast } from "@/utils";
import { translate } from '@hotwax/dxp-components'
import { UtilService } from "@/services/UtilService";

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
  computed: {
    ...mapGetters({
      facilities: 'util/getFacilities',
      selectedUser: 'user/getSelectedUser',
    })
  },
  async mounted() {
    await this.store.dispatch('util/fetchFacilities')
    this.selectedFacilities = JSON.parse(JSON.stringify(this.selectedUser.facilities))
  },
  data () {
    return {
      selectedFacilities: [] as any
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    isChecked(facilityId: string) {
      return this.selectedFacilities.some((facility: any) => facility.facilityId === facilityId)
    },
    isFacilityAssociatedWithUser(facilityId: string) {
      return this.selectedUser.facilities.some((facility: any) => facility.facilityId === facilityId)
    },
    updateSelectedFacilities(facility: any) {
      const isFacilityChecked = this.selectedFacilities.find((selectedFacility: any) => selectedFacility.facilityId === facility.facilityId)
      if (!isFacilityChecked) {
        this.selectedFacilities.push(facility)
      } else {
        this.selectedFacilities = this.selectedFacilities.filter((selectedFacility: any) => selectedFacility.facilityId !== facility.facilityId)
      }
    },
    async confirmSave() {
      const message = 'Are you sure you want to perform this action?'
      const alert = await alertController.create({
        header: translate("Update user facilities"),
        message: translate(message),
        buttons: [
          {
            text: translate("No"),
          },
          {
            text: translate("Yes"),
            handler: async () => {
              await this.updateUserAssociatedFacilities();
            }
          }
        ],
      });
      return alert.present();
    },
    async updateUserAssociatedFacilities() {
      // taking out the difference of selected facilities and the originally
      // user associated facilities for adding and removing facilities
      const facilitiesToAdd = this.selectedFacilities.filter((selectedFacility: any) => !this.selectedUser.facilities.some((facility: any) => facility.facilityId === selectedFacility.facilityId))
      const facilitiesToRemove = this.selectedUser.facilities.filter((facility: any) => !this.selectedFacilities.some((selectedFacility: any) => facility.facilityId === selectedFacility.facilityId))
      const removeResponses = await Promise.allSettled(facilitiesToRemove
        .map(async (payload: any) => await UtilService.removePartyFromFacility({
          partyId: this.selectedUser.partyId,
          facilityId: payload.facilityId,
          roleTypeId: payload.roleTypeId,
          fromDate: payload.fromDate,
        }))
      )

      const createResponses = await Promise.allSettled(facilitiesToAdd
        .map(async (payload: any) => await UtilService.addPartyToFacility({
          partyId: this.selectedUser.partyId,
          facilityId: payload.facilityId,
          roleTypeId: 'WAREHOUSE_MANAGER',
        }))
      )

      const hasError = [...removeResponses, ...createResponses].some((response: any) => response.status === 'rejected')
      if (hasError) {
        showToast(translate('Failed to update some association(s).'))
      } else {
        showToast(translate('Facility associations updated successfully.'))
      }
      // refetching updated associated facilities
      const userFacilities = await this.store.dispatch('util/getUserAssociatedFacilities', this.selectedUser.partyId)
      this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, facilities: userFacilities })
      this.closeModal();
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
