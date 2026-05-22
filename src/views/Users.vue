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
              <ion-select :label="translate('Clearance')" interface="popover" v-model="userStore.query.securityGroup" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="securityGroup.groupId" :key="index" v-for="(securityGroup, index) in securityGroups">{{ securityGroup.groupName || securityGroup.groupId }}</ion-select-option>
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
            <ion-item>
              <ion-icon slot="start" :icon="cloudyNightOutline"/>
              <ion-toggle v-model="userStore.query.hideDisabledUser" @ionChange="updateQuery()" label-placement="start" justify="space-between">{{ translate("Hide disabled users") }}</ion-toggle>
            </ion-item>
          </ion-list>
        </aside>

        <main>
          <ion-card class="list-item" v-if="currentUser.partyId" @click=viewUserDetails(currentUser)>
            <ion-item lines="none">
              <ion-label>
                {{ currentUser.groupName ?? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}` }}
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
              <div class="tablet" slot="end">
                <ion-chip outline v-if="currentUser.securityGroupId">
                  <ion-label>{{ currentUser.securityGroupName || currentUser.securityGroupId }}</ion-label>
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
                  {{ user.groupName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}` }}
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
                  <ion-label>{{ user.securityGroupName || user.securityGroupId }}</ion-label>
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
import { useRouter } from 'vue-router';
import { DateTime } from 'luxon';
import { commonUtil, translate, logger } from '@common';
import FilterMenu from '@/components/FilterMenu.vue';
import { UserService } from '@/services/UserService';
import { useUserStore } from '@/store/user';
import { useUtilStore } from '@/store/util';

const userStore = useUserStore();
const utilStore = useUtilStore();
const router = useRouter();

const currentUser = ref<any>({});

const users = computed(() => userStore.getUsers);
const securityGroups = computed(() => utilStore.getSecurityGroups);
const isScrollable = computed(() => userStore.isScrollable);
const userProfile = computed(() => userStore.getUserProfile);

onIonViewWillEnter(async () => {
  await fetchUsers();
});

onMounted(async () => {
  await utilStore.getSecurityGroups();
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

const fetchUsers = async (vSize?: any, vIndex?: any) => {
  if (!userStore.query.queryString) {
    !vIndex && await fetchLoggedInUserDetails();
  } else {
    currentUser.value = {};
  }

  const viewSize = vSize ? vSize : import.meta.env.VITE_VIEW_SIZE;
  const viewIndex = vIndex ? vIndex : 0;
  const payload = {
    viewSize,
    viewIndex,
    currentUserPartyId: userProfile.value.partyId
  };
  await userStore.fetchUsers(payload);
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

const fetchLoggedInUserDetails = async () => {
  const params = {
    inputFields: {
      roleTypeIdTo: 'APPLICATION_USER',
      partyId: userProfile.value.partyId
    },
    fromDateName: 'relationshipFromDate',
    thruDateName: 'relationshipThruDate',
    filterByDate: 'Y',
    entityName: 'PartyAndUserLoginSecurityGroupDetails',
    noConditionFind: 'Y',
    distinct: 'Y',
    fieldList: ['createdByUserLogin', 'createdDate', 'enabled', 'firstName', 'lastName', "groupName", 'partyId', 'securityGroupId', 'securityGroupName', 'statusId', 'userLoginId'],
  };

  try {
    const resp = await UserService.fetchUsers(params);

    if (!commonUtil.hasError(resp) && resp.data.count) {
      currentUser.value = resp.data.docs[0];
    } else {
      throw resp.data;
    }
  } catch (error) {
    logger.error(error);
  }
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
