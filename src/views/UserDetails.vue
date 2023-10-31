<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/tabs/users" />
        <ion-title>{{ translate("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <div v-if="!Object.keys(selectedUser).length" class="ion-text-center ion-padding-top">
          {{ translate("Failed to fetch user data") }}
        </div>
        <div v-else>
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
              <div v-if="selectedUser.userLoginId">
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
              </div>
              <div v-else>
                <ion-list>
                  <ion-item lines="full">
                    <ion-label class="ion-text-wrap" position="fixed">{{ translate("Username") }}</ion-label>
                    <ion-input :placeholder="translate('user.name')" name="username" v-model="username" id="username" required />
                  </ion-item>
                  <ion-item>
                    <ion-label class="ion-text-wrap" position="fixed">{{ translate("Password") }}</ion-label>
                    <ion-input :placeholder="translate('Default password')" name="password" v-model="password" id="password" type="password" required />
                    <ion-note slot="helper">{{ translate('will be asked to reset their password when they login', { name: selectedUser.firstName }) }}</ion-note>
                  </ion-item>
                </ion-list>
                <ion-button @click="createNewUserLogin()" fill="outline" expand="block">
                  {{ translate('Add credentials') }}
                </ion-button>
              </div>
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
                  <ion-label>{{ selectedUser?.emailDetails ? selectedUser.emailDetails.email : translate('Email') }}</ion-label>
                  <ion-button v-if="selectedUser?.emailDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'email', selectedUser.emailDetails.email)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                  <ion-button v-else @click="addContactField('email')" slot="end" fill="clear">
                    <ion-icon slot="icon-only" :icon="addCircleOutline" />
                  </ion-button>
                </ion-item>
                <ion-item>
                  <ion-icon :icon="callOutline" slot="start" />
                  <ion-label>{{ selectedUser?.phoneNumberDetails ? selectedUser.phoneNumberDetails.contactNumber : translate('Phone number') }}</ion-label>
                  <ion-button v-if="selectedUser?.phoneNumberDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'phoneNumber', selectedUser.phoneNumberDetails.contactNumber)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                  <ion-button v-else @click="addContactField('phoneNumber')" slot="end" fill="clear">
                    <ion-icon slot="icon-only" :icon="addCircleOutline" />
                  </ion-button>
                </ion-item>
                <ion-item lines="none">
                  <ion-icon :icon="businessOutline" slot="start" />
                  <ion-label>{{ selectedUser.externalId ? selectedUser.externalId : translate('External ID') }}</ion-label>
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
              <ion-list>
                <ion-item>
                  <ion-icon :icon="businessOutline" slot="start" />
                  <ion-label>{{ translate('Security Group') }}</ion-label>        
                  <ion-select interface="popover" :value="selectedUser.securityGroup?.groupId" @ionChange="updateSecurityGroup($event)">
                    <ion-select-option v-for="securityGroup in securityGroups" :key="securityGroup.groupId" :value="securityGroup.groupId">
                      {{ securityGroup.groupName }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <div v-if="!userProductStores.length">
                  <ion-button @click="selectProductStore()" fill="outline" expand="block">
                    <ion-icon :icon="addOutline" slot='start' />
                    {{ translate('Add to a product store') }}
                  </ion-button>
                </div>
                <div v-else>
                  <ion-list-header color="light">
                    <ion-label>{{ translate('Product stores') }}</ion-label>
                    <ion-button @click="selectProductStore()">
                      <ion-icon slot="start" :icon="addCircleOutline" />
                      {{ translate('Add') }}
                    </ion-button>
                  </ion-list-header>
                  <ion-item v-for="store in userProductStores" :key="store.productStoreId">
                    <ion-label>
                      <h2>{{ getUserProductStoreName(store.productStoreId) }}</h2>
                      <p>{{ getRoleTypeDesc(store.roleTypeId) }}</p>
                    </ion-label>
                    <ion-button slot="end" fill="clear" color="medium" @click="openProductStoreActionsPopover($event, store)">
                      <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                    </ion-button>
                  </ion-item>
                </div>
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
                    <ion-label>{{ selectedUser.facilities.length === 1 ? translate('added to 1 facility') : translate('added to facilities', { count: selectedUser.facilities.length }) }}</ion-label>
                </ion-item>
              </ion-list>
            </ion-card>
          </section>
        </div>
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
import { isValidEmail, showToast } from "@/utils";
import { hasError } from '@/adapter';
import { UtilService } from "@/services/UtilService";
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
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      userProductStores: 'util/getUserProductStores',
      getUserProductStoreName: 'util/getUserProductStoreName',
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
    await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId });
    await this.store.dispatch('util/getUserProductStores', this.partyId)
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
            : this.selectedUser.phoneNumberDetails.contactMechId
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
              return
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                if (!isValidEmail(input)) {
                  showToast(translate('Invalid email address.'))
                  return
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
          }
        }]
      })
      await contactUpdateAlert.present()
    },
    async createNewUserLogin() {
      this.username = this.username.trim()

      if (!this.password || !this.username) {
        translate('Username or password cannot be empty.')
        return
      }

      try {
        const resp = await UserService.createNewUserLogin({
          currentPassword: this.password,
          currentPasswordVerify: this.password,
          userLoginId: this.username,
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
        componentProps: {
        }
      });

      return selectFacilityModal.present();
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
      });

      return selectProductStoreModal.present();
    },
    async updateSecurityGroup(event: CustomEvent) {
      const groupId = event.detail.value
      let resp = {} as any
      try {
        if (groupId !== 'none') {
          resp = await UtilService.updateSecurityGroup({
            fromDate: this.selectedUser.securityGroup.fromDate,
            thruDate: DateTime.now().toMillis(),
            groupId: this.selectedUser.securityGroup.groupId,
            userLoginId: this.selectedUser.userLoginId
          })
          if (!hasError(resp)) {
            resp = await UtilService.createSecurityGroup({
              groupId,
              userLoginId: this.selectedUser.userLoginId
            })
            if (hasError(resp)) throw resp.data
            showToast(translate('Security group updated successfully.'))
            const userSecurityGroup = await this.store.dispatch('util/getUserSecurityGroups', this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, userSecurityGroup })
          } else {
            throw resp.data
          }
        } else {
          resp = await UtilService.createSecurityGroup({
            groupId,
            userLoginId: this.selectedUser.userLoginId
          })
          if (!hasError(resp)) {
            showToast(translate('Security group updated successfully.'))
            const userSecurityGroup = await this.store.dispatch('util/getUserSecurityGroups', this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, userSecurityGroup })
          } else {
            throw resp.data
          }
        }
      } catch (error) {
        showToast(translate('Something went wrong.'))
        console.error(error)
      }
    },
    async updatePickerRoleStatus(event: any) {
      event.stopImmediatePropagation();

      const isChecked = !event.target.checked;
      const message = 'Are you sure you want to perform this action?'

      const alert = await alertController.create({
        header: translate('Show as picker'),
        message: translate(message),
        buttons: [{
          text: translate('No'),
          role: ''
        }, {
          text: translate('Yes'),
          role: 'success',
          handler: async () => {
            try {
              const resp = await UtilService.updatePickerRoleStatus({
                partyId: this.partyId,
                roleTypeId: 'WAREHOUSE_PICKER'
              })
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
          }
        }],
      });

      await alert.present();
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
</style>