<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/permissions" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create security group") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-item  class="ion-margin-top">
          <ion-label position="floating">{{ translate('Name') }}</ion-label>
          <ion-input v-model="formData.name" />
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Internal ID') }}</ion-label>
          <ion-input v-model="formData.internalId" />
        </ion-item>
        <ion-item>
          <ion-label position="floating">{{ translate('Description') }}</ion-label>
          <ion-textarea v-model="formData.description" />
        </ion-item>

        <ion-button class="ion-margin-top" expand="block">
          <ion-icon slot="start" :icon="addOutline" />
          {{ translate("Create security group") }}
        </ion-button>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonInput,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { useRouter } from 'vue-router'
import { addOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";

export default defineComponent({
  name: "CreateUser",
  components: {
    IonBackButton,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonTextarea,
    IonTitle,
    IonToolbar,
    IonInput,
  },
  data() {
    return {
      formData: {
        name: '',
        internalId: '',
        description: ''
      }
    }
  },
  methods: {

  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      store,
      router,
      addOutline,
      translate
    };
  }
});
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>