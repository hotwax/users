<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/users" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create user") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h2>{{ translate('Create a new user') }}</h2>
      <ion-item>
        <ion-icon slot="start" :icon="desktopOutline"/>
        <ion-label>
          {{ translate("Facility login") }}
        </ion-label>
        <ion-toggle :checked="isFacilityLogin" @ionChange="updateFacilityLogin" slot="end" />
      </ion-item>
      <div v-if="isFacilityLogin">
        <ion-item>
          <ion-icon slot="start" :icon="businessOutline"/>
          <ion-label>
            {{ translate("Select facility") }}
          </ion-label>
          <ion-select interface="popover" v-model="formData.externalId" @ionChange="updateGroupName">
            <ion-select-option v-for="facility in (facilities ? facilities : [])" :key="facility.facilityId" :value="facility.facilityId">{{ facility.facilityName }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Name') }}</ion-label>
          <ion-input v-model="formData.groupName" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Reset password email') }}</ion-label>
          <ion-input v-model="formData.emailAddress" type="email" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Facility contact number') }}</ion-label>
          <ion-input v-model="formData.contactNumber" type="tel" :clear-input="true"></ion-input>
        </ion-item>
      </div>
      <div v-else>
        <ion-item>
          <ion-label position="floating">{{ translate('First name') }}</ion-label>
          <ion-input v-model="formData.firstName" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Last name') }}</ion-label>
          <ion-input v-model="formData.lastName" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Employee ID') }}</ion-label>
          <ion-input v-model="formData.externalId" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Email') }}</ion-label>
          <ion-input v-model="formData.emailAddress" type="email" :clear-input="true"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Phone number') }}</ion-label>
          <ion-input v-model="formData.contactNumber" type="tel" :clear-input="true"></ion-input>
        </ion-item>
      </div>
      <div class="ion-padding-top">
        <ion-button @click="createUser()">
          <ion-icon slot="end" :icon="arrowForwardOutline"/>
          {{ translate("Create User") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonToggle,
  IonInput,
  IonSelect,
  IonSelectOption
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import {
  businessOutline,
  desktopOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { showToast, isValidEmail } from '@/utils'
import { UserService } from '@/services/UserService'
import { hasError } from '@/adapter'

export default defineComponent({
  name: "CreateUser",
  components: {
    IonBackButton,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonTitle,
    IonToolbar,
    IonToggle,
    IonInput,
    IonSelect,
    IonSelectOption
  },
  computed: {
    ...mapGetters({
      facilities: 'util/getFacilities'
    })
  },
  data() {
    return {
      isFacilityLogin: false,
      formData: {
        firstName: '',
        lastName: '',
        groupName: '',
        externalId: '',
        emailAddress: '',
        contactNumber: '',
      }
    }
  },
  async ionViewWillEnter() {
    this.clearFormData()
    await this.store.dispatch('util/fetchFacilities')
  },
  methods: {
    clearFormData() {
      this.formData = {
        firstName: '',
        lastName: '',
        groupName: '',
        externalId: '',
        emailAddress: '',
        contactNumber: '',
      }
    },
    updateFacilityLogin(event: CustomEvent) {
      this.isFacilityLogin = event.detail.checked;
    },
    updateGroupName(event: CustomEvent) {
      const selectedFacilityId = event.detail.value;
      const selectedFacility = this.facilities.find((facility: any) => facility.facilityId === selectedFacilityId);
      this.formData.groupName = selectedFacility?.facilityName ? selectedFacility?.facilityName : selectedFacilityId;
    },
    validateCreateUserDetail (data: any) {
      const validationErrors = [];
      if (data.partyTypeId === 'PARTY_GROUP') {
        if (!data.groupName) {
          validationErrors.push(translate('Name is required.'));
        }
        if (this.isFacilityLogin && !data.externalId) {
          validationErrors.push(translate('Facility is required.'));
        }
      } else {
        if (!data.firstName) {
          validationErrors.push(translate('First name is required.'));
        }
        if (!data.lastName) {
          validationErrors.push(translate('Last name is required.'));
        }
      }
      if (data.emailAddress && !isValidEmail(data.emailAddress)) {
        validationErrors.push(translate('Invalid email address.'));
      }
      return validationErrors; 
    },
    async createUser() {
      let partyTypeId = this.isFacilityLogin ? "PARTY_GROUP" : "PERSON";
      
      try {
        const validationErrors = this.validateCreateUserDetail({...this.formData, partyTypeId});
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.join(" ");
          console.error(errorMessages);
          showToast(translate(errorMessages));
          return;
        }

        const payload = {
          ...this.formData,
          partyTypeId,
          "partyIdFrom": "COMPANY",
          "roleTypeIdFrom": "INTERNAL_ORGANIZATIO",
          "roleTypeIdTo": "APPLICATION_USER",
          "partyRelationshipTypeId": "EMPLOYMENT",
        }

        const resp = await UserService.createUser(payload);
        if (resp.status === 200 && !hasError(resp) && resp.data.partyId) {
          const partyId = resp.data.partyId;
          this.$router.replace({ path: `/user-confirmation/${partyId}` })
        } else {
          throw resp.data;
        }
      } catch (err) {
        console.error('error', err)
        showToast(translate('Failed to create user.'))
      }
    },
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      store,
      router,
      businessOutline,
      desktopOutline,
      arrowForwardOutline,
      translate
    };
  }
});
</script>