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
        <ion-item v-if="!isFacilityLogin()">
          <ion-icon slot="start" :icon="documentTextOutline"/>
          <ion-label>
            {{ translate("Select template") }}
          </ion-label>
          <ion-select interface="popover" v-model="userTemplateId" @ionChange="updateUserTemplate">
            <ion-select-option v-for="userTemplate in userTemplates" :key="userTemplate.templateId" :value="userTemplate.templateId">{{ userTemplate.templateName }}</ion-select-option>
          </ion-select>
        </ion-item>
        <template v-if="(selectedUserTemplate && selectedUserTemplate.isUserLoginRequired || isFacilityLogin())">
          <ion-item>
            <ion-label position="floating">{{ translate('Username') }}</ion-label>
            <ion-input v-model="formData.userLoginId" :clear-input="true"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">{{ translate('Password') }}</ion-label>
            <ion-input v-model="formData.currentPassword" type="password" :clear-input="true"></ion-input>
            <ion-note slot="helper">{{ translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.') }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>
              {{ translate("Require password reset on login") }}
            </ion-label>
            <ion-toggle :checked="formData.requirePasswordChange" slot="end" />
          </ion-item>
        </template>
        <ion-item v-if="selectedUserTemplate && selectedUserTemplate.isEmployeeIdRequired && !isFacilityLogin()">
          <ion-label position="floating">{{ translate('Employee ID') }}</ion-label>
          <ion-input v-model="formData.externalId"></ion-input>
        </ion-item>

        <ion-item v-if="selectedUserTemplate && selectedUserTemplate.isProductStoreRequired && !isFacilityLogin()">
          <ion-label>
            {{ translate("Product stores") }}
          </ion-label>
          <ion-label slot="end" @click="addProductStores()">
            {{ translate("selected", {storeCount: selectedProductStores ? selectedProductStores.length : 0}) }}
            <ion-icon :icon="caretDownOutline"></ion-icon>
          </ion-label>
        </ion-item>

        <ion-list v-if="(selectedUserTemplate && selectedUserTemplate.isFacilityRequired) || isFacilityLogin()">
          <ion-item>
            <ion-label>{{ translate('Select Facilities') }}</ion-label>
            <ion-button fill="clear" @click="addFacilities()" slot="end">
              {{ translate("Add") }}
              <ion-icon :icon="addCircleOutline"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-item v-for="facility in facilities" :key="facility.facilityId">
            <ion-label>
              {{ facility.facilityName }}
              <p>{{ facility.facilityId }}</p>
            </ion-label>
            <ion-checkbox slot="end" :checked="true" @ionChange="toggleFacilitySelection(facility)" />
          </ion-item>
        </ion-list>

        <div class="actions ion-margin-top">
          <ion-button @click="finishSetup()">
            {{ translate("Finish setup") }}
            <ion-icon slot="end" :icon="arrowForwardOutline"/>
          </ion-button>
          <ion-button fill="outline" size="small" @click="confirmSetupManually()">
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
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
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
  documentTextOutline
} from 'ionicons/icons';
import { copyToClipboard, showToast, isValidPassword } from '@/utils'
import { translate } from "@hotwax/dxp-components";
import { UserService } from '@/services/UserService'
import SelectFacilityModal from '@/components/SelectFacilityModal.vue'
import SelectProductStoreModal from "@/components/SelectProductStoreModal.vue";

export default defineComponent({
  name: "UserConfirmation",
  components: {
    IonBackButton,
    IonButton,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSelect,
    IonSelectOption,
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
      facilities: [] as any,
      selectedFacilities: [] as any,
      selectedProductStores: [] as any,
      formData: {
        userLoginId: '',
        currentPassword: '',
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
      this.facilities = addedFacilities;
      this.selectedFacilities = addedFacilities;
    }
  },
  methods: {
    isFacilityLogin() {
      if (this.selectedUser) {
        this.formData.externalId = this.selectedUser.externalId
        if (this.selectedUser.partyTypeId === "PARTY_GROUP") {
          this.formData.requirePasswordChange = false;
          this.formData.userLoginId = this.selectedUser.facilities?.[0].facilityId;
          return true;
        } else {
          this.formData.userLoginId = this.selectedUserTemplate.isUserLoginRequired ? `${this.selectedUser.firstName.toLowerCase()}.${this.selectedUser.lastName.toLowerCase()}` : '';
          return false;
        }
      }
    },
    clearFormData() {
      this.formData = {
        userLoginId: '',
        currentPassword: '',
        externalId: '',
        requirePasswordChange: true
      }
    },
    updateUserTemplate(event: CustomEvent) {
      const selectedTemplateId = event.detail.value;
      this.selectedUserTemplate = this.userTemplates.find((userTemplate: any) => userTemplate.templateId === selectedTemplateId);
      this.clearFormData();
    },
    validateUserDetail(data: any) {
      const validationErrors = [];
      if (data.currentPassword && !data.userLoginId) {
        validationErrors.push(translate('Username is required.'));
      }
      if (data.userLoginId && !data.currentPassword) {
        validationErrors.push(translate('Password is required.'));
      }
      if (data.currentPassword && !isValidPassword(data.currentPassword)) {
        validationErrors.push(translate('Invalid passowrd. Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.'));
      }
      return validationErrors;
    },
    async finishSetup() {
      try {
        const validationErrors = this.validateUserDetail(this.formData);
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.join(" ");
          console.error(errorMessages);
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
          this.$router.push({ path: `/user-details/${this.partyId}` });
        }
      } catch (err) {
        console.error('error', err)
        showToast(translate('Failed to quick setup user.'))
      }
    },
    async finishSetupAlert(userLoginId:  any) {
      const message = 'is ready to login'
      const alert = await alertController.create({
        header: translate("Finish setup"),
        message: translate(message, {userLoginId: userLoginId}),
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
      this.$router.push({ path: `/user-details/${this.partyId}` });
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
      await this.$router.push({ path: `/user-details/${this.partyId}` })
    },
    async finishAndCreateNewUser() {
      await this.$router.push({ path: `/create-user` })
    },
    async addFacilities() {
      const selectFacilityModal = await modalController.create({
        component: SelectFacilityModal,
        componentProps: { selectedFacilities: this.selectedFacilities }
      });

      selectFacilityModal.onDidDismiss().then((result) => {
        if (result.data && result.data.value) {
          this.facilities = result.data.value.selectedFacilities;
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
      documentTextOutline,
      translate
    };
  }
});
</script>

<style scoped>

  @media (min-width: 700px) {
    main {
      max-width: 375px;
      margin-inline-start: auto;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: start;
  }

</style>