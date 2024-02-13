<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Users management") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon :icon="downloadOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <div class="search-permissions">
          <ion-searchbar :placeholder="translate('Search permissions')" />
          <ion-item lines="none">
            <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
            <ion-label>{{ translate("Only selected permissions") }}</ion-label>
            <ion-toggle slot="end" />
          </ion-item>
        </div>
        <hr />
        <section class="permissions-section">
          <ion-card>
            <ion-card-header>
              <div>
                <ion-card-title>Permission ID</ion-card-title>
                <ion-card-subtitle>permission desc</ion-card-subtitle>
              </div>
              <ion-checkbox></ion-checkbox>
            </ion-card-header>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <div>
                <ion-card-title>Permission ID</ion-card-title>
                <ion-card-subtitle>permission desc</ion-card-subtitle>
              </div>
              <ion-checkbox></ion-checkbox>
            </ion-card-header>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <div>
                <ion-card-title>Permission ID</ion-card-title>
                <ion-card-subtitle>permission desc</ion-card-subtitle>
              </div>
              <ion-checkbox></ion-checkbox>
            </ion-card-header>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <div>
                <ion-card-title>Permission ID</ion-card-title>
                <ion-card-subtitle>permission desc</ion-card-subtitle>
              </div>
              <ion-checkbox></ion-checkbox>
            </ion-card-header>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <div>
                <ion-card-title>Permission ID</ion-card-title>
                <ion-card-subtitle>permission desc</ion-card-subtitle>
              </div>
              <ion-checkbox></ion-checkbox>
            </ion-card-header>
          </ion-card>
        </section>
        <hr />
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import {
  addOutline,
  downloadOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Permissions',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonSearchbar,
    IonTitle,
    IonToggle,
    IonToolbar
  },
  methods: {
    createGroup() {
      this.$router.replace({ path: `/create-security-group/` })
    }
  },
  setup() {
    const router = useRouter();

    return {
      addOutline,
      downloadOutline,
      shieldCheckmarkOutline,
      router,
      translate
    }
  }
});
</script>

<style scoped>
ion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permissions-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}


@media screen and (min-width: 700px) {

  ion-content > main {
    margin: var(--spacer-lg)
  }
}
</style>