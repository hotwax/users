<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Reset password") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <!-- TODO add password requirements -->
    <ion-list>
      <!-- TODO add password validation -->
      <ion-item lines="full">
        <ion-label class="ion-text-wrap" position="fixed">{{ translate("New password") }}</ion-label>
        <ion-input :placeholder="translate('Enter password')" name="password" v-model="password" id="key" type="password" required />
      </ion-item>
      <ion-item>
        <ion-label class="ion-text-wrap" position="fixed">{{ translate("Verify new password") }}</ion-label>
        <ion-input :placeholder="translate('Confirm password')" name="password2" v-model="password2" id="value" type="password" required />
      </ion-item>
    </ion-list>

    <!-- TODO check API for reset password email -->
    <ion-item v-if="email?.length" class="ion-padding-top">
      <ion-icon :icon="mailOutline" slot="start" />
      <ion-button fill="clear">
        {{ translate('Send reset password email instead') }}
      </ion-button>
      <ion-label slot="end">{{ email }}</ion-label>
    </ion-item>

    <!-- TODO improve disable button logic -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="checkResetButtonStatus()" @click="resetPassword()">
        <ion-icon :icon="lockClosedOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, lockClosedOutline, mailOutline } from "ionicons/icons";
import { useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { showToast } from "@/utils";
import { UserService } from "@/services/UserService";

export default defineComponent({
  name: "CustomFieldModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      password: '',
      password2: ''
    }
  },
  props: ["email", "userLoginId"],
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async resetPassword() {
      try {
        await UserService.resetPassword({
          newPassword: this.password,
          newPasswordVerify: this.password2,
          userLoginId: this.userLoginId
        })
        showToast(translate('Password reset successful.'))
      } catch (error) {
        showToast(translate('Failed to reset password.'))
        console.error(error)
      }
    },
    checkResetButtonStatus() {
      // TODO add check for length and other requirements
      return (!this.password.length || !this.password2.length) 
        || (this.password.trim() !== this.password2.trim())
    }
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      lockClosedOutline,
      mailOutline,
      store,
      translate
    };
  },
});
</script>
