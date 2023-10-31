<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/create-user" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create user") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item>
        <ion-icon slot="start" :icon="documentTextOutline"/>
        <ion-label>
          {{ translate("Select template") }}
        </ion-label>
        <ion-select interface="popover" v-model="userTemplateId" @ionChange="updateUserTemplate">
          <ion-select-option v-for="userTemplate in userTemplates" :key="userTemplate.templateId" :value="userTemplate.templateId">{{ userTemplate.templateName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <div v-if="selectedUserTemplate && selectedUserTemplate.templateId && selectedUserTemplate.templateId !== 'FULFILLMENT'">
        <ion-item>
          <ion-label position="floating">{{ translate('Username') }}</ion-label>
          <ion-input v-model="formData.username"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Password') }}</ion-label>
          <ion-input v-model="formData.password" type="password"></ion-input>
          <ion-note slot="helper">{{ translate('Password must inlcude at least one number, one alphabet and one special character.') }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>
            {{ translate("Require password reset on login") }}
          </ion-label>
          <ion-toggle :checked="formData.requirePasswordChange" slot="end" />
        </ion-item>
      </div>
      <ion-item v-if="selectedUserTemplate && ['FULFILLMENT', 'FULFILLMENT_MANAGER'].includes(selectedUserTemplate.templateId)">
        <ion-label position="floating">{{ translate('Employee ID') }}</ion-label>
        <ion-input v-model="formData.externalId"></ion-input>
      </ion-item>

      <ion-item v-if="selectedUserTemplate && selectedUserTemplate.isProductStoreRequied">
        <ion-label>
          {{ translate("Product stores") }}
        </ion-label>
        <ion-label slot="end" @click="addProductStores()">
          {{ translate("selected", {storeCount: selectedProductStores ? selectedProductStores.length : 0}) }}
          <ion-icon :icon="caretDownOutline"></ion-icon>
        </ion-label>
      </ion-item>

      <ion-list v-if="selectedUserTemplate && selectedUserTemplate.isFacilityRequired">
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

      <div class="ion-padding-top">
        <ion-button @click="finishSetup()">
          <ion-icon slot="end" :icon="arrowForwardOutline"/>
          {{ translate("Finish setup") }}
        </ion-button>
        <ion-button fill="outline" @click="setupManually()">
          {{ translate("Setup manually") }}
        </ion-button>
        <ion-button color="medium" fill="outline" @click="finishAndCreateNewUser()">
          {{ translate("Finish and create new user") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
  
<script lang="ts">
  import {
    IonBackButton,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar,
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
  import { showToast, isValidPassword } from '@/utils'
  import { translate } from "@hotwax/dxp-components";
  import FacilityModal from "@/views/FacilityModal.vue";
  import ProductStoreModal from "@/views/ProductStoreModal.vue";
  
  export default defineComponent({
    name: "UserConfirmation",
    components: {
      IonBackButton,
      IonCheckbox,
      IonContent,
      IonHeader,
      IonIcon,
      IonInput,
      IonItem,
      IonLabel,
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
        productStores: 'util/getProductStores'
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
          username: '',
          password: '',
          externalId: '',
          requirePasswordChange: true
        },
        userTemplates: [
          {
            "templateId": "ADMIN",
            "templateName": "Admin",
            "securityGroupId": "COMMERCE_SUPER",
            "roleTypeId":  "",
            "isFacilityRequired": false,
            "isProductStoreRequied": true,
            "productStoreRoleTypeId":"APPLICATION_USER",
          },
          {
            "templateId": "MERCHANDISING_MANAGER",
            "templateName": "Merchandising manager",
            "securityGroupId": "MERCHANDISING_MANAGER",
            "roleTypeId":  "",
            "isFacilityRequired": false,
            "isProductStoreRequied": true,
            "productStoreRoleTypeId": "APPLICATION_USER",
          },
          {
            "templateId": "CSR",
            "templateName": "CSR",
            "securityGroupId": "CSR",
            "roleTypeId": "",
            "isFacilityRequired": false,
            "isProductStoreRequied": false,
            "productStoreRoleTypeId": "",
          },
          {
            "templateId": "FULFILLMENT_MANAGER",
            "templateName": "Fulfillment manager",
            "securityGroupId": "STORE_MANAGER",
            "roleTypeId": "WAREHOUSE_PICKER",
            "isFacilityRequired": true,
            "isProductStoreRequied": false,
            "productStoreRoleTypeId": ""
          },
          {
            "templateId": "FULFILLMENT",
            "templateName": "Fulfillment",
            "securityGroupId": "",
            "roleTypeId": "WAREHOUSE_PICKER",
            "isFacilityRequired": false,
            "isProductStoreRequied": false
          }
        ]
      }
    },
    created() {
      //Initially all product store comes selected
      this.selectedProductStores = this.productStores;
      
      // Set selectedUserTemplate to the default value "FULFILLMENT" on component creation
      this.selectedUserTemplate = this.userTemplates.find(template => template.templateId === this.userTemplateId);
      
    },
    async ionViewWillEnter() {
      await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId });
      await this.store.dispatch('util/fetchFacilities');
      await this.store.dispatch('util/fetchProductStores');
    },
    methods: {
      clearFormData() {
        this.formData = {
          username: '',
          password: '',
          externalId: '',
          requirePasswordChange: true
        }
      },
      updateUserTemplate(event: CustomEvent) {
        const selectedTemplateId = event.detail.value;
        this.selectedUserTemplate = this.userTemplates.find((userTemplate: any) => userTemplate.templateId === selectedTemplateId);
        this.clearFormData();
      },
      validateUserDetail (data: any) {
        const validationErrors = [];
        if (data.password && !data.username) {
          validationErrors.push(translate('username is required.'));
        }
        if (data.password && !isValidPassword(data.emailAddress)) {
          validationErrors.push(translate('Invalid passowrd. Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.'));
        }
        return validationErrors; 
      },
      async finishSetup() {
        try {
          const validationErrors = this.validateUserDetail(this.formData);
          if (validationErrors.length > 0) {
            const errorMessages = validationErrors.join(" ");
            console.log(errorMessages);
            showToast(translate(errorMessages));
            return;
          }
          const selectedTemplate = this.selectedUserTemplate;

          if (selectedTemplate.templateId !== 'FULFILLMENT' && this.formData.username) {
            //Create user login
          }
          if (['FULFILLMENT', 'FULFILLMENT_MANAGER'].includes(selectedTemplate.templateId) && this.formData.externalId) {
            //update party
          }
          if (selectedTemplate.isProductStoreRequied && this.selectedProductStores) {
            //Create product store role
          }
          if (selectedTemplate.isFacilityRequired && this.selectedFacilities) {
            //Create facility party
          }
          if (selectedTemplate.securityGroupId) {
            //Create user login security group
          }
          if (selectedTemplate.productStoreRoleTypeId) {
            //Create product store role
          }
          if (selectedTemplate.roleTypeId) {
            //Create party role
          }
        } catch (err) {
          console.error('error', err)
          showToast(translate('Failed to quick setup user.'))
        }
        //await this.$router.push({ path: `/user-details/${this.partyId}` })
      },
      async setupManually() {
        await this.$router.push({ path: `/user-details/${this.partyId}` })
      },
      async finishAndCreateNewUser() {
        await this.$router.push({ path: `/create-user` })
      }, 
      async addFacilities() {
        const addFacilityModal = await modalController.create({
          component: FacilityModal,
          componentProps: { selectedFacilities: this.selectedFacilities }
        });

        addFacilityModal.onDidDismiss().then((result) => {
          if (result.data && result.data.value) {
            this.facilities  = result.data.value.selectedFacilities;
          }
        })
        return addFacilityModal.present();
      },
      toggleFacilitySelection(updatedFacility : any) {
        const selectedFacility = this.selectedFacilities.find((facility :any) => facility.facilityId === updatedFacility.facilityId)
        if (selectedFacility) {
          this.selectedFacilities = this.selectedFacilities.filter((facility :any) => facility.facilityId !== updatedFacility.facilityId)
        } else {
          this.selectedFacilities.push(updatedFacility);
        }
      },
      async addProductStores() {
        const addProductStoreModal = await modalController.create({
          component: ProductStoreModal,
          componentProps: { productStores: this.productStores, selectedProductStores: this.selectedProductStores }
        });

        addProductStoreModal.onDidDismiss().then((result) => {
          if (result.data && result.data.value) {
            this.selectedProductStores  = result.data.value.selectedProductStores;
          }
        })
        return addProductStoreModal.present();
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