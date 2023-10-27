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
          <ion-searchbar :placeholder="$t('Search users')" v-model="query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>{{ $t("Clearance") }}</ion-label>
              <ion-select interface="popover" v-model="query.securityGroup" @ionChange="updateQuery()">
                <ion-select-option value="">{{ $t("None") }}</ion-select-option>
                <ion-select-option :value="securityGroup.groupId" :key="index" v-for="(securityGroup, index) in securityGroups">{{ securityGroup.groupName }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="toggleOutline" slot="start" />
              <ion-label>{{ $t("Status") }}</ion-label>
              <ion-select interface="popover" v-model="query.status" @ionChange="updateQuery()">
                <ion-select-option value="Y" >{{ $t("Active") }}</ion-select-option>
                <ion-select-option value="N">{{ $t("Inactive") }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="users.length">
          <div class="list-item" v-for="(user, index) in users" :key="index" @click=getUserDetail(user.partyId)>
            <ion-item lines="none">
              <ion-label>
                {{ user.groupName ? user.groupName : `${user.firstName} ${user.lastName}` }}
                <p>{{ user.userLoginId }}</p>
                <p>{{ user.infoString }}</p>
              </ion-label>
            </ion-item>

            <ion-label>
              {{ getDate(user.createdDate) }}
              <p>{{ $t("created") }}</p>
            </ion-label>

            <ion-chip outline>
              <ion-label>{{ user.securityGroupId }}</ion-label>
            </ion-chip>

            <div>
              <ion-button fill="clear" color="medium">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </div>
          </div>
        </main>
        <main v-else>
          <ion-item>
            <ion-label>{{ $t("No users found") }}</ion-label>
          </ion-item>
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
  IonTitle,
  IonToolbar,
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
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';
import UserPopover from '@/components/UserPopover.vue';

export default defineComponent({
  name: 'Home',
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
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      users: 'user/getUsers',
      securityGroups: 'util/getSecurityGroups',
      query: 'user/getQuery'
    })
  },
  methods: {
    getDate(date: any) {
      return DateTime.fromMillis(date).toFormat('dd LLL yyyy')
    },
    async openUserPopover(ev: Event, user:any) {
      const popover = await popoverController.create({
        component: UserPopover,
        componentProps: { user },
        event: ev,
        translucent: true,
        showBackdrop: false,
      });
      return popover.present();
    },
    async updateQuery() {
      await this.store.dispatch('user/updateQuery', this.query)
    },
    async getUserDetail(partyId: any) {
      this.router.push({path: `/user-details/${partyId}` })
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      ellipsisVerticalOutline,
      idCardOutline,
      toggleOutline,
      router,
      store
    };
  },
  async mounted() {
    await this.store.dispatch('user/findUsers')
    await this.store.dispatch('util/getSecurityGroups')
  }
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
