<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-menu-button slot="start" />
        <ion-title>{{ translate("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <section>
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
        </section>

        <section class="user-details">
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Login details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-item color="light" lines="none">
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate("User disabled") }}</p>
                <p>{{ translate('This user was disabled due to repeated failed password attempts') }}</p>
              </ion-label>
              <ion-icon slot="end" color="danger" :icon="warningOutline" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Username') }}</ion-label>        
              <ion-label slot="end">aditya.patel</ion-label>        
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Block login") }}</ion-label>
              <ion-toggle slot="end" />
            </ion-item>
            <ion-button fill="outline" color="warning" expand="block">
              {{ translate('Reset password') }}
            </ion-button>
          </ion-card>
  
          <!-- <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Contact details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-item color="light" lines="none">
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ translate("User disabled") }}</p>
                <p>{{ translate('This user was disabled due to repeated failed password attempts') }}</p>
              </ion-label>
              <ion-icon slot="end" color="danger" :icon="warningOutline" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Username') }}</ion-label>        
              <ion-label slot="end">aditya.patel</ion-label>        
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Block login") }}</ion-label>
              <ion-toggle slot="end" />
            </ion-item>
            <ion-button fill="outline" color="warning" expand="block">
              {{ translate('Reset password') }}
            </ion-button>
          </ion-card> -->
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>
<script>
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from 'vue-router';
import { useStore } from "vuex";
import { warningOutline } from 'ionicons/icons';
import Image from '@/components/Image.vue'
import { translate } from '@hotwax/dxp-components';

export default defineComponent({
  name: "User Details",
  components: {
    Image,
    IonAvatar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return {
      warningOutline,
      router,
      store,
      translate
    }
  }
})
</script>
<style scoped>
.user-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(343px, 1fr));
  gap: 10px;
}
</style>