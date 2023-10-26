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
            <!-- TODO show image only if available -->
            <ion-avatar slot="start">
              <Image />
            </ion-avatar>
            <ion-label>
              <h1>{{ selected.firstName }} {{ selected.lastName }}</h1>
              <p>{{ selected.userLoginId }}</p>
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
            <ion-item v-if="selected.enabled === 'N'" color="light" lines="none">
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate("User disabled") }}</p>
                <p>{{ translate('This user was disabled due to repeated failed password attempts') }}</p>
              </ion-label>
              <ion-icon slot="end" color="danger" :icon="warningOutline" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Username') }}</ion-label>        
              <ion-label slot="end">{{ selected.userLoginId }}</ion-label>        
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Block login") }}</ion-label>
              <ion-toggle slot="end" :checked="selected.enabled === 'N'" />
            </ion-item>
            <ion-button fill="outline" color="warning" expand="block">
              {{ translate('Reset password') }}
            </ion-button>
          </ion-card>
  
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Contact details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-item>
              <ion-icon :icon="mailOutline" slot="start" />
              <ion-label>{{ selected.infoString ? selected.infoString : translate('Email') }}</ion-label>
              <ion-button v-if="selected.infoString" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'email', selected.infoString)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
              <ion-button v-else @click="updateContact('email')" slot="end" fill="clear">
                <ion-icon slot="icon-only" :icon="addCircleOutline" />
              </ion-button>
            </ion-item>
            <ion-item>
              <ion-icon :icon="callOutline" slot="start" />
              <ion-label>{{ selected.contactNumber ? selected.contactNumber : translate('Phone number') }}</ion-label>
              <ion-button v-if="selected.contactNumber" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'phoneNumber', selected.contactNumber)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
              <ion-button v-else @click="updateContact('phoneNumber')" slot="end" fill="clear">
                <ion-icon slot="icon-only" :icon="addCircleOutline" />
              </ion-button>
            </ion-item>
            <ion-item>
              <ion-icon :icon="businessOutline" slot="start" />
              <ion-label>{{ selected.externalId ? selected.externalId : translate('External ID') }}</ion-label>
              <ion-button v-if="selected.externalId" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'externalId', selected.externalId)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
              <ion-button v-else @click="updateContact('externalId')" slot="end" fill="clear">
                <ion-icon slot="icon-only" :icon="addCircleOutline" />
              </ion-button>
            </ion-item>
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
  IonLabel,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex'
import {
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

export default defineComponent({
  name: "User Details",
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
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      selected: 'user/getSelectedUser'
    })
  },
  data() {
    return {
      options: {
        email: {
          header: 'Add email',
          placeholder: 'Email'
        },
        phoneNumber: {
          header: 'Add phone number',
          placeholder: 'Phone'
        },
        externalId: {
          header: 'Add external ID',
          placeholder: 'External ID'
        }
      } as any
    }
  },
  async ionViewWillEnter() {
    this.store.dispatch("user/getSelectedUserDetails", { partyId: this.$route.params.partyId });
  },
  methods: {
    async openContactActionsPopover(event: Event, type: string, value: string) {
      const contactActionsPopover = await popoverController.create({
        component: ContactActionsPopover,
        event,
        componentProps: {
          type,
          placeholder: this.options[type].placeholder,
          value
        },
        translucent: true,
        showBackdrop: false,
      });
      return contactActionsPopover.present();
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
    const router = useRouter();
    const store = useStore();
    return {
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