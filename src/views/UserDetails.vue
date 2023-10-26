<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ translate("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <section>
          <ion-item lines="none">
            <!-- TODO fetch and show image only if available -->
            <ion-avatar slot="start">
              <Image />
            </ion-avatar>
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
      </main>
    </ion-content>
  </ion-page>
</template>
<script lang="ts">
import {
  alertController,
  IonAvatar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonLabel,
  IonMenuButton,
  IonPage,
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
import Image from '@/components/Image.vue'
import { translate } from '@hotwax/dxp-components';
import ContactActionsPopover from '@/components/ContactActionsPopover.vue'
import ResetPasswordModal from '@/components/ResetPasswordModal.vue'
import { UserService } from "@/services/UserService";
import { showToast } from "@/utils";

export default defineComponent({
  name: "UserDetails",
  components: {
    Image,
    IonAvatar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser'
    })
  },
  props: ['partyId'],
  data() {
    return {
      options: {
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
      } as any
    }
  },
  async ionViewWillEnter() {
    this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId });
  },
  methods: {
    async openContactActionsPopover(event: Event, type: string, value: string) {
      const contactActionsPopover = await popoverController.create({
        component: ContactActionsPopover,
        event,
        componentProps: {
          type,
          placeholder: this.options[type].placeholder,
          value,
          contactMechId: type === 'email' 
            ? this.selectedUser.emailDetails.contactMechId
            : this.selectedUser.phoneNumberDetails.contactMechId
        },
        translucent: true,
        showBackdrop: false,
      });
      return contactActionsPopover.present();
    },
    async addContactField(type: string) {
      // handling alert header and placeholder
      const contactUpdateAlert = await alertController.create({
        header: translate(this.options[type].header),
        inputs:  [{
          // TODO add validation for email/phone
          name: "input",
          placeholder: translate(this.options[type].placeholder),
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Save'),
          handler: async (result) => {
            const { input } = result
            // if initial and new value are same, return
            if (!input) {
              return
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                const resp = await UserService.createUpdatePartyEmailAddress({
                  emailAddress: input,
                  partyId: this.selectedUser.partyId,
                  contactMechPurposeTypeId: 'PRIMARY_EMAIL'
                })
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
                selectedUser = {
                  ...selectedUser,
                  phoneNumberDetails: {
                    contactNumber: input,
                    contactMechId: resp.data.contactMechId
                  }
                }
              } else {
                this.selectedUser.partyTypeId === 'PERSON'
                  ? await UserService.updatePerson({
                    externalId: input,
                    partyId: this.selectedUser.partyId
                  })
                  : await UserService.updatePartyGroup({
                    externalId: input,
                    partyId: this.selectedUser.partyId
                  })
                selectedUser = {
                  ...selectedUser,
                  externalId: input
                }
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${type === 'email' ? 'Email' : (type === 'phoneNumber' ? 'Phone number' : 'External ID')} added successfully.`))
            } catch (error) {
              showToast(translate(`Failed to add ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              console.error(error)
            }
          }
        }]
      })
      await contactUpdateAlert.present()
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
              await UserService.updateUserLoginStatus({
                enabled: isChecked ? 'N' : 'Y',
                partyId: this.partyId,
                userLoginId: this.selectedUser.userLoginId
              })
              showToast(translate('User login status updated successfully.'))
              // updating toggle state on success
              event.target.checked = isChecked
            } catch (error) {
              showToast(translate('Failed to update user login status.'))
              console.error(error)
            }
          }
        }],
      });

      await alert.present();
    }
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
</style>