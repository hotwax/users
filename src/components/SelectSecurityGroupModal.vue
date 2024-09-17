<template>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeModal"> 
            <ion-icon slot="icon-only" :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ translate("Select security groups") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-list>
        <ion-item v-for="securityGroup in securityGroups" :key="securityGroup.groupId">
          <ion-checkbox :checked="isSelected(securityGroup.groupId)" @ionChange="toggleSecurityGroupSelection(securityGroup)">
            <ion-label>
              {{ securityGroup.groupName || securityGroup.groupId }}
              <p>{{ securityGroup.groupId }}</p>
            </ion-label>
          </ion-checkbox>
        </ion-item>
      </ion-list>
    
      <ion-fab @click="saveSecurityGroups()" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="saveOutline" />  
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </template>
    
  <script lang="ts">
  import { 
    IonButtons,
    IonButton,
    IonCheckbox,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    modalController
  } from "@ionic/vue";
  import { defineComponent } from "vue";
  import { closeOutline, saveOutline } from "ionicons/icons";
  import { mapGetters, useStore } from "vuex";
  import { translate } from '@hotwax/dxp-components'
  
  export default defineComponent({
    name: "SelectSecurityGroupModal",
    components: { 
      IonButtons,
      IonButton,
      IonCheckbox,
      IonContent,
      IonFab,
      IonFabButton,
      IonHeader,
      IonIcon,
      IonItem,
      IonLabel,
      IonList,
      IonTitle,
      IonToolbar,
    },
    props: ["selectedSecurityGroups"],
    data() {
      return {
        selectedSecurityGroupValues: JSON.parse(JSON.stringify(this.selectedSecurityGroups)),
      }
    },
    computed: {
      ...mapGetters({
        securityGroups: 'util/getSecurityGroups'
      })
    },
    methods: {
      closeModal() {
        modalController.dismiss({ dismissed: true});
      },
      saveSecurityGroups() {
        const securityGroupsToCreate = this.selectedSecurityGroupValues.filter((selectedGroup: any) => !this.selectedSecurityGroups.some((group: any) => group.groupId === selectedGroup.groupId))
        const securityGroupsToRemove = this.selectedSecurityGroups.filter((group: any) => !this.selectedSecurityGroupValues.some((selectedGroup: any) => group.groupId === selectedGroup.groupId))
  
        modalController.dismiss({
          dismissed: true,
          value: {
            selectedSecurityGroups: this.selectedSecurityGroupValues,
            securityGroupsToCreate,
            securityGroupsToRemove
          }
        });
      },
      toggleSecurityGroupSelection(updatedSecurityGroup: any) {
        let selectedGroup = this.selectedSecurityGroupValues.some((group :any) => group.groupId === updatedSecurityGroup.groupId);
        if (selectedGroup) {
          this.selectedSecurityGroupValues = this.selectedSecurityGroupValues.filter((group :any) => group.groupId !== updatedSecurityGroup.groupId);
        } else {
          this.selectedSecurityGroupValues.push(updatedSecurityGroup);
        }
      },
      isSelected (securityGroupId: any) {
        return this.selectedSecurityGroupValues.some((securityGroup :any) => securityGroup.groupId === securityGroupId);
      }
    },
    setup() {
      const store = useStore();
  
      return {
        closeOutline,
        saveOutline,
        store,
        translate
      };
    },
  });
  </script>
<style scoped>
  ion-content {
    --padding-bottom: 80px;
  }
</style>