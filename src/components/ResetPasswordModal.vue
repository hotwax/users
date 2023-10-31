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
    <ion-list>
      <!-- TODO add password validation -->
      <ion-item lines="none">
        <ion-note>
          {{ translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.') }}
        </ion-note>
      </ion-item>
      <ion-item lines="full">
        <ion-label class="ion-text-wrap" position="fixed">{{ translate("New password") }}</ion-label>
        <ion-input :placeholder="translate('Enter password')" name="password" v-model="newPassword" id="newPassword" :type="showNewPassword ? 'text' : 'password'" required />
        <ion-button fill="clear" @click="showNewPassword = !showNewPassword">
          <ion-icon :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
        </ion-button>
      </ion-item>
      <ion-item>
        <ion-label class="ion-text-wrap" position="fixed">{{ translate("Verify new password") }}</ion-label>
        <ion-input :placeholder="translate('Confirm password')" name="confirmPassword\" v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required />
        <ion-button fill="clear" @click="showConfirmPassword = !showConfirmPassword">
          <ion-icon :icon="showConfirmPassword ? eyeOutline : eyeOffOutline"/>
        </ion-button>
      </ion-item>
    </ion-list>

    <ion-item v-if="email?.length" class="ion-padding-top">
      <ion-icon :icon="mailOutline" slot="start" />
      <ion-button fill="clear" @click="sendResetPasswordEmail()">
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
  IonNote,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { isPasswordValid, showToast } from "@/utils";
import { hasError } from "@/adapter";
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
    IonNote,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      showConfirmPassword: false,
      showNewPassword: false,
    }
  },
  props: ["email", "userLoginId"],
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async resetPassword() {
      this.newPassword = this.newPassword.trim()
      this.confirmPassword = this.confirmPassword.trim()

      try {
        const resp = await UserService.resetPassword({
          newPassword: this.newPassword,
          newPasswordVerify: this.confirmPassword,
          userLoginId: this.userLoginId
        })
        if (!hasError(resp)) {
          showToast(translate('Password reset successful.'))
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to reset password.'))
        console.error(error)
      }
      this.closeModal()
    },
    checkResetButtonStatus() {
      // TODO add check for length and other requirements
      return (!this.newPassword.length || !this.confirmPassword.length) 
        || (this.newPassword.trim() !== this.confirmPassword.trim()
        || (!isPasswordValid(this.newPassword) || !isPasswordValid(this.confirmPassword)))
    },
    async sendResetPasswordEmail() {
      try {
        const resp = await UserService.sendResetPasswordEmail({
          emailAddress: this.email,
          userName: this.userLoginId
        })
        if (!hasError(resp)) {
          showToast(translate('Password reset email sent successfully.'))
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to send password reset email.'))
        console.error(error)
      }
      this.closeModal()
    }
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      mailOutline,
      store,
      translate
    };
  },
});
</script>
