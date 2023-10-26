<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate(placeholder) }}</ion-list-header>
      <ion-item button @click="copyInfo(value)">
        {{ translate("Copy") }}
      </ion-item>
      <ion-item @click="updateContact(type)" button>
        {{ translate("Edit") }}
      </ion-item>
      <ion-item button lines="none">
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
import { useStore } from 'vuex';
import { copyToClipboard } from "@/utils";

export default defineComponent({
  name: "ContactActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ["type", "placeholder", "value"],
  data() {
    return {
      options: {
        email: {
          header: 'Edit email',
          placeholder: 'Email'
        },
        phoneNumber: {
          header: 'Edit phone number',
          placeholder: 'Phone'
        },
        externalId: {
          header: 'Edit externalId',
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
    async updateContact(type: string) {
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
          handler: (result) => {
            // TODO handle result
          }
        }]
      })
      await contactUpdateAlert.present()
    },
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