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

<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonItem,
  IonIcon,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  modalController,
  alertController } from "@ionic/vue";
import { defineComponent } from "vue";
import { close, save } from "ionicons/icons";
import { useStore } from "@/store";
import { UserService } from "@/services/UserService";
import { hasError } from '@/adapter'
import { DateTime } from 'luxon';
import { translate } from "@hotwax/dxp-components";

export default defineComponent({
  name: "TimeZoneModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonSearchbar,
    IonSpinner,
    IonTitle,
    IonToolbar 
  },
  data() {
    return {
      queryString: '',
      filteredTimeZones: [],
      timeZones: [],
      timeZoneId: '',
      isLoading: false
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    async saveAlert() {
      const message = translate("Are you sure you want to change the time zone to?", { timeZoneId: this.timeZoneId });
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
              this.setUserTimeZone();
            }
          }
        ],
      });
      return alert.present();
    },
    preventSpecialCharacters($event: any) {
      // Searching special characters fails the API, hence, they must be omitted
      if(/[`!@#$%^&*()_+\-=\\|,.<>?~]/.test($event.key)) $event.preventDefault();
    },
    findTimeZone() { 
      const queryString = this.queryString.toLowerCase();
      this.filteredTimeZones = this.timeZones.filter((timeZone: any) => {
        return timeZone.id.toLowerCase().match(queryString) || timeZone.label.toLowerCase().match(queryString);
      });
    },
    async getAvailableTimeZones() {
      this.isLoading = true;
      const resp = await UserService.getAvailableTimeZones()
      if(resp.status === 200 && !hasError(resp)) {
        // We are filtering valid the timeZones coming with response here
        this.timeZones = resp.data.filter((timeZone: any) => {
          return DateTime.local().setZone(timeZone.id).isValid;
        });
        this.findTimeZone();
      }
      this.isLoading = false;
    },
    async selectSearchBarText(event: any) {
      const element = await event.target.getInputElement()
      element.select();
    },
    async setUserTimeZone() {
      await this.store.dispatch("user/setUserTimeZone", {
        "timeZoneId": this.timeZoneId
      })
      this.closeModal()
    }
  },
  beforeMount () {
    this.getAvailableTimeZones();
  },
  setup() {
    const store = useStore();
    return {
      close,
      save,
      store,
      translate
    };
  }
});
</script>