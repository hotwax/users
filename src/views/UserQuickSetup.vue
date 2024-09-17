<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/create-user" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create user") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <ion-item class="ion-margin-bottom" v-if="!isFacilityLogin()">
          <ion-icon slot="start" :icon="documentTextOutline"/>
          <ion-select :label="translate('Select template')" interface="popover" v-model="userTemplateId" @ionChange="updateUserTemplate">
            <ion-select-option v-for="userTemplate in userTemplates" :key="userTemplate.templateId" :value="userTemplate.templateId">{{ userTemplate.templateName }}</ion-select-option>
          </ion-select>
        </ion-item>
        <template v-if="(selectedUserTemplate && selectedUserTemplate.isUserLoginRequired || isFacilityLogin())">
          <ion-item>
            <ion-input label-placement="floating" v-model="formData.userLoginId">
              <div slot="label">{{ translate('Username') }} <ion-text color="danger">*</ion-text></div>
            </ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-input 
              ref="password"
              label-placement="floating" 
              v-model="formData.currentPassword" 
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password" 
              @ionInput="validatePassword" 
              @ionBlur="markPasswordTouched"
              :helper-text="translate('Password should be at least 5 characters long and contain at least one number, alphabet and special character.')"
              :error-text="translate('Password should be at least 5 characters long and contain at least one number, alphabet and special character.')"
            >
              <div slot="label">{{ translate("Password") }} <ion-text color="danger">*</ion-text></div>
              <ion-button @click="showPassword = !showPassword" slot="end" fill="clear">
                <ion-icon :icon="showPassword ? eyeOutline : eyeOffOutline" slot="icon-only" />
              </ion-button>
            </ion-input>
          </ion-item>
          <ion-item>
            <ion-input label-placement="floating" v-model="formData.emailAddress">
              <div slot="label">{{ isFacilityLogin() ? translate('Reset password email') : translate('Email') }} <ion-text v-if="selectedUserTemplate.templateId !== 'INTEGRATION'" color="danger">*</ion-text></div>
            </ion-input>
          </ion-item>
          <ion-item ion-margin-top>
            <ion-toggle :disabled="selectedUserTemplate.isPasswordChangeDisabled" :checked="formData.requirePasswordChange" label-placement="start" justify="space-between">
              {{ translate("Require password reset on login") }}
            </ion-toggle>
          </ion-item>
        </template>
        <ion-item v-if="selectedUserTemplate && selectedUserTemplate.isEmployeeIdRequired && !isFacilityLogin()">
          <ion-input :label="translate('Employee ID')" label-placement="floating" v-model="formData.externalId"></ion-input>
        </ion-item>

        <ion-item v-if="selectedUserTemplate && selectedUserTemplate.isProductStoreRequired && !isFacilityLogin()">
          <ion-label>
            {{ translate("Product stores") }}
          </ion-label>
          <ion-button slot="end" @click="addProductStores()">
            {{ translate("selected", {storeCount: selectedProductStores ? selectedProductStores.length : 0}) }}
          </ion-button>
        </ion-item>

        <ion-list v-if="(selectedUserTemplate && selectedUserTemplate.isFacilityRequired) || isFacilityLogin()">
          <ion-list-header>
            <ion-label>{{ translate('Select Facilities') }}</ion-label>
            <ion-button fill="clear" @click="addFacilities()">
              {{ translate(selectedFacilities.length ? "Manage" : "Add") }}
              <ion-icon slot="end" :icon="selectedFacilities.length ? settingsOutline : addCircleOutline"></ion-icon>
            </ion-button>
          </ion-list-header>
          <ion-item v-for="facility in selectedFacilities" :key="facility.facilityId">
            <template v-if="!isFacilityLogin()">
              <ion-label>
                {{ facility.facilityName || facility.facilityId }}
                <p>{{ facility.facilityId }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" color="danger" @click="toggleFacilitySelection(facility)">
                <ion-icon :icon="closeOutline" slot="icon-only" />
              </ion-button>
            </template>
            <ion-label v-else>
              {{ facility.facilityName || facility.facilityId }}
              <p>{{ facility.facilityId }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="actions ion-margin-top">
          <ion-button @click="finishSetup()">
            {{ translate("Finish setup") }}
            <ion-icon slot="end" :icon="arrowForwardOutline"/>
          </ion-button>
          <ion-button class="ion-margin-top" fill="outline" size="small" @click="confirmSetupManually()">
            {{ translate("Setup manually") }}
          </ion-button>
          <ion-button color="medium" fill="outline" size="small" @click="finishAndCreateNewUser()">
            {{ translate("Finish and create new user") }}
          </ion-button>
        </div>
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  alertController,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import {
  addCircleOutline,
  arrowForwardOutline,
  caretDownOutline,
  closeOutline,
  documentTextOutline,
  eyeOffOutline,
  eyeOutline,
  settingsOutline
} from 'ionicons/icons';
import { copyToClipboard, showToast, isValidPassword, isValidEmail } from '@/utils'
import { translate } from "@hotwax/dxp-components";
import { UserService } from '@/services/UserService'
import SelectFacilityModal from '@/components/SelectFacilityModal.vue'
import SelectProductStoreModal from "@/components/SelectProductStoreModal.vue";
import logger from '@/logger';

export default defineComponent({
  name: "UserConfirmation",
  components: {
    IonBackButton,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      productStores: 'util/getProductStores',
      allFacilities: 'util/getFacilities'
    })
  },
  props: ['partyId'],
  data() {
    return {
      userTemplateId: "FULFILLMENT",
      selectedUserTemplate: {} as any,
      selectedFacilities: [] as any,
      selectedProductStores: [] as any,
      showPassword: false,
      formData: {
        userLoginId: '',
        currentPassword: '',
        emailAddress: '',
        externalId: '',
        requirePasswordChange: true,
      },
      userTemplates: [
        {
          "templateId": "ADMIN",
          "templateName": "Admin",
          "securityGroupId": "COMMERCE_SUPER",
          "roleTypeId": "",
          "isUserLoginRequired": true,
          "isFacilityRequired": false,
          "facilityRoleTypeId": "",
          "isProductStoreRequired": true,
          "productStoreRoleTypeId": "APPLICATION_USER",
        },
        {
          "templateId": "MERCHANDISING_MANAGER",
          "templateName": "Merchandising manager",
          "securityGroupId": "MERCHANDISE_MGR",
          "roleTypeId": "",
          "isUserLoginRequired": true,
          "isFacilityRequired": false,
          "facilityRoleTypeId": "",
          "isProductStoreRequired": true,
          "productStoreRoleTypeId": "APPLICATION_USER",
        },
        {
          "templateId": "CSR",
          "templateName": "CSR",
          "securityGroupId": "CSR",
          "roleTypeId": "",
          "isUserLoginRequired": true,
          "isFacilityRequired": false,
          "facilityRoleTypeId": "",
          "isProductStoreRequired": false,
          "productStoreRoleTypeId": "",
        },
        {
          "templateId": "FULFILLMENT_MANAGER",
          "templateName": "Fulfillment manager",
          "securityGroupId": "STORE_MANAGER",
          "roleTypeId": "WAREHOUSE_PICKER",
          "isUserLoginRequired": true,
          "isEmployeeIdRequired": true,
          "isFacilityRequired": true,
          "facilityRoleTypeId": "WAREHOUSE_MANAGER",
          "isProductStoreRequired": false,
          "productStoreRoleTypeId": ""
        },
        {
          "templateId": "FULFILLMENT",
          "templateName": "Fulfillment",
          "securityGroupId": "",
          "roleTypeId": "WAREHOUSE_PICKER",
          "isEmployeeIdRequired": true,
          "isFacilityRequired": false,
          "facilityRoleTypeId": "",
          "isProductStoreRequired": false,
          "productStoreRoleTypeId": ""
        },
        {
          "templateId": "INTEGRATION",
          "templateName": "Integration",
          "securityGroupId": "INTEGRATION",
          "roleTypeId": "",
          "isUserLoginRequired": true,
          "isEmployeeIdRequired": false,
          "isFacilityRequired": false,
          "isPasswordChangeRequired": false,
          "isPasswordChangeDisabled": true,
          "facilityRoleTypeId": "",
          "isProductStoreRequired": false,
          "productStoreRoleTypeId": ""
        }
      ]
    }
  },
  created() {
    //Initially all product store comes selected
    this.selectedProductStores = this.productStores;

    if (!this.isFacilityLogin()) {
      // Set selectedUserTemplate to the default value "FULFILLMENT" on component creation
      this.selectedUserTemplate = this.userTemplates.find(template => template.templateId === this.userTemplateId);
    }

  },
  async ionViewWillEnter() {
    this.clearFormData()
    await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId });
    await this.store.dispatch('util/fetchFacilities');
    await this.store.dispatch('util/fetchProductStores');
    if (this.isFacilityLogin()) {
      const addedFacilityIds = this.selectedUser.facilities.map((facility: any) => facility.facilityId);
      const addedFacilities = this.allFacilities.filter((facility: any) =>  addedFacilityIds.includes(facility.facilityId));
      this.selectedFacilities = addedFacilities;
    }
    await this.initializeFormData();
  },
  methods: {
    isFacilityLogin() {
      if (this.selectedUser && this.selectedUser.partyTypeId === "PARTY_GROUP") {
        return true;
      }
      return false;
    },
    initializeFormData() {
      if (this.selectedUser) {
        this.formData.externalId = this.selectedUser.externalId
        if (this.isFacilityLogin()) {
          this.formData.requirePasswordChange = false;
          this.formData.userLoginId = this.selectedUser.facilities?.[0].facilityId;
        } else {
          this.formData.userLoginId = this.selectedUserTemplate.isUserLoginRequired ? `${this.selectedUser.firstName.toLowerCase()}.${this.selectedUser.lastName.toLowerCase()}` : '';
        }
        this.formData.emailAddress = this.selectedUser.emailDetails?.email;
        if(!this.selectedUserTemplate.isPasswordChangeRequired) {
          this.formData.requirePasswordChange = false;
        }
      }
    },
    clearFormData() {
      this.formData = {
        userLoginId: '',
        currentPassword: '',
        emailAddress: '',
        externalId: '',
        requirePasswordChange: true
      }
    },
    updateUserTemplate(event: CustomEvent) {
      const selectedTemplateId = event.detail.value;
      this.selectedUserTemplate = this.userTemplates.find((userTemplate: any) => userTemplate.templateId === selectedTemplateId);
      this.clearFormData();
      this.initializeFormData();
    },
    validatePassword(event: any) {
      const value = event.target.value;
      (this as any).$refs.password.$el.classList.remove('ion-valid');
      (this as any).$refs.password.$el.classList.remove('ion-invalid');

      if (value === '') return;

      isValidPassword(value)
        ? (this as any).$refs.password.$el.classList.add('ion-valid')
        : (this as any).$refs.password.$el.classList.add('ion-invalid');
    },
    markPasswordTouched() {
      (this as any).$refs.password.$el.classList.add('ion-touched');
     },
    validateUserDetail(data: any) {
      const validationErrors = [];
      if (this.selectedUserTemplate.isUserLoginRequired || this.isFacilityLogin()) {
        if (!data.userLoginId) {
          validationErrors.push(translate('Username is required.'));
        }
        if (!data.currentPassword) {
          validationErrors.push(translate('Password is required.'));
        }
        if (this.selectedUserTemplate.templateId !== 'INTEGRATION' && !data.emailAddress) {
          validationErrors.push(translate('Email is required.'));
        }
      }
      if (data.emailAddress && !isValidEmail(data.emailAddress)) {
        validationErrors.push(translate('Invalid email address.'));
      }
      if (data.currentPassword && !isValidPassword(data.currentPassword)) {
        validationErrors.push(translate('Invalid passowrd. Password should be at least 5 characters long and contain at least one number, alphabet and special character.'));
      }
      return validationErrors;
    },
    async finishSetup() {
      try {
        const validationErrors = this.validateUserDetail(this.formData);
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.join(" ");
          logger.error(errorMessages);
          showToast(translate(errorMessages));
          return;
        }
        await UserService.finishSetup({
          selectedUser: this.selectedUser,
          selectedTemplate: this.selectedUserTemplate,
          formData: this.formData,
          productStores: this.selectedProductStores,
          facilities : this.selectedFacilities
        });
        if (this.selectedUserTemplate.isUserLoginRequired) {
          await this.finishSetupAlert(this.formData.userLoginId);
        } else {
          this.$router.replace({ path: `/user-details/${this.partyId}` });
        }
      } catch (err) {
        logger.error('error', err)
        showToast(translate('Failed to quick setup user.'))
      }
    },
    async finishSetupAlert(userLoginId:  any) {
      const message = 'is ready to login'
      const alert = await alertController.create({
        header: translate("Setup complete"),
        message: translate(message, {userLoginId: userLoginId}),
        backdropDismiss: false,
        buttons: [
          {
            text: translate("Proceed"),
            handler: (data :any) => {
              this.copyCredentials(data);
            }
          }
        ],
        inputs: [
          {
            name: "copyCredentials",
            label: 'Copy credentials',
            type: 'checkbox',
            value: 'Y',
          }
        ]
      });
      return alert.present();
    },
    copyCredentials(data: any) {
      if (data.length > 0) {
        const dataToCopy = `username: ${this.formData.userLoginId}, password: ${this.formData.currentPassword}`
        copyToClipboard(dataToCopy, 'Copied to clipboard')
      }
      this.$router.replace({ path: `/user-details/${this.partyId}` });
    },
    async confirmSetupManually() {
      const message = 'Automatic user setup helps configure various settings to get them up and running with most frequently used settings. Are you sure you want to set up this user manually?'
      const alert = await alertController.create({
        header: translate("Setup manually"),
        message: translate(message),
        buttons: [
          {
            text: translate("Cancel"),
          },
          {
            text: translate("Setup manually"),
            handler: async () => {
              await this.setupManually();
            }
          }
        ],
      });
      return alert.present();
    },
    async setupManually() {
      await this.$router.replace({ path: `/user-details/${this.partyId}` })
    },
    async finishAndCreateNewUser() {
      try {
        const validationErrors = this.validateUserDetail(this.formData);
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.join(" ");
          logger.error(errorMessages);
          showToast(translate(errorMessages));
          return;
        }
        await UserService.finishSetup({
          selectedUser: this.selectedUser,
          selectedTemplate: this.selectedUserTemplate,
          formData: this.formData,
          productStores: this.selectedProductStores,
          facilities : this.selectedFacilities
        });
        await this.store.dispatch('user/clearSelectedUser');
        await this.$router.replace({ path: `/create-user` })
      } catch (err) {
        logger.error('error', err)
        showToast(translate('Failed to quick setup user.'))
      }
    },
    async addFacilities() {
      const selectFacilityModal = await modalController.create({
        component: SelectFacilityModal,
        componentProps: { selectedFacilities: this.selectedFacilities, isFacilityLogin: this.isFacilityLogin() }
      });

      selectFacilityModal.onDidDismiss().then((result) => {
        if (result.data && result.data.value) {
          this.selectedFacilities = result.data.value.selectedFacilities;
        }
      })
      return selectFacilityModal.present();
    },
    toggleFacilitySelection(updatedFacility: any) {
      const selectedFacility = this.selectedFacilities.find((facility: any) => facility.facilityId === updatedFacility.facilityId)
      if (selectedFacility) {
        this.selectedFacilities = this.selectedFacilities.filter((facility: any) => facility.facilityId !== updatedFacility.facilityId)
      } else {
        this.selectedFacilities.push(updatedFacility);
      }
    },
    async addProductStores() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { selectedProductStores: this.selectedProductStores }
      });

      selectProductStoreModal.onDidDismiss().then((result) => {
        if (result.data && result.data.value) {
          this.selectedProductStores = result.data.value.selectedProductStores;
        }
      })
      return selectProductStoreModal.present();
    }
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      store,
      router,
      addCircleOutline,
      arrowForwardOutline,
      caretDownOutline,
      closeOutline,
      documentTextOutline,
      eyeOffOutline,
      eyeOutline,
      settingsOutline,
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

  .actions {
    display: flex;
    flex-direction: column;
    align-items: start;
  }

</style>