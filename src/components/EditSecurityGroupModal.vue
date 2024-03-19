<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Update Security Group") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="updateSecurityGroup()">
      <ion-item>
        <ion-input :label="translate('Name')" v-model="group.groupName" />
      </ion-item>
      <ion-item>
        <ion-textarea :label="translate('Description')" v-model="group.description" />
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="updateSecurityGroup()" :disabled="!isGroupUpdated()">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { UtilService } from "@/services/UtilService";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";

export default defineComponent({
  name: "FacilityAddressModal",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonTextarea,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      currentGroup: 'permission/getCurrentGroup',
      securityGroups: 'util/getSecurityGroups',
    })
  },
  data() {
    return {
      group: {} as any,
    }
  },
  mounted() {
    this.group = JSON.parse(JSON.stringify(this.currentGroup))
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    isGroupUpdated() {
      return JSON.stringify(this.group) !== JSON.stringify(this.currentGroup)
    },
    async updateSecurityGroup() {
      try {
        const resp = await UtilService.updateSecurityGroup({
          groupId: this.currentGroup.groupId,
          groupName: this.group.groupName,
          description: this.group.description
        })

        if (!hasError(resp)) {
          showToast(translate("Security group updated successfully."))
          this.securityGroups.map((securityGroup: any) => {
            if(securityGroup.groupId === this.currentGroup.groupId) {
              securityGroup.groupName = this.group.groupName,
              securityGroup.description = this.group.description
            }
          })
          this.currentGroup.groupName = this.group.groupName,
          this.currentGroup.description = this.group.description
          await this.store.dispatch('util/updateSecurityGroup', this.securityGroups)
          await this.store.dispatch('permission/updateCurrentGroup', this.currentGroup)
          modalController.dismiss()
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate("Failed to update security group."))
        console.error(error)
      }
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>