<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate(placeholder) }}</ion-list-header>
      <ion-item button @click="copyInfo()">
        {{ translate("Copy") }}
      </ion-item>
      <ion-item @click="updateContactField()" button>
        {{ translate("Edit") }}
      </ion-item>
      <ion-item @click="deleteContactField()" button lines="none">
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
import { hasError } from "@/adapter";
import { copyToClipboard, isValidEmail, showToast } from "@/utils";
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
      OPTIONS: {
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
    copyInfo() {
      copyToClipboard(this.value, 'Copied to clipboard')
      this.closePopover();
    },
    async updateContactField() {
      const contactUpdateAlert = await alertController.create({
        header: translate(this.OPTIONS[this.type].editHeader),
        inputs:  [{
          // TODO add validation for phone
          name: "input",
          placeholder: translate(this.OPTIONS[this.type].placeholder),
          value: this.value
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Save'),
          handler: async (result) => {
            const input = result.input.trim()
            // if initial and new value are same, return
            if (!input || input === this.value) {
              if (!input) {
                showToast(translate('Please enter a value'))
                return false
              }
              return true
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (this.type === 'email') {
                if (!isValidEmail(input)) {
                  showToast(translate('Invalid email address.'))
                  return false
                }

                const resp = await UserService.createUpdatePartyEmailAddress({
                  contactMechId: this.contactMechId,
                  emailAddress: input,
                  partyId: this.selectedUser.partyId
                })
                if (hasError(resp)) throw resp.data
                selectedUser = {
                  ...selectedUser,
                  emailDetails: {
                    email: input,
                    contactMechId: this.contactMechId
                  }
                }
              } else if (this.type === 'phoneNumber') {
                const resp = await UserService.createUpdatePartyTelecomNumber({
                  contactMechId: this.contactMechId,
                  contactNumber: input,
                  partyId: this.selectedUser.partyId
                })
                if (hasError(resp)) throw resp.data
                selectedUser = {
                  ...selectedUser,
                  phoneNumberDetails: {
                    contactNumber: input,
                    contactMechId: this.contactMechId
                  }
                }
              } else {
                let resp = {} as any
                if (this.selectedUser.partyTypeId === 'PERSON') {
                  resp = await UserService.updatePerson({
                    externalId: input,
                    partyId: this.selectedUser.partyId,
                    firstName: this.selectedUser.firstName,
                    lastName: this.selectedUser.lastName
                  })
                } else {
                  resp = await UserService.updatePartyGroup({
                    externalId: input,
                    partyId: this.selectedUser.partyId,
                    groupName: this.selectedUser.groupName
                  })
                }
                if (hasError(resp)) throw resp.data
                selectedUser = {
                  ...selectedUser,
                  externalId: input
                }
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${this.OPTIONS[this.type].placeholder} updated successfully.`))
            } catch (error) {
              showToast(translate(`Failed to update ${this.type === 'email' ? 'email' : (this.type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              console.error(error)
            }
            return true
          }
        }]
      })
      await contactUpdateAlert.present()
      this.closePopover()
    },
    async deleteContactField() {
      const message = `Are you sure you want to remove the ${this.type === 'email' ? 'email' : (this.type === 'phoneNumber' ? 'phone number' : 'external ID')}.?`

      const contactUpdateAlert = await alertController.create({
        header: translate(this.OPTIONS[this.type].removeHeader),
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
              if (this.type === 'email') {
                const resp = await UserService.deletePartyContactMech({
                  contactMechId: this.contactMechId,
                  partyId: this.selectedUser.partyId
                })
                if (hasError(resp)) throw resp.data
                delete selectedUser.emailDetails
              } else if (this.type === 'phoneNumber') {
                const resp = await UserService.deletePartyContactMech({
                  contactMechId: this.contactMechId,
                  partyId: this.selectedUser.partyId
                })
                if (hasError(resp)) throw resp.data
                delete selectedUser.phoneNumberDetails
              } else {
                let resp = {} as any
                if (this.selectedUser.partyTypeId === 'PERSON') {
                  resp = await UserService.updatePerson({
                    externalId: '',
                    partyId: this.selectedUser.partyId
                  })
                } else {
                  resp = await UserService.updatePartyGroup({
                    externalId: '',
                    partyId: this.selectedUser.partyId
                  })
                }
                if (hasError(resp)) throw resp.data
                delete selectedUser.externalId
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${this.OPTIONS[this.type].placeholder} removed successfully.`))
            } catch (error) {
              showToast(translate(`Failed to remove ${this.type === 'email' ? 'email' : (this.type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
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