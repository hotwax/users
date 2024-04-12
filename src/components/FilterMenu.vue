<template>
  <ion-menu type="overlay" side="end">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ translate("Filters") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item lines="none">
          <ion-icon :icon="idCardOutline" slot="start" />
          <ion-select :label="translate('Clearance')" interface="popover" v-model="query.securityGroup" @ionChange="closeMenu">
            <ion-select-option value="">{{ translate("All") }}</ion-select-option>
            <ion-select-option :value="securityGroup.groupId" :key="index" v-for="(securityGroup, index) in securityGroups">{{ securityGroup.groupName || securityGroup.groupId }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item lines="none">
          <ion-icon :icon="toggleOutline" slot="start" />
          <ion-select :label="translate('Status')" interface="popover" v-model="query.status" @ionChange="closeMenu">
            <ion-select-option value="">{{ translate("All") }}</ion-select-option>
            <ion-select-option value="Y">{{ translate("Active") }}</ion-select-option>
            <ion-select-option value="N">{{ translate("Inactive") }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="cloudyNightOutline"/>
          <ion-toggle v-model="query.hideDisabledUser" @ionChange="closeMenu">
            {{ translate("Hide disabled users") }}
          </ion-toggle>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonMenu,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  menuController
} from '@ionic/vue'
import { cloudyNightOutline, idCardOutline, toggleOutline } from 'ionicons/icons'
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { translate } from '@hotwax/dxp-components'
export default defineComponent({
  name: 'FilterMenu',
  components: {
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonMenu,
    IonTitle,
    IonToggle,
    IonToolbar,
    IonSelect,
    IonSelectOption
  },
  computed: {
    ...mapGetters({
      query: 'user/getQuery',
      securityGroups: 'util/getSecurityGroups'
    })
  },
  methods: {
    closeMenu() {
      // Query Updation and fetchUsers action automatically gets handled by the event handlers on Users page
      // Hence, we don't need to call query updation action and just need to close the menu.
      menuController.close()
    }
  },
  setup() {
    return {
      cloudyNightOutline,
      idCardOutline,
      toggleOutline,
      translate
    };    
  }
})
</script>