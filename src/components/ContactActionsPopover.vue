<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate(placeholder) }}</ion-list-header>
      <ion-item button @click="copyInfo(value)">
        {{ translate("Copy") }}
      </ion-item>
      <ion-item @click="updateContactField(type)" button>
        {{ translate("Edit") }}
      </ion-item>
      <ion-item @click="deleteContactField(type)" button lines="none">
        {{ translate("Remove") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  alertController,
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from 'vuex';
import { copyToClipboard, showToast } from "@/utils";
import { UserService } from "@/services/UserService";

export default defineComponent({
  name: "ContactActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ["type", "placeholder", "value", "contactMechId"],
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser'
    })
  },
  data() {
    return {
      options: {
        email: {
          removeHeader: 'Remove email',
          editHeader: 'Edit email',
          placeholder: 'Email'
        },
        phoneNumber: {
          removeHeader: 'Remove phone number',
          editHeader: 'Edit phone number',
          placeholder: 'Phone number'
        },
        externalId: {
          removeHeader: 'Remove external ID',
          editHeader: 'Edit external ID',
          placeholder: 'External ID'
        }
      } as any
    }
  },
  methods: {
    closePopover() {
      popoverController.dismiss();
    },
    copyInfo(info: string) {
      copyToClipboard(info, 'Copied to clipboard')
      this.closePopover();
    },
    async updateContactField(type: string) {
      const contactUpdateAlert = await alertController.create({
        header: translate(this.options[type].editHeader),
        inputs:  [{
          // TODO add validation for email/phone
          name: "input",
          placeholder: translate(this.options[type].placeholder),
          value: this.value
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
            if (!input || input === this.value) {
              return
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                await UserService.createUpdatePartyEmailAddress({
                  contactMechId: this.contactMechId,
                  emailAddress: input,
                  partyId: this.selectedUser.partyId
                })
                selectedUser = {
                  ...selectedUser,
                  emailDetails: {
                    email: input,
                    contactMechId: this.contactMechId
                  }
                }
              } else if (type === 'phoneNumber') {
                await UserService.createUpdatePartyTelecomNumber({
                  contactMechId: this.contactMechId,
                  contactNumber: input,
                  partyId: this.selectedUser.partyId
                })
                selectedUser = {
                  ...selectedUser,
                  phoneNumberDetails: {
                    contactNumber: input,
                    contactMechId: this.contactMechId
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
              showToast(translate(`${type === 'email' ? 'Email' : (type === 'phoneNumber' ? 'Phone number' : 'External ID')} updated successfully.`))
            } catch (error) {
              showToast(translate(`Failed to update ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              console.error(error)
            }
          }
        }]
      })
      await contactUpdateAlert.present()
      this.closePopover()
    },
    async deleteContactField(type: string) {
      const message = `Are you sure you want to remove the ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.?`

      const contactUpdateAlert = await alertController.create({
        header: translate(this.options[type].removeHeader),
        message: translate(message),
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Save'),
          handler: async () => {
            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                await UserService.deletePartyContactMech({
                  contactMechId: this.contactMechId,
                  partyId: this.selectedUser.partyId
                })
                delete selectedUser.emailDetails
              } else if (type === 'phoneNumber') {
                await UserService.deletePartyContactMech({
                  contactMechId: this.contactMechId,
                  partyId: this.selectedUser.partyId
                })
                delete selectedUser.phoneNumberDetails
              } else {
                this.selectedUser.partyTypeId === 'PERSON'
                  ? await UserService.updatePerson({
                    externalId: '',
                    partyId: this.selectedUser.partyId
                  })
                  : await UserService.updatePartyGroup({
                    externalId: '',
                    partyId: this.selectedUser.partyId
                  })
                delete selectedUser.externalId
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${type === 'email' ? 'Email' : (type === 'phoneNumber' ? 'Phone number' : 'External ID')} removed successfully.`))
            } catch (error) {
              showToast(translate(`Failed to remove ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              console.error(error)
            }
          }
        }]
      })
      await contactUpdateAlert.present()
      this.closePopover();
    }
  },
  setup() {
    const store = useStore();

    return {
      store,
      translate
    }
  }
});
</script>