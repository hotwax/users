<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ user.userLoginId }}</ion-list-header>
      <ion-item button>{{ $t("Edit profile") }}</ion-item>
      <ion-item button>{{ $t("Reset password") }}</ion-item>
      <ion-item button lines="none">{{ $t("Deactivate") }}</ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader
} from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserPopover',
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ['user']
});
</script>