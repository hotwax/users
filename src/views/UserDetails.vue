<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/tabs/find-users" />
        <ion-title>{{ translate("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <div v-if="!Object.keys(selectedUser).length" class="ion-text-center ion-padding-top">
          {{ translate("Failed to fetch user data") }}
        </div>
        <template v-else>
          <section>
            <ion-item lines="none">
              <!-- TODO fetch and show image only if available -->
              <!-- <ion-avatar slot="start">
                <Image />
              </ion-avatar> -->
              <!-- TODO return available name instead of if-else -->
              <ion-label>
                <h1 v-if="selectedUser.groupName">{{ selectedUser.groupName }}</h1>
                <h1 v-else>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h1>
                <p>{{ selectedUser.userLoginId }}</p>
              </ion-label>
            </ion-item>
          </section>

          <section class="user-details">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Login details') }}
                </ion-card-title>
              </ion-card-header>
              <template v-if="selectedUser.userLoginId">
                <ion-list>
                  <!-- TODO verify disable message -->
                  <!-- <ion-item v-if="selectedUser.enabled === 'N'" color="light" lines="none">
                    <ion-label class="ion-text-wrap">
                      <p class="overline">{{ translate("User disabled") }}</p>
                      <p>{{ translate('This user was disabled due to repeated failed password attempts') }}</p>
                    </ion-label>
                    <ion-icon slot="end" color="danger" :icon="warningOutline" />
                  </ion-item> -->
                  <ion-item>
                    <ion-label>{{ translate('Username') }}</ion-label>
                    <ion-label slot="end">{{ selectedUser.userLoginId }}</ion-label>
                  </ion-item>
                  <ion-item>
                    <ion-label>{{ translate("Block login") }}</ion-label>
                    <ion-toggle slot="end" @click="updateUserLoginStatus($event)" :checked="selectedUser.enabled === 'N'" />
                  </ion-item>
                </ion-list>
                <ion-button @click="resetPassword()" fill="outline" color="warning" expand="block">
                  {{ translate('Reset password') }}
                </ion-button>
              </template>
              <template v-else>
                <ion-list>
                  <ion-item lines="full">
                    <ion-label class="ion-text-wrap" position="fixed">{{ translate("Username") }} <ion-text color="danger">*</ion-text></ion-label>
                    <ion-input :placeholder="selectedUser.groupName ? (selectedUser.groupName)?.toLowerCase() : (`${selectedUser.firstName}.${selectedUser.lastName}`?.toLowerCase())" 
                        name="username" v-model="username" id="username" required />
                  </ion-item>
                  <ion-item ref="password">
                    <ion-label class="ion-text-wrap" position="fixed">{{ translate("Password") }} <ion-text color="danger">*</ion-text></ion-label>
                    <ion-input :placeholder="translate('Default password')" name="password" v-model="password" id="password" type="password" @ionInput="validatePassword" @ionBlur="markPasswordTouched" required />
                    <ion-note slot="helper">{{ translate('will be asked to reset their password when they login', { name: selectedUser.firstName ? selectedUser.firstName : selectedUser.groupName }) }}</ion-note>
                    <ion-note slot="error">{{ translate('Password should be at least 5 characters long and contain at least one number, alphabet and special character.') }}</ion-note>
                  </ion-item>
                </ion-list>
                <ion-button @click="createNewUserLogin()" fill="outline" expand="block">
                  {{ translate('Add credentials') }}
                </ion-button>
              </template>
            </ion-card>
    
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Contact details') }}
                </ion-card-title>
              </ion-card-header>
              <ion-list>
                <ion-item>
                  <ion-icon :icon="mailOutline" slot="start" />
                  <ion-label class="ion-text-wrap">{{ selectedUser?.emailDetails ? selectedUser.emailDetails.email : translate('Email') }}</ion-label>
                  <ion-button v-if="selectedUser?.emailDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'email', selectedUser.emailDetails.email)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                  <ion-button v-else @click="addContactField('email')" slot="end" fill="clear">
                    <ion-icon slot="icon-only" :icon="addCircleOutline" />
                  </ion-button>
                </ion-item>
                <ion-item>
                  <ion-icon :icon="callOutline" slot="start" />
                  <ion-label class="ion-text-wrap">{{ selectedUser?.phoneNumberDetails ? selectedUser.phoneNumberDetails.contactNumber : translate('Phone number') }}</ion-label>
                  <ion-button v-if="selectedUser?.phoneNumberDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'phoneNumber', selectedUser.phoneNumberDetails.contactNumber)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                  <ion-button v-else @click="addContactField('phoneNumber')" slot="end" fill="clear">
                    <ion-icon slot="icon-only" :icon="addCircleOutline" />
                  </ion-button>
                </ion-item>
                <ion-item lines="none">
                  <ion-icon :icon="businessOutline" slot="start" />
                  <ion-label class="ion-text-wrap">{{ selectedUser.externalId ? selectedUser.externalId : translate('External ID') }}</ion-label>
                  <ion-button v-if="selectedUser.externalId" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'externalId', selectedUser.externalId)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                  <ion-button v-else @click="addContactField('externalId')" slot="end" fill="clear">
                    <ion-icon slot="icon-only" :icon="addCircleOutline" />
                  </ion-button>
                </ion-item>
              </ion-list>
            </ion-card>
          </section>

          <div class="section-header">
            <h1>{{ translate('Permissions') }}</h1>
          </div>

          <section class="user-details">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Clearance') }}
                </ion-card-title>
              </ion-card-header>
              <ion-item>
                <ion-icon :icon="businessOutline" slot="start" />
                <ion-label>{{ translate('Security Group') }}</ion-label>        
                <ion-select interface="popover" :disabled="!selectedUser.userLoginId" :value="selectedUser.securityGroup?.groupId" @ionChange="updateSecurityGroup($event)">
                  <ion-select-option v-for="securityGroup in securityGroups" :key="securityGroup.groupId" :value="securityGroup.groupId">
                    {{ securityGroup.groupName }}
                  </ion-select-option>
                  <ion-select-option value="">{{ translate("None") }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-button v-if="!userProductStores.length" @click="selectProductStore()" fill="outline" expand="block">
                <ion-icon :icon="addOutline" slot='start' />
                {{ translate('Add to a product store') }}
              </ion-button>
              <ion-list v-else>
                <ion-list-header color="light">
                  <ion-label>{{ translate('Product stores') }}</ion-label>
                  <ion-button @click="selectProductStore()">
                    {{ translate('Add') }}
                    <ion-icon slot="end" :icon="addCircleOutline" />
                  </ion-button>
                </ion-list-header>
                <ion-item v-for="store in userProductStores" :key="store.productStoreId">
                  <ion-label>
                    <h2>{{ store.storeName }}</h2>
                    <p>{{ getRoleTypeDesc(store.roleTypeId) }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="medium" @click="openProductStoreActionsPopover($event, store)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                </ion-item>
              </ion-list>
            </ion-card>
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Fulfillment') }}
                </ion-card-title>
              </ion-card-header>
              <ion-list>
                <ion-item>
                  <ion-label>{{ translate("Show as picker") }}</ion-label>
                  <ion-toggle slot="end" @click="updatePickerRoleStatus($event)" :checked="selectedUser.isWarehousePicker === true" />
                </ion-item>
                <ion-item lines="none" button detail @click="selectFacility()">
                  <ion-label>{{ selectedUser.facilities.length === 1 ? translate('Added to 1 facility') : translate('Added to facilities', { count: selectedUser.facilities.length }) }}</ion-label>
                </ion-item>
              </ion-list>
            </ion-card>
          </section>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>
<script lang="ts">
import {
  alertController,
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex'
import {
  addOutline,
  addCircleOutline,
  businessOutline,
  callOutline,
  ellipsisVerticalOutline,
  mailOutline,
  warningOutline
} from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import ContactActionsPopover from '@/components/ContactActionsPopover.vue'
import ProductStoreActionsPopover from '@/components/ProductStoreActionsPopover.vue'
import ResetPasswordModal from '@/components/ResetPasswordModal.vue'
import SelectFacilityModal from '@/components/SelectFacilityModal.vue'
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import { UserService } from "@/services/UserService";
import { isValidEmail, isValidPassword, showToast } from "@/utils";
import { hasError } from '@/adapter';
import { DateTime } from "luxon";

export default defineComponent({
  name: "UserDetails",
  components: {
    IonBackButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      userProductStores: 'user/getUserProductStores',
      getRoleTypeDesc: 'util/getRoleTypeDesc',
      securityGroups: 'util/getSecurityGroups'
    })
  },
  props: ['partyId'],
  data() {
    return {
      OPTIONS: {
        email: {
          header: 'Add email',
          placeholder: 'Email'
        },
        phoneNumber: {
          header: 'Add phone number',
          placeholder: 'Phone number'
        },
        externalId: {
          header: 'Add external ID',
          placeholder: 'External ID'
        }
      } as any,
      username: "",
      password: ""
    }
  },
  async ionViewWillEnter() {
    await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId, isFetchRequired: true });
    await this.store.dispatch('util/getSecurityGroups')
  },
  methods: {
    async openContactActionsPopover(event: Event, type: string, value: string) {
      const contactActionsPopover = await popoverController.create({
        component: ContactActionsPopover,
        event,
        componentProps: {
          type,
          placeholder: this.OPTIONS[type].placeholder,
          value,
          contactMechId: type === 'email'
            ? this.selectedUser.emailDetails.contactMechId
            : (type === 'phoneNumber'
              ? this.selectedUser.phoneNumberDetails.contactMechId
              : '')
        },
        showBackdrop: false,
      });
      return contactActionsPopover.present();
    },
    async addContactField(type: string) {
      const contactUpdateAlert = await alertController.create({
        header: translate(this.OPTIONS[type].header),
        inputs:  [{
          // TODO add validation for phone
          name: "input",
          placeholder: translate(this.OPTIONS[type].placeholder),
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Save'),
          handler: async (result) => {
            const input = result.input.trim()
            if (!input) {
              showToast(translate('Please enter a value'))
              return false // returning false will not close the input
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                if (!isValidEmail(input)) {
                  showToast(translate('Invalid email address.'))
                  return false
                }

                const resp = await UserService.createUpdatePartyEmailAddress({
                  emailAddress: input,
                  partyId: this.selectedUser.partyId,
                  contactMechPurposeTypeId: 'PRIMARY_EMAIL'
                })
                if (hasError(resp)) resp.data 
                selectedUser = {
                  ...selectedUser,
                  emailDetails: {
                    email: input,
                    contactMechId: resp.data.contactMechId
                  }
                }
              } else if (type === 'phoneNumber') {
                const resp = await UserService.createUpdatePartyTelecomNumber({
                  contactNumber: input,
                  partyId: this.selectedUser.partyId,
                  contactMechPurposeTypeId: 'PRIMARY_PHONE'
                })
                if (hasError(resp)) resp.data
                selectedUser = {
                  ...selectedUser,
                  phoneNumberDetails: {
                    contactNumber: input,
                    contactMechId: resp.data.contactMechId
                  }
                }
              } else {
                let resp = {} as any
                if (this.selectedUser.partyTypeId === 'PERSON') {
                  resp = await UserService.updatePerson({
                    externalId: input,
                    partyId: this.selectedUser.partyId
                  })
                } else {
                  resp = await UserService.updatePartyGroup({
                    externalId: input,
                    partyId: this.selectedUser.partyId
                  })
                }
                if (hasError(resp)) resp.data
                selectedUser = {
                  ...selectedUser,
                  externalId: input
                }
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${this.OPTIONS[type].placeholder} added successfully.`))
            } catch (error) {
              showToast(translate(`Failed to add ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              console.error(error)
            }
            return true
          }
        }]
      })
      await contactUpdateAlert.present()
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
    async createNewUserLogin() {
      this.username = this.username.trim()

      if (!this.password || !this.username) {
        translate('Username or password cannot be empty.')
        return
      }

      if(await UserService.isUserLoginIdAlreadyExists(this.username)) {
        return;
      }

      try {
        const resp = await UserService.createNewUserLogin({
          partyId: this.partyId,
          currentPassword: this.password,
          currentPasswordVerify: this.password,
          userLoginId: this.username,
          enabled: 'Y',
          userPrefTypeId: 'ORGANIZATION_PARTY',
          userPrefValue: 'COMPANY',
        })
        if (!hasError(resp)) {
          await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId, isFetchRequired: true });
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Something went wrong.'));
        console.error(error)
      }
    },
    async resetPassword() {
      const resetPasswordModal = await modalController.create({
        component: ResetPasswordModal,
        componentProps: {
          email: this.selectedUser.emailDetails?.email,
          userLoginId: this.selectedUser.userLoginId
        }
      });

      return resetPasswordModal.present();
    },
    async updateUserLoginStatus(event: any) {
      event.stopImmediatePropagation();

      const isChecked = !event.target.checked;
      const header = isChecked ? 'Block user login' : 'Unblock user login'
      const message = 'Are you sure you want to perform this action?'

      const alert = await alertController.create({
        header: translate(header),
        message: translate(message),
        buttons: [{
          text: translate('No'),
          role: ''
        }, {
          text: translate('Yes'),
          role: 'success',
          handler: async () => {
            try {
              const resp = await UserService.updateUserLoginStatus({
                enabled: isChecked ? 'N' : 'Y',
                partyId: this.partyId,
                userLoginId: this.selectedUser.userLoginId
              })
              if (!hasError(resp)) {
                showToast(translate('User login status updated successfully.'))
                // updating toggle state on success
                event.target.checked = isChecked
              } else {
                throw resp.data
              }
            } catch (error) {
              showToast(translate('Failed to update user login status.'))
              console.error(error)
            }
          }
        }],
      });

      await alert.present();
    },
    async openProductStoreActionsPopover(event: Event, store: any) {
      const productStoreActionsPopover = await popoverController.create({
        component: ProductStoreActionsPopover,
        componentProps: {
          productStore: store
        },
        event,
        showBackdrop: false,
      });
      return productStoreActionsPopover.present();
    },
    async selectFacility() {
      const selectFacilityModal = await modalController.create({
        component: SelectFacilityModal,
        componentProps: { selectedFacilities: this.selectedUser.facilities }
      });

      selectFacilityModal.onDidDismiss().then( async (result) => {
        if (result.data && result.data.value) {
          const facilitiesToAdd = result.data.value.facilitiesToAdd
          const facilitiesToRemove = result.data.value.facilitiesToRemove

          const removeResponses = await Promise.allSettled(facilitiesToRemove
            .map(async (payload: any) => await UserService.removePartyFromFacility({
              partyId: this.selectedUser.partyId,
              facilityId: payload.facilityId,
              roleTypeId: payload.roleTypeId,
              fromDate: payload.fromDate,
              thruDate: DateTime.now().toMillis()
            }))
          )
    
          // explicitly calling ensurePartyRole (ensurePartyRole) as addToPartyTole 
          // and removeFromPartyRole are running in parallel on the server causing issues
          if (facilitiesToAdd.length) {
            try {
              const resp = await UserService.ensurePartyRole({
                partyId: this.partyId,
                roleTypeId: 'WAREHOUSE_MANAGER',
              })
              if (hasError(resp)) {
                showToast(translate('Something went wrong.'));
                throw resp.data
              }
            } catch (error) {
              console.error(error)
              return
            }
          }

          const createResponses = await Promise.allSettled(facilitiesToAdd
            .map(async (payload: any) => await UserService.addPartyToFacility({
              partyId: this.selectedUser.partyId,
              facilityId: payload.facilityId,
              roleTypeId: 'WAREHOUSE_MANAGER',
            }))
          )
    
          const hasFailedResponse = [...removeResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some association(s).'))
          } else {
            showToast(translate('Facility associations updated successfully.'))
          }
          // refetching updated associated facilities
          const userFacilities = await UserService.getUserFacilities(this.selectedUser.partyId)
          this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, facilities: userFacilities })
        }
      })
      return selectFacilityModal.present();
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { selectedProductStores: this.userProductStores }
      });

      selectProductStoreModal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.value) {
          const productStoresToCreate = result.data.value.productStoresToCreate
          const productStoresToRemove = result.data.value.productStoresToRemove

          const updateResponses = await Promise.allSettled(productStoresToRemove
            .map(async (payload: any) => await UserService.updateProductStoreRole({
              partyId: this.selectedUser.partyId,
              productStoreId: payload.productStoreId,
              roleTypeId: payload.roleTypeId,
              fromDate: this.userProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
              thruDate: DateTime.now().toMillis()
            }))
          )

          // explicitly calling ensurePartyRole (ensurePartyRole) as addToPartyTole
          // and removeFromPartyRole are running in parallel on the server causing issues
          if (productStoresToCreate.length) {
            try {
              const resp = await UserService.ensurePartyRole({
                partyId: this.selectedUser.partyId,
                roleTypeId: "APPLICATION_USER",
              })
              if (hasError(resp)) {
                showToast(translate('Something went wrong.'));
                throw resp.data
              }
            } catch (error) {
              console.error(error)
              return
            }
          }

          const createResponses = await Promise.allSettled(productStoresToCreate
            .map(async (payload: any) => await UserService.createProductStoreRole({
              productStoreId: payload.productStoreId,
              partyId: this.selectedUser.partyId,
              roleTypeId: "APPLICATION_USER",
            }))
          )

          const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some role(s).'))
          } else {
            showToast(translate('Role(s) updated successfully.'))
          }
          // refetching product stores with updated roles
          const userProductStores = await UserService.getUserProductStores(this.selectedUser.partyId)
          this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, productStores: userProductStores })
        }
      })

      return selectProductStoreModal.present();
    },
    async updateSecurityGroup(event: CustomEvent) {
      const groupId = event.detail.value
      // stop programmatic update as ion-change is triggered on page mount automatically
      if (groupId === this.selectedUser.securityGroup.groupId) {
        return
      }

      let resp = {} as any
      try {
        // delete if none (empty groupId) selected 
        if (!groupId) {
          resp = await UserService.removeUserSecurityGroup({
            groupId: this.selectedUser.securityGroup.groupId,
            userLoginId: this.selectedUser.userLoginId
          })
          if (!hasError(resp)) {
            showToast(translate('Security group updated successfully.'))
            const userSecurityGroup = await UserService.getUserSecurityGroup(this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, securityGroup: userSecurityGroup })
          } else {
            throw resp.data
          }
        } else if (this.selectedUser.securityGroup.groupId) {
            //update if already associated, this will expire existing user security groups and associate the new one.
            resp = await UserService.addUserToSecurityGroup({
              securityGroupId: groupId,
              partyIdTo: this.selectedUser.partyId
            })
            if (hasError(resp)) throw resp.data
            showToast(translate('Security group updated successfully.'))
            const userSecurityGroup = await UserService.getUserSecurityGroup(this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, securityGroup: userSecurityGroup })
          
        } else {
          // create if not associated
          resp = await UserService.addUserToSecurityGroup({
            securityGroupId: groupId,
            partyIdTo: this.selectedUser.partyId
          })
          if (!hasError(resp)) {
            showToast(translate('Security group updated successfully.'))
            const userSecurityGroup = await UserService.getUserSecurityGroup(this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, securityGroup: userSecurityGroup })
          } else {
            throw resp.data
          }
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error.message;
        if (errorMessage && errorMessage?.startsWith('Security Error:')) {
          showToast(translate(translate("You don't have permission to update the security group.")))
        } else {
          showToast(translate('Something went wrong.'))
        }
        console.error(error)
      }
    },
    async updatePickerRoleStatus(event: any) {
      event.stopImmediatePropagation();
      const isChecked = !event.target.checked;

      try {
        let resp;
        if (isChecked) {
          resp = await UserService.createCommercePartyRelationshipFrom({
            "partyIdTo": this.partyId,
            "roleTypeIdTo": "WAREHOUSE_PICKER"
          })
        } else {
          resp = await UserService.updatePartyRelationship({
            ...this.selectedUser?.pickerRelationship,
            "thruDate": DateTime.now().toMillis()
          })
        }
        if (!hasError(resp)) {
          showToast(translate('User picker role updated successfully.'))
          // updating toggle state on success
          event.target.checked = isChecked
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to update user role.'))
        console.error(error)
      }
    },
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return {
      addOutline,
      addCircleOutline,
      businessOutline,
      callOutline,
      ellipsisVerticalOutline,
      mailOutline,
      router,
      store,
      translate,
      warningOutline,
    }
  }
})
</script>
<style scoped>
.user-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  align-items: start;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacer-xs) 10px 0px;
}

ion-card>ion-button[expand="block"] {
  margin-inline: var(--spacer-sm);
  margin-bottom: var(--spacer-sm);
}

@media (min-width: 700px) {
  main {
    margin: var(--spacer-xl);
  }

  .user-details {
    gap: var(--spacer-base);
  }
}
</style>