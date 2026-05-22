<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon :icon="close" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select time zone") }}</ion-title>
    </ion-toolbar>
    <ion-toolbar>
      <ion-searchbar @ionFocus="selectSearchBarText($event)" :placeholder="translate('Search time zones')"  v-model="queryString" @keyup.enter="queryString = $event.target.value; findTimeZone()" @keydown="preventSpecialCharacters($event)" />
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <!-- Empty state -->
    <div class="empty-state" v-if="isLoading">
      <ion-item lines="none">
        <ion-spinner color="secondary" name="crescent" slot="start" />
        {{ translate("Fetching time zones") }}
      </ion-item>
    </div>
    <div class="empty-state" v-else-if="filteredTimeZones.length === 0">
      <p>{{ translate("No time zone found") }}</p>
    </div>

    <!-- Timezones -->
    <div v-else>
      <ion-list>
        <ion-radio-group value="rd" v-model="timeZoneId">
          <ion-item :key="timeZone.id" v-for="timeZone in filteredTimeZones">
            <ion-radio label-placement="end" justify="start" :value="timeZone.id">
              {{ timeZone.label }} ({{ timeZone.id }})
            </ion-radio>
          </ion-item>
        </ion-radio-group>
      </ion-list>
    </div>
    
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!timeZoneId" @click="saveAlert">
        <ion-icon :icon="save" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { IonButtons, IonButton, IonContent, IonFab, IonFabButton, IonHeader, IonItem, IonIcon, IonList, IonRadioGroup, IonRadio, IonSearchbar, IonSpinner, IonTitle, IonToolbar, modalController, alertController } from "@ionic/vue";
import { close, save } from "ionicons/icons";
import { UserService } from "@/services/UserService";
import { DateTime } from 'luxon';
import { commonUtil, translate } from "@common";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();

const queryString = ref('');
const filteredTimeZones = ref<any[]>([]);
const timeZones = ref<any[]>([]);
const timeZoneId = ref('');
const isLoading = ref(false);

const closeModal = () => {
  modalController.dismiss({ dismissed: true });
};

const saveAlert = async () => {
  const message = translate("Are you sure you want to change the time zone to?", { timeZoneId: timeZoneId.value });
  const alert = await alertController.create({
    header: translate("Update time zone"),
    message,
    buttons: [
      {
        text: translate("Cancel"),
      },
      {
        text: translate("Confirm"),
        handler: () => {
          setUserTimeZone();
        }
      }
    ],
  });
  return alert.present();
};

const preventSpecialCharacters = ($event: any) => {
  // Searching special characters fails the API, hence, they must be omitted
  if(/[`!@#$%^&*()_+\-=\\|,.<>?~]/.test($event.key)) $event.preventDefault();
};

const findTimeZone = () => { 
  const query = queryString.value.toLowerCase();
  filteredTimeZones.value = timeZones.value.filter((timeZone: any) => {
    return timeZone.id.toLowerCase().match(query) || timeZone.label.toLowerCase().match(query);
  });
};

const getAvailableTimeZones = async () => {
  isLoading.value = true;
  const resp = await UserService.getAvailableTimeZones();
  if (resp.status === 200 && !commonUtil.hasError(resp)) {
    // We are filtering valid the timeZones coming with response here
    timeZones.value = resp.data.filter((timeZone: any) => {
      return DateTime.local().setZone(timeZone.id).isValid;
    });
    findTimeZone();
  }
  isLoading.value = false;
};

const selectSearchBarText = async (event: any) => {
  const element = await event.target.getInputElement();
  element.select();
};

const setUserTimeZone = async () => {
  await userStore.setUserTimeZone(timeZoneId.value);
  closeModal();
};

onBeforeMount(() => {
  getAvailableTimeZones();
});
</script>
