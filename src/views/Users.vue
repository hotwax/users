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
          <ion-searchbar :placeholder="translate('Search users')" v-model="userStore.query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-select :label="translate('Clearance')" interface="popover" v-model="userStore.query.userGroupId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="userGroup.userGroupId" :key="index" v-for="(userGroup, index) in userGroups">{{ userGroup.description || userGroup.userGroupId }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="toggleOutline" slot="start" />
              <ion-select :label="translate('Login')" interface="popover" v-model="userStore.query.status" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option value="Y">{{ translate("Active") }}</ion-select-option>
                <ion-select-option value="N">{{ translate("Inactive") }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main>
          <ion-card class="list-item" v-if="currentUser.userId" @click=viewUserDetails(currentUser)>
            <ion-item lines="none">
              <ion-label>
                {{ currentUser.userFullName }}
                <p>{{ currentUser.username }}</p>
                <p>{{ currentUser.emailAddress }}</p>
                <ion-badge>{{ translate("Your user") }}</ion-badge>
              </ion-label>
            </ion-item>

            <div class="tablet">
              <ion-label class="ion-text-center" v-if="currentUser.createdStamp">
                {{ getDate(currentUser.createdStamp) }}
                <p>{{ translate("created") }}</p>
              </ion-label>
              <ion-label v-else>
                {{ '-' }}
              </ion-label>
            </div>

            <ion-item lines="none">
              <div class="tablet" slot="end">
                <ion-chip outline v-if="currentUser.groups?.length">
                  <ion-label>{{ currentUser.groups.map((group) => group.description || group.userGroupId).join(', ') }}</ion-label>
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
                  {{ user.userFullName || user.username }}
                  <p>{{ user.username }}</p>
                  <p>{{ user.emailAddress }}</p>
                </ion-label>
              </ion-item>

              <div class="tablet">
                <ion-label class="ion-text-center" v-if="user.createdStamp">
                  {{ getDate(user.createdStamp) }}
                  <p>{{ translate("created") }}</p>
                </ion-label>
                <ion-label v-else>
                  {{ '-' }}
                </ion-label>
              </div>

              <div class="tablet">
                <ion-chip outline v-if="user.groups?.length">
                  <ion-label>{{ user.groups.map((group) => group.description || group.userGroupId).join(', ') }}</ion-label>
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
        <ion-fab-button :disabled="!userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')" @click="createUser()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-infinite-scroll
        @ionInfinite="loadMoreUsers($event)"
        threshold="100px"
        v-if="isScrollable"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonBadge, IonCard, IonChip, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, cloudyNightOutline, idCardOutline, optionsOutline, toggleOutline } from 'ionicons/icons';
import router from '@/router';
import { DateTime } from 'luxon';
import { translate } from '@common';
import FilterMenu from '@/components/FilterMenu.vue';
import { useUserStore } from '@/store/user';
import { useUtilStore } from '@/store/util';

const userStore = useUserStore();
const utilStore = useUtilStore();

// The logged-in user's own record, pinned at the top of the list. The profile is already available from
// login, but it doesn't carry group associations, so those are fetched separately via getUserGroups().
const currentUser = ref<any>({});

const users = computed(() => userStore.getUsers);
const userGroups = computed(() => utilStore.getUserGroups);
const isScrollable = computed(() => userStore.isScrollable);

onIonViewWillEnter(async () => {
  await fetchUsers();
});

onMounted(async () => {
  await utilStore.fetchUserGroups();
});

const createUser = () => {
  userStore.clearSelectedUser();
  router.push('/create-user');
};

const getDate = (date: any) => {
  return DateTime.fromMillis(date).toFormat('dd LLL yyyy');
};

const updateQuery = async () => {
  await userStore.updateQuery(userStore.query);
  fetchUsers();
};

const fetchUsers = async (pSize?: any, pIndex?: any) => {
  const pageSize = pSize ? pSize : import.meta.env.VITE_VIEW_SIZE;
  const pageIndex = pIndex ? pIndex : 0;

  if (!userStore.query.queryString) {
    // Do not fetch the current user information again on infinite-scroll pages, as we already have it.
    pageIndex === 0 && await fetchCurrentUser();
  } else {
    currentUser.value = {};
  }

  await userStore.fetchFilteredUsers({ pageSize, pageIndex });
};

const fetchCurrentUser = async () => {
  const profile = userStore.getUserProfile;
  const groups = profile.userId ? await userStore.getUserGroups(profile.userId) : [];
  currentUser.value = { ...profile, groups };
};

const viewUserDetails = async (user: any) => {
  await userStore.updateSelectedUser(user);
  router.push({ path: `/user-details/${user.partyId}` });
};

const loadMoreUsers = async (event: any) => {
  fetchUsers(
    undefined,
    Math.ceil(
      users.value?.length / (import.meta.env.VITE_VIEW_SIZE as any)
    ).toString()
  ).then(async () => {
    await event.target.complete();
  });
};
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
