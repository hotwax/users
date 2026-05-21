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
      <ion-toolbar>
        <ion-searchbar :placeholder="translate('Search security groups')" v-model="queryString"/>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <template v-if="filteredSecurityGroups.length">
      <ion-list>
        <ion-item v-for="securityGroup in filteredSecurityGroups" :key="securityGroup.groupId">
          <ion-checkbox :checked="isSelected(securityGroup.groupId)" @ionChange="toggleSecurityGroupSelection(securityGroup)">
            <ion-label>
              {{ securityGroup.groupName || securityGroup.groupId }}
              <p>{{ securityGroup.groupId }}</p>
            </ion-label>
          </ion-checkbox>
        </ion-item>
      </ion-list>
      </template>
      <div v-else class="empty-state">
        <p>{{ translate("No security groups found") }}</p>
      </div>
    
      <ion-fab @click="saveSecurityGroups()" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="saveOutline" />  
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </template>
    
  <script setup lang="ts">
  import { computed, ref } from "vue";
  import { IonButtons, IonButton, IonCheckbox, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSearchbar, IonTitle, IonToolbar, modalController } from "@ionic/vue";
  import { closeOutline, saveOutline } from "ionicons/icons";
  import { translate } from '@hotwax/dxp-components'
  import { useUtilStore } from "@/store/util";
  
  const props = defineProps<{
    selectedSecurityGroups: any[]
  }>();

  const utilStore = useUtilStore();

  const queryString = ref('');
  const securityGroups = computed(() => utilStore.getSecurityGroups);
  const selectedSecurityGroupValues = ref<any[]>(JSON.parse(JSON.stringify(props.selectedSecurityGroups || [])));
  const filteredSecurityGroups = computed(() => {
    const query = queryString.value.toLowerCase();
    if (!query) return securityGroups.value;

    return securityGroups.value.filter((securityGroup: any) => {
      return securityGroup.groupId.toLowerCase().includes(query)
        || (securityGroup.groupName && securityGroup.groupName.toLowerCase().includes(query));
    });
  });

  const closeModal = () => {
    modalController.dismiss({ dismissed: true});
  };

  const saveSecurityGroups = () => {
    const securityGroupsToCreate = selectedSecurityGroupValues.value.filter((selectedGroup: any) => !props.selectedSecurityGroups.some((group: any) => group.groupId === selectedGroup.groupId));
    const securityGroupsToRemove = props.selectedSecurityGroups.filter((group: any) => !selectedSecurityGroupValues.value.some((selectedGroup: any) => group.groupId === selectedGroup.groupId));

    modalController.dismiss({
      dismissed: true,
      value: {
        selectedSecurityGroups: selectedSecurityGroupValues.value,
        securityGroupsToCreate,
        securityGroupsToRemove
      }
    });
  };

  const toggleSecurityGroupSelection = (updatedSecurityGroup: any) => {
    const selectedGroup = selectedSecurityGroupValues.value.some((group :any) => group.groupId === updatedSecurityGroup.groupId);
    if (selectedGroup) {
      selectedSecurityGroupValues.value = selectedSecurityGroupValues.value.filter((group :any) => group.groupId !== updatedSecurityGroup.groupId);
    } else {
      selectedSecurityGroupValues.value.push(updatedSecurityGroup);
    }
  };

  const isSelected = (securityGroupId: any) => {
    return selectedSecurityGroupValues.value.some((securityGroup :any) => securityGroup.groupId === securityGroupId);
  };
  </script>
<style scoped>
  ion-content {
    --padding-bottom: 80px;
  }
</style>
