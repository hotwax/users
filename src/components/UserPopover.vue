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

<script lang="ts">
import { translate } from '@hotwax/dxp-components';
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
  props: ['user'],
  setup() {
    return {
      translate
    }
  }
});
</script>