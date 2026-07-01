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
          :error-text="translate('Password requirements not fulfilled.')"
          autocomplete="new-password"/>
        <!-- <ion-button fill="clear" @click="showNewPassword = !showNewPassword">
          <ion-icon :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
        </ion-button> -->
      </ion-item>
      <ion-item lines="none">
        <ion-input 
          ref="confirmPasswordInput" 
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
      <ion-fab-button :disabled="(!userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN') && userProfile?.userLoginId !== userLoginId) || checkResetButtonStatus()" @click="resetPassword()">
        <ion-icon :icon="lockClosedOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IonButtons, IonButton, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, modalController } from "@ionic/vue";
import { closeOutline, lockClosedOutline, mailOutline } from "ionicons/icons";
import { commonUtil, translate, logger } from '@common';
import { useUserStore } from "@/store/user";

const props = defineProps<{
  email?: string;
  userLoginId?: string;
}>();

const userStore = useUserStore();

const newPassword = ref('');
const confirmPassword = ref('');
const showConfirmPassword = ref(false);
const showNewPassword = ref(false);
const password = ref<any>(null);
const confirmPasswordInput = ref<any>(null);

const userProfile = computed(() => userStore.getUserProfile);

const inputElement = (inputRef: any) => inputRef.value?.$el || inputRef.value;

const closeModal = () => {
  modalController.dismiss({ dismissed: true});
};

const resetPassword = async () => {
  try {
    const resp = await userStore.resetPassword({
      newPassword: newPassword.value,
      newPasswordVerify: confirmPassword.value,
      userLoginId: props.userLoginId
    });
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Password reset successful.'));
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate('Failed to reset password.'));
    logger.error(error);
  }
  closeModal();
};

const checkResetButtonStatus = () => {
  // TODO add check for length and other requirements(
  return ((!newPassword.value.length || !confirmPassword.value.length)
    || (newPassword.value !== confirmPassword.value)
    || (!commonUtil.isValidPassword(newPassword.value) || !commonUtil.isValidPassword(confirmPassword.value)));
};

const validatePassword = (event: any) => {
  const value = event.target.value;
  const element = inputElement(password);
  element?.classList.remove('ion-valid');
  element?.classList.remove('ion-invalid');

  if (value === '') return;

  commonUtil.isValidPassword(value)
    ? element?.classList.add('ion-valid')
    : element?.classList.add('ion-invalid');
};

const validateConfirmPassword = () => {
  const element = inputElement(confirmPasswordInput);
  element?.classList.remove('ion-valid');
  element?.classList.remove('ion-invalid');
  
  (newPassword.value === confirmPassword.value)
    ? element?.classList.add('ion-valid')
    : element?.classList.add('ion-invalid');
};

const sendResetPasswordEmail = async () => {
  try {
    const resp = await userStore.sendResetPasswordEmail({
      emailAddress: props.email,
      userName: props.userLoginId
    });
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Password reset email sent successfully.'));
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate('Failed to send password reset email.'));
    logger.error(error);
  }
  closeModal();
};

const markPasswordTouched = () => {
  inputElement(password)?.classList.add('ion-touched');
};

const markConfirmPasswordTouched = () => {
  inputElement(confirmPasswordInput)?.classList.add('ion-touched');
};
</script>
