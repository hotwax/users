<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/users" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create user") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <h1 class="ion-margin-start">{{ translate('Create a new user') }}</h1>
        <ion-item>
          <ion-icon slot="start" :icon="desktopOutline"/>
          <ion-toggle :checked="isFacilityLogin" @ionChange="updateFacilityLogin" label-placement="start" justify="space-between">{{ translate("Facility login") }}</ion-toggle>
        </ion-item>
        <template v-if="isFacilityLogin">
          <ion-item>
            <ion-icon slot="start" :icon="businessOutline"/>
            <ion-select interface="popover" v-model="formData.facilityId" @ionChange="updateGroupName">
              <div slot="label">{{ translate("Select facility") }} <ion-text color="danger">*</ion-text></div>
              <ion-select-option v-for="facility in (facilities ? facilities : [])" :key="facility.facilityId" :value="facility.facilityId">{{ facility.facilityName || facility.facilityId }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input label-placement="floating">
              <div slot="label">{{ translate('Name') }} <ion-text color="danger">*</ion-text></div>
            </ion-input>
          </ion-item>
          <ion-item>
            <ion-input :label="translate('Reset password email')" label-placement="floating" v-model="formData.emailAddress" type="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input :label="translate('Facility contact number')" label-placement="floating" v-model="formData.contactNumber" type="tel"></ion-input>
          </ion-item>
        </template>
        <template v-else>
          <ion-item>
            <ion-input label-placement="floating" v-model="formData.firstName" autofocus>
              <div slot="label">{{ translate('First name') }} <ion-text color="danger">*</ion-text></div>
            </ion-input>
          </ion-item>
          <ion-item>
            <ion-input label-placement="floating" v-model="formData.lastName">
              <div slot="label">{{ translate('Last name') }} <ion-text color="danger">*</ion-text></div>
            </ion-input>
          </ion-item>

          <ion-item class="ion-margin-top">
            <ion-input :label="translate('Employee ID')" label-placement="floating" v-model="formData.externalId"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input :label="translate('Email')" label-placement="floating" v-model="formData.emailAddress" type="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input :label="translate('Phone number')" label-placement="floating" v-model="formData.contactNumber" type="tel"></ion-input>
          </ion-item>
        </template>
        <ion-button class="ion-margin-top" @click="createUser()">
          {{ translate("Create User") }}
          <ion-icon slot="end" :icon="arrowForwardOutline"/>
        </ion-button>
      </main>
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
  IonPage,
  IonText,
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
import logger from '@/logger';

export default defineComponent({
  name: "CreateUser",
  components: {
    IonBackButton,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonPage,
    IonText,
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
        facilityId: '',
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
        facilityId: '',
        externalId: '',
        emailAddress: '',
        contactNumber: '',
      }
    },
    updateFacilityLogin(event: CustomEvent) {
      this.clearFormData()
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
        if (this.isFacilityLogin && !data.facilityId) {
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
          logger.error(errorMessages);
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
          if (partyTypeId === "PARTY_GROUP" ) {
            await UserService.addPartyToFacility({"partyId": partyId, "facilityId": payload.facilityId, "roleTypeId": "WAREHOUSE_MANAGER"});
          }
          this.$router.replace({ path: `/user-confirmation/${partyId}` })
        } else {
          throw resp.data;
        }
      } catch (err:any) {
        let errorMessage = translate('Failed to create user.');
        if (err?.response?.data?.error?.message) {
          errorMessage = err.response.data.error.message
        }
        logger.error('error', err)
        showToast(errorMessage);
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

<style scoped>

  @media (min-width: 700px) {
    main {
      max-width: 375px;
      margin: auto;
    }
  }

</style>