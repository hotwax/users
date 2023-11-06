<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-users" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create user") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-card>
        <ion-item lines="none">
          <ion-label v-if="selectedUser.groupName">{{ selectedUser.groupName }} </ion-label> 
          <ion-label v-else>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</ion-label>
          <ion-note slot="end">{{ selectedUser.partyId }}</ion-note> 
        </ion-item>
        <ion-item v-if="selectedUser.emailDetails?.email">
          <ion-icon :icon="mailOutline" slot="start" />
          <ion-label>{{ selectedUser.emailDetails?.email}}</ion-label> 
        </ion-item>
        <ion-item v-if="selectedUser.phoneNumberDetails?.contactNumber">
          <ion-icon :icon="callOutline" slot="start"/>
          <ion-label>{{ selectedUser.phoneNumberDetails?.contactNumber }}</ion-label> 
        </ion-item>
        <ion-item v-if="selectedUser.externalId && selectedUser.partyTypeId !== 'PARTY_GROUP'">
          <ion-icon :icon="businessOutline" slot="start"/>
          <ion-label>{{ selectedUser.externalId }}</ion-label> 
        </ion-item>
      </ion-card>
      <div class="actions ion-margin-top">
        <ion-button @click="quickSetup()">
          {{ translate("Quick Setup") }}
          <ion-icon slot="end" :icon="arrowForwardOutline"/>
        </ion-button>
        <ion-button color="medium" fill="outline" @click="confirmSetupManually()">
          {{ translate("Setup Manually") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
  
<script lang="ts">
  import {
    IonBackButton,
    IonButton,
    IonCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar,
    alertController
  } from "@ionic/vue";
  import { defineComponent } from "vue";
  import { mapGetters, useStore } from "vuex";
  import { useRouter } from 'vue-router'
  import {
    arrowForwardOutline,
    businessOutline,
    callOutline,
    mailOutline
  } from 'ionicons/icons';
  import { translate } from "@hotwax/dxp-components";
  
  export default defineComponent({
    name: "UserConfirmation",
    components: {
      IonBackButton,
      IonButton,
      IonCard,
      IonContent,
      IonHeader,
      IonIcon,
      IonItem,
      IonLabel,
      IonNote,
      IonPage,
      IonTitle,
      IonToolbar,
    },
    computed: {
      ...mapGetters({
        selectedUser: 'user/getSelectedUser'
      })
    },
    props: ['partyId'],
    async ionViewWillEnter() {
      await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId });
    },
    methods: {
      async quickSetup() {
        await this.$router.push({ path: `/user-quick-setup/${this.partyId}` })
      },
      async setupManually() {
        await this.$router.replace({ path: `/user-details/${this.partyId}` })
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
      }
    },
    setup() {
      const store = useStore();
      const router = useRouter();
  
      return {
        store,
        router,
        arrowForwardOutline,
        businessOutline,
        callOutline,
        mailOutline,
        translate
      };
    }
  });
</script>

<style>

  .actions {
    display: flex;
    flex-direction: column;
    align-items: start;
  }

</style>