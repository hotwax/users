<template>
  <main>
    <div class="section-header">
      <ion-item lines="none">
        <ion-icon :icon="idCardOutline" slot="start" />
        <ion-label>
          <ion-note class="overline">Security Group Id</ion-note>
          <h1>Security group name</h1>
          <p>Description</p>
        </ion-label>
        <ion-button slot="end" fill="outline">{{ translate("Edit") }}</ion-button>
      </ion-item>
      <ion-buttons>
        <ion-button color="medium">
          10 users
          <ion-icon :icon="openOutline" slot="end" />
        </ion-button>
        <ion-button color="danger">
          Delete Group
          <ion-icon :icon="trashOutline" slot="end" />
        </ion-button>
      </ion-buttons>
    </div>

    <hr />

    <div class="search-permissions">
      <ion-searchbar :placeholder="translate('Search permissions')"  />
      <ion-item lines="none">
        <ion-icon :icon="shieldCheckmarkOutline" slot="start" />
        <ion-label>{{ translate("Only selected permissions") }}</ion-label>
        <ion-toggle slot="end" />
      </ion-item>
    </div>

    <section>
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
    <hr/>
  </main>
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
  IonIcon,
  IonItem,
  IonLabel,
  IonNote,
  IonSearchbar,
  IonToggle,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import {
  idCardOutline,
  openOutline,
  shieldCheckmarkOutline,
  trashOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'PermissionItems',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonIcon,
    IonItem,
    IonLabel,
    IonNote,
    IonSearchbar,
    IonToggle,
  },
  setup() {
    const router = useRouter();

    return {
      idCardOutline,
      openOutline,
      shieldCheckmarkOutline,
      router,
      translate,
      trashOutline
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
section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>