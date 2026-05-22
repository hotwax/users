<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ user.userLoginId }}</ion-list-header>
      <ion-item button>{{ translate("Edit profile") }}</ion-item>
      <ion-item button>{{ translate("Reset password") }}</ion-item>
      <ion-item button lines="none">{{ translate("Deactivate") }}</ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { translate } from '@common';
import { IonContent, IonItem, IonList, IonListHeader } from '@ionic/vue';

defineProps<{
  user: any;
}>();
</script>
