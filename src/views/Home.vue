<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ $t("Users") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="$t('Search users')" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>{{ $t("Clearance") }}</ion-label>
              <ion-select interface="popover" value="a">
                <ion-select-option value="a">Fulfillment manager</ion-select-option>
                <ion-select-option value="b">Product store</ion-select-option>
                <ion-select-option value="c">Product store</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="toggleOutline" slot="start" />
              <ion-label>{{ $t("Status") }}</ion-label>
              <ion-select interface="popover" value="active">
                <ion-select-option value="active">Active</ion-select-option>
                <ion-select-option value="away">Away</ion-select-option>
                <ion-select-option value="deactivated">Deactivated</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main>
          <div class="list-item">
            <ion-item lines="none">
              <ion-label>
                Fullname
                <p>username</p>
                <p>email</p>
              </ion-label>
            </ion-item>

            <ion-label>
              14 Jan 2021
              <p>{{ $t("created") }}</p>
            </ion-label>

            <ion-chip outline>
              <ion-label>{{ "Security Groups" }}</ion-label>
            </ion-chip>

            <div>
              <ion-button fill="clear" color="medium" @click="openUserPopover">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </div>
          </div>

          <hr />
        </main>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToolbar,
  IonTitle,
  popoverController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  addOutline,
  ellipsisVerticalOutline,
  idCardOutline,
  toggleOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import UserPopover from '@/components/UserPopover.vue';


export default defineComponent({
  name: 'Users',
  components: {
    IonButton,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonToolbar,
    IonTitle
  },
  methods: {
    async openUserPopover(ev: Event) {
      const popover = await popoverController.create({
        component: UserPopover,
        event: ev,
        translucent: true,
        showBackdrop: false,
      });
      return popover.present();
    }
  },
  setup() {
    const router = useRouter();

    return {
      addOutline,
      ellipsisVerticalOutline,
      idCardOutline,
      toggleOutline,
      router,
    };
  },
});
</script>

<style scoped>
.list-item {
  --columns-desktop: 5;
}

.list-item > *:last-child {
  display: flex;
  gap: var(--spacer-xs);
}
</style>
