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
      <ion-item lines="none">
        <p>
          {{ translate('Password should be at least 5 characters long and contain at least one number, alphabet and special character.') }}
        </p>
      </ion-item>
      <ion-item lines="none">
        <ion-input 
          ref="password"
          :label="translate('New password')" 
          @keyup="validatePassword" 
          @ionBlur="markPasswordTouched" 
          :placeholder="translate('Enter password')" 
          name="password" 
          v-model="newPassword" 
          id="newPassword" 
          :type="showNewPassword ? 'text' : 'password'"
          :error-text="translate('Password requirements not fulfilled.')"/>
        <!-- <ion-button fill="clear" @click="showNewPassword = !showNewPassword">
          <ion-icon :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
        </ion-button> -->
      </ion-item>
      <ion-item lines="none">
        <ion-input 
          ref="confirmPassword" 
          :label="translate('Verify password')" 
          @keyup="validateConfirmPassword()" 
          @ionBlur="markConfirmPasswordTouched" 
          :placeholder="translate('Confirm password')" 
          name="confirmPassword" 
          v-model="confirmPassword" 
          id="confirmPassword" 
          :type="showConfirmPassword ? 'text' : 'password'"
          :error-text="translate('Passwords do not match.')"/>
        <!-- <ion-button fill="clear" @click="showConfirmPassword = !showConfirmPassword">
          <ion-icon :icon="showConfirmPassword ? eyeOutline : eyeOffOutline"/>
        </ion-button> -->
      </ion-item>
    </ion-list>

    <ion-item v-if="email?.length" class="ion-padding-top">
      <ion-label>{{ email }}</ion-label>
      <ion-button slot="end" fill="clear" @click="sendResetPasswordEmail()">
        {{ translate('Reset password email') }}
        <ion-icon :icon="mailOutline" slot="end" />
      </ion-button>
    </ion-item>

    <!-- TODO improve disable button logic -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!hasPermission(Actions.APP_UPDT_PASSWORD) || checkResetButtonStatus()" @click="resetPassword()">
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
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { isValidPassword, showToast } from "@/utils";
import { hasError } from "@/adapter";
import { UserService } from "@/services/UserService";
import { Actions, hasPermission } from '@/authorization'

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
      // TODO add check for length and other requirements(
      return ((!this.newPassword.length || !this.confirmPassword.length)
        || (this.newPassword !== this.confirmPassword)
        || (!isValidPassword(this.newPassword) || !isValidPassword(this.confirmPassword)))
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
    validateConfirmPassword() {
      (this as any).$refs.confirmPassword.$el.classList.remove('ion-valid');
      (this as any).$refs.confirmPassword.$el.classList.remove('ion-invalid');
      
      (this.newPassword === this.confirmPassword)
      ? (this as any).$refs.confirmPassword.$el.classList.add('ion-valid')
      : (this as any).$refs.confirmPassword.$el.classList.add('ion-invalid');
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
    },
    markPasswordTouched() {
      (this as any).$refs.password.$el.classList.add('ion-touched');
    },
    markConfirmPasswordTouched() {
      (this as any).$refs.confirmPassword.$el.classList.add('ion-touched');
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      hasPermission,
      lockClosedOutline,
      mailOutline,
      store,
      translate,
      Actions
    };
  },
});
</script>
