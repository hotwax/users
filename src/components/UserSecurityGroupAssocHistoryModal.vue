<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Security group history") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list v-if="userGroupAssocHistories.length">
      <ion-item v-for="assocHistory in userGroupAssocHistories" :key="assocHistory.groupId">
        <ion-label>
          {{ assocHistory.groupName }}
          <p>{{ assocHistory.groupId }}</p>
        </ion-label>

        <ion-badge color="dark" v-if="assocHistory.thruDate">{{ timeTillRun(assocHistory.thruDate) }}</ion-badge>
      </ion-item>
    </ion-list>
    <div class="empty-state" v-else>
      <p>{{ translate("No history found.") }}</p>
    </div>
  </ion-content>
</template>

<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { isValidPassword, showToast } from "@/utils";
import { hasError } from "@/adapter";
import { UserService } from "@/services/UserService";
import { Actions, hasPermission } from '@/authorization'
import logger from '@/logger';
import { DateTime } from "luxon";
export default defineComponent({
  name: "UserSecurityGroupAssocModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      securityGroups: 'util/getSecurityGroups',
    })
  },
  data() {
    return {
      userGroupAssocHistories: [] as any
    }
  },
  mounted() {
    console.log(this.selectedUser);
    this.fetchUserSecurityGroupAssoHistory()
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async fetchUserSecurityGroupAssoHistory() {
      const securityGroupNameByGroupId = {} as any;
      let userGroupAssocHistories = [] as any;
      try {
        const resp = await UserService.fetchUserSecurityGroupAssocHistory({
          entityName: "UserLoginAndSecurityGroup",
          inputFields: {
            userLoginId: this.selectedUser.userLoginId
          },
          filterByDate: "N",
          orderBy: "thruDate DESC",
          viewSize: 250
        })
        if(!hasError(resp)) {
          userGroupAssocHistories = resp.data.docs
          this.securityGroups.map((group: any) => securityGroupNameByGroupId[group.groupId] = group.groupName);
          userGroupAssocHistories.map((history: any) => {
            history["groupName"] = securityGroupNameByGroupId[history.groupId]
          })
        } else {
          throw resp.data;
        }
      } catch(error: any) {
        console.error(error);
      }
      this.userGroupAssocHistories = userGroupAssocHistories
    },
    timeTillRun(endTime: any) {
      const timeDiff = DateTime.fromMillis(endTime).diff(DateTime.local());
      return DateTime.local().plus(timeDiff).toRelative();
    }
  },
  setup() {
    const store = useStore();
    return {
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      hasPermission,
      lockClosedOutline,
      mailOutline,
      store,
      translate,
      Actions
    };
  },
});
</script>