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
      <div class="find">
        <aside>
          <h1>Security Groups</h1>

          <ion-list>
            <ion-item button detail>
              <ion-label>
                <p class="overline">SecurityGroupId</p>
                Security Group Name
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-button @click="createGroup()" fill="clear" expand="block">
            <ion-icon slot="start" :icon="addOutline" />
            <ion-label>{{ translate("Create security group") }}</ion-label>
          </ion-button>
        </aside>
        
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
          <PermissionItems />
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { translate } from '@hotwax/dxp-components';
import {
  addOutline,
  downloadOutline,
  idCardOutline,
  openOutline,
  shieldCheckmarkOutline,
  trashOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import PermissionItems from '@/components/PermissionItems.vue'

export default defineComponent({
  name: 'Permissions',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonTitle,
    IonToolbar,
    PermissionItems
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
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
