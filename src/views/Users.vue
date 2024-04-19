<template>
  <ion-page>
    <FilterMenu content-id="filter-menu" />

    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Users") }}</ion-title>
        <ion-menu-button slot="end" class="mobile-only">
          <ion-icon :icon="optionsOutline" />
        </ion-menu-button>
      </ion-toolbar>
    </ion-header>

    <ion-content id="filter-menu">
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search users')" v-model="query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-select :label="translate('Clearance')" interface="popover" v-model="query.securityGroup" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="securityGroup.groupId" :key="index" v-for="(securityGroup, index) in securityGroups">{{ securityGroup.groupName }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="toggleOutline" slot="start" />
              <ion-select :label="translate('Login')" interface="popover" v-model="query.status" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option value="Y">{{ translate("Active") }}</ion-select-option>
                <ion-select-option value="N">{{ translate("Inactive") }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-icon slot="start" :icon="cloudyNightOutline"/>
              <ion-toggle v-model="query.hideDisabledUser" @ionChange="updateQuery()" label-placement="start" justify="space-between">{{ translate("Hide disabled users") }}</ion-toggle>
            </ion-item>
          </ion-list>
        </aside>

        <main>
          <ion-card class="list-item" v-if="currentUser.partyId" @click=viewUserDetails(currentUser)>
            <ion-item lines="none">
              <ion-label>
                {{ currentUser.groupName ? currentUser.groupName : `${currentUser.firstName} ${currentUser.lastName}` }}
                <p>{{ currentUser.userLoginId }}</p>
                <p>{{ currentUser.infoString }}</p>
                <ion-badge>{{ translate("Your user") }}</ion-badge>
              </ion-label>
            </ion-item>

            <div class="tablet">
              <ion-label class="ion-text-center" v-if="currentUser.createdDate">
                {{ getDate(currentUser.createdDate) }}
                <p>{{ translate("created") }}</p>
              </ion-label>
              <ion-label v-else>
                {{ '-' }}
              </ion-label>
            </div>

            <ion-item lines="none">
              <div class="tablet">
                <ion-chip outline v-if="currentUser.securityGroupId">
                  <ion-label>{{ currentUser.securityGroupName }}</ion-label>
                </ion-chip>
                <ion-label v-else>
                  {{ '-' }}
                </ion-label>
              </div>
            </ion-item>
          </ion-card>
          <div v-if="users?.length">
            <div class="list-item" v-for="(user, index) in users" :key="index" @click=viewUserDetails(user)>
              <ion-item lines="none">
                <ion-label>
                  {{ user.groupName ? user.groupName : `${user.firstName} ${user.lastName}` }}
                  <p>{{ user.userLoginId }}</p>
                  <p>{{ user.infoString }}</p>
                </ion-label>
              </ion-item>

              <div class="tablet">
                <ion-label class="ion-text-center" v-if="user.createdDate">
                  {{ getDate(user.createdDate) }}
                  <p>{{ translate("created") }}</p>
                </ion-label>
                <ion-label v-else>
                  {{ '-' }}
                </ion-label>
              </div>

              <div class="tablet">
                <ion-chip outline v-if="user.securityGroupId">
                  <ion-label>{{ user.securityGroupName }}</ion-label>
                </ion-chip>
                <ion-label v-else>
                  {{ '-' }}
                </ion-label>
              </div>
            </div>
          </div>
          <div v-else>
            <p class="ion-text-center">{{ translate("No users found") }}</p>
          </div>
        </main>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button :disabled="!hasPermission(Actions.APP_USER_CREATE)" @click="handleNewUser()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-infinite-scroll
        @ionInfinite="loadMoreUsers($event)"
        threshold="100px"
        :disabled="!isScrollable"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBadge,
  IonCard,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  popoverController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  addOutline,
  cloudyNightOutline,
  ellipsisVerticalOutline,
  idCardOutline,
  optionsOutline,
  toggleOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';
import UserPopover from '@/components/UserPopover.vue';
import { translate } from '@hotwax/dxp-components'
import FilterMenu from '@/components/FilterMenu.vue';
import { UserService } from '@/services/UserService';
import { hasError } from '@/adapter';
import { Actions, hasPermission } from '@/authorization'
import logger from '@/logger';

export default defineComponent({
  name: 'Users',
  components: {
    FilterMenu,
    IonBadge,
    IonCard,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      users: 'user/getUsers',
      securityGroups: 'util/getSecurityGroups',
      query: 'user/getQuery',
      isScrollable: "user/isScrollable",
      userProfile: 'user/getUserProfile',
      selectedUser: 'user/getSelectedUser'
    })
  },
  data() {
    return {
      currentUser: {}
    }
  },
  async ionViewWillEnter() {
    await this.fetchUsers()
  },
  async mounted() {
    await this.store.dispatch('util/getSecurityGroups')
  },
  methods: {
    handleNewUser(){
      this.selectedUser = '';
      this.router.push('/create-user');
    },
    getDate(date: any) {
      return DateTime.fromMillis(date).toFormat('dd LLL yyyy')
    },
    async openUserPopover(ev: Event, user:any) {
      const popover = await popoverController.create({
        component: UserPopover,
        componentProps: { user },
        event: ev,
        showBackdrop: false,
      });
      return popover.present();
    },
    async updateQuery() {
      await this.store.dispatch('user/updateQuery', this.query)
      this.fetchUsers();
    },
    async fetchUsers(vSize?: any, vIndex?: any) {
      if(!this.query.queryString) await this.fetchLoggedInUserDetails()
      else this.currentUser = {}

      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex,
        currentUserPartyId: this.userProfile.partyId
      };
      await this.store.dispatch('user/fetchUsers', payload)
    },
    async viewUserDetails(user: any) {
      await this.store.dispatch('user/updateSelectedUser', user)
      this.router.push({ path: `/user-details/${user.partyId}` })
    },
    async loadMoreUsers(event: any) {
      this.fetchUsers(
        undefined,
        Math.ceil(
          this.users?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(() => {
        event.target.complete();
      });
    },
    async fetchLoggedInUserDetails() {
      const params = {
        inputFields: {
          roleTypeIdTo: 'APPLICATION_USER',
          partyId: this.userProfile.partyId
        },
        fromDateName: 'relationshipFromDate',
        thruDateName: 'relationshipThruDate',
        filterByDate: 'Y',
        entityName: 'PartyAndUserLoginSecurityGroupDetails',
        noConditionFind: 'Y',
        distinct: 'Y',
        fieldList: ['createdByUserLogin', 'createdDate', 'enabled', 'firstName', 'lastName', "groupName", 'partyId', 'securityGroupId', 'securityGroupName', 'statusId', 'userLoginId'],
      }

      try {
        const resp = await UserService.fetchUsers(params)

        if (!hasError(resp) && resp.data.count) {
          this.currentUser = resp.data.docs[0]
        } else {
          throw resp.data
        }
      } catch (error) {
        logger.error(error)
      }
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      cloudyNightOutline,
      ellipsisVerticalOutline,
      hasPermission,
      idCardOutline,
      optionsOutline,
      toggleOutline,
      translate,
      router,
      store,
      Actions
    };
  }
});
</script>

<style scoped>
.list-item {
  --columns-desktop: 4;
}

/* Added width property as after updating to ionic7 min-width is getting applied on ion-label inside ion-item
  which results in distorted label text and thus reduced ion-item width */
  .list-item > ion-item {
    width: 100%;
  }
</style>
