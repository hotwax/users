<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/permissions" slot="start"></ion-back-button>
        <ion-title>{{ translate("Create security group") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-list>
          <ion-item>
            <ion-input :label="translate('Name')" label-placement="floating" @ionBlur="formData.groupId ? null : setGroupId(formData.groupName)" v-model="formData.groupName" />
          </ion-item>
          <ion-item ref="groupId" lines="none">
            <ion-input :label="translate('Internal ID')" label-placement="floating" @ionChange="validateGroupId" @ionBlur="markGroupIdTouched" v-model="formData.groupId" :errorText="translate('Internal ID cannot be more than 20 characters.')" />
          </ion-item>
          <ion-item>
            <ion-textarea :label="translate('Description')" label-placement="floating" v-model="formData.description" />
          </ion-item>
        </ion-list>
  
        <div class="ion-text-center ion-margin">
          <ion-button @click="createGroup()">
            <ion-icon slot="start" :icon="addOutline" />
            {{ translate("Create security group") }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonInput,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import { addOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { generateInternalId, showToast } from "@/utils";
import { PermissionService } from "@/services/PermissionService";
import { hasError } from "@/adapter";
import logger from "@/logger";

export default defineComponent({
  name: "CreateSecurityGroup",
  components: {
    IonBackButton,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonPage,
    IonTextarea,
    IonTitle,
    IonToolbar,
    IonInput
  },
  data() {
    return {
      formData: {
        groupName: '',
        groupId: '',
        description: ''
      }
    }
  },
  computed: {
    ...mapGetters({
      securityGroups: 'util/getSecurityGroups',
      permissionsByGroup: 'permission/getPermissionsByGroup'
    })
  },
  methods: {
    setGroupId(groupName: string) {
      this.formData.groupId = generateInternalId(groupName)
    }, 
    validateGroupId(event: any) {
      const value = event.target.value;
      (this as any).$refs.groupId.$el.classList.remove('ion-valid');
      (this as any).$refs.groupId.$el.classList.remove('ion-invalid');

      if (value === '') return;

      this.formData.groupId.length <= 20
        ? (this as any).$refs.groupId.$el.classList.add('ion-valid')
        : (this as any).$refs.groupId.$el.classList.add('ion-invalid');
    },
    markGroupIdTouched() {
      (this as any).$refs.groupId.$el.classList.add('ion-touched');
    },
    async createGroup() {
      if (!this.formData.groupName?.trim()) {
        showToast(translate("Security group name is required."))
        return
      }

      if (this.formData.groupId.length > 20) {
        showToast(translate("Internal ID cannot be more than 20 characters."))
        return
      }

      // In case the user does not lose focus from the facility name input
      // and click on create the button, we need to set the internal id manually
      if (!this.formData.groupId) {
        this.setGroupId(this.formData.groupName)
      }

      try {
        const resp = await PermissionService.createSecurityGroup(this.formData)

        if(!hasError(resp)) {
          showToast(translate("Security group created successfully."))
          await this.store.dispatch('util/updateSecurityGroup', this.securityGroups.push(this.formData))
          await this.store.dispatch('permission/updateCurrentGroup', this.formData)
          await this.store.dispatch('permission/updateQuery', {queryString: '', showAllSelected: false})
          await this.store.dispatch('permission/checkAssociated')
          this.router.replace('/add-permissions')
        } else {
          throw resp.data
        }
      } catch(err: any) {
        logger.error(err);
        if (err.response?.data?.error?.message) {
          showToast(err.response.data.error.message)
        } else {
          showToast(translate("Failed to create security group."))
        }
      }
    }
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      store,
      router,
      addOutline,
      translate
    };
  }
});
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>