<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ $t("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-item lines="none">
          <!-- TODO show image only if available -->
          <ion-avatar slot="start">
            <Image />
          </ion-avatar>
          <ion-label>
            <h1>First Last</h1>
            <p>username</p>
          </ion-label>
        </ion-item>
      </main>
    </ion-content>
  </ion-page>
</template>
<script>
import {
  IonAvatar,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonToolbar,
  IonTitle,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from 'vue-router';
import { useStore } from "vuex";
import { addOutline, arrowForwardOutline } from 'ionicons/icons';
import Image from '@/components/Image.vue'

export default defineComponent({
  name: "User Details",
  components: {
    Image,
    IonAvatar,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonPage,
    IonToolbar,
    IonTitle,
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return {
      addOutline,
      arrowForwardOutline,
      router,
      store
    }
  }
})
</script>