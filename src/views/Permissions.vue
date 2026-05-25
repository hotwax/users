<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Permissions") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="downloadCSVForPermissions()">
            <ion-icon :icon="downloadOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
        <aside>
          <h1>{{ translate("Security Groups") }}</h1>

          <ion-list>
            <ion-item v-for="group in securityGroups" :key="group?.groupId" button detail @click="updateCurrentGroup(group)">
              <ion-label :color="group.groupId === currentGroup?.groupId ? 'primary' : ''">
                <p class="overline">{{ group.groupId }}</p>
                {{ group?.groupName || group?.groupId }}
              </ion-label> 
            </ion-item>
          </ion-list>

          <ion-button @click="createGroup()" :disabled="!userStore.hasPermission('SECURITY_CREATE OR SECURITY_ADMIN')" fill="clear" expand="block">
            <ion-icon slot="start" :icon="addOutline" />
            <ion-label>{{ translate("Create security group") }}</ion-label>
          </ion-button>
        </aside>
        <main v-if="currentGroup?.groupId">
          <div class="section-header">
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>
                <ion-note class="overline">{{ currentGroup.groupId }}</ion-note>
                <h1>{{ currentGroup.groupName || currentGroup.groupId }}</h1>
                <p class="ion-text-wrap">{{ currentGroup.description }}</p>
              </ion-label>
              <ion-button slot="end" @click="editSecurityGroup()" fill="outline">{{ translate("Edit") }}</ion-button>
            </ion-item>
            <ion-button v-if="securityGroupUsers[currentGroup.groupId]" fill="clear" color="medium" @click="openCurrentGroupUsers()">
              {{ translate(securityGroupUsers[currentGroup.groupId] > 1 ? "users" : "user", { userCount: securityGroupUsers[currentGroup.groupId] }) }}
              <ion-icon :icon="openOutline" slot="end" />
            </ion-button>
          </div>
          <hr />
          <PermissionItems />
        </main>
        <main v-else class="empty-state">
          <p>{{ "Select a security group to view its details" }}</p>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar, alertController, modalController } from '@ionic/vue';
import { commonUtil, translate, emitter, logger } from '@common';
import { addOutline, downloadOutline, idCardOutline, openOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import PermissionItems from '@/components/PermissionItems.vue';
import { useUtilStore } from '@/store/util';
import { usePermissionStore } from '@/store/permission';
import { useUserStore } from '@/store/user';
import { DateTime } from 'luxon';
import EditSecurityGroupModal from '@/components/EditSecurityGroupModal.vue';

const router = useRouter();
const utilStore = useUtilStore();
const permissionStore = usePermissionStore();
const userStore = useUserStore();

const securityGroupUsers = ref<any>({});

const securityGroups = computed(() => utilStore.getSecurityGroups);
const permissionsByClassificationGroups = computed(() => permissionStore.getPermissionsByClassificationGroups);
const currentGroupPermissions = computed(() => permissionStore.getCurrentGroupPermissions);
const currentGroup = computed(() => permissionStore.getCurrentGroup);
const allPermissions = computed(() => permissionStore.getAllPermissions);

onMounted(async () => {
  await utilStore.getSecurityGroups();
  await utilStore.getClassificationSecurityGroups();
  if (!Object.keys(allPermissions.value).length) await permissionStore.fetchAllPermissions();
  if (!Object.keys(permissionsByClassificationGroups.value).length) await permissionStore.getPermissionsByClassificationGroups();
  if (currentGroup.value?.groupId) {
    await permissionStore.getPermissionsByGroup(currentGroup.value.groupId);
    await getUsersCount();
  }
});

const createGroup = () => {
  router.replace({ path: `/create-security-group/` });
};

const updateCurrentGroup = async (group: any) => {
  emitter.emit('presentLoader');
  permissionStore.updateCurrentGroup(group);
  await permissionStore.getPermissionsByGroup(currentGroup.value.groupId);
  await permissionStore.checkAssociated();
  await getUsersCount();
  permissionStore.updateQuery({ queryString: '', showSelected: false, classificationSecurityGroupId: '' });
  emitter.emit('dismissLoader');
};

const editSecurityGroup = async () => {
  const editSecurityGroupModal = await modalController.create({
    component: EditSecurityGroupModal
  });
  editSecurityGroupModal.present();
};

const getUsersCount = async () => {
  if (securityGroupUsers.value[currentGroup.value.groupId]) {
    return;
  }

  try {
    const resp = await permissionStore.getSecurityGroupUsers({
      entityName: "PartyAndUserLoginSecurityGroupDetails",
      noConditionFind: "Y",
      fromDateName: "relationshipFromDate",
      thruDateName: "relationshipThruDate",
      filterByDate: "Y",
      distinct: "Y",
      viewSize: 1,
      viewIndex: 0,
      fieldList: ['partyId', 'securityGroupName'],
      inputFields: {
        securityGroupId: currentGroup.value.groupId,
        roleTypeIdTo: "APPLICATION_USER"
      }
    });

    if (!commonUtil.hasError(resp)) {
      securityGroupUsers.value[currentGroup.value.groupId] = resp.data.count;
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
};

const openCurrentGroupUsers = async () => {
  userStore.updateQuery({ queryString: '', securityGroup: currentGroup.value.groupId, status: '', hideDisabledUser: true });
  router.push('users');
};

const downloadCSVForPermissions = async () => {
  if (currentGroup.value.groupId && !Object.keys(currentGroupPermissions.value).length) {
    const alert = await alertController.create({
      header: translate("No permissions associated"),
      message: translate("No permissions have been linked to this group yet. Permissions for a group cannot be downloaded."),
      buttons: [
        {
          text: translate("Dismiss"),
          role: "cancel"
        }
      ],
    });
    return alert.present();
  }

  let permissionsJson = [] as any;

  if (currentGroup.value.groupId) {
    Object.values(currentGroupPermissions.value).map((permission: any) => {
      permissionsJson.push({
        "Group ID": permission.groupId,
        "Permission ID": permission.permissionId,
        "Permission Desc": permission.permissionDescription,
        "Association date": DateTime.fromMillis(permission.fromDate).toFormat('dd-MM-yyyy')
      });
    });
  } else {
    permissionsJson = await downloadCSVForAllPermissionsCSV();
  }

  const fileName = `HotWaxSecurityGroupExport_${DateTime.now().toFormat('yyyy_MM_dd_HH:mm')}`;

  await commonUtil.jsonToCsv(permissionsJson, { download: true, name: fileName });
};

const downloadCSVForAllPermissionsCSV = async () => {
  const permissionsByGroup = [] as any;

  try {
    await Promise.allSettled(securityGroups.value.map(async (group: any) => {
      let viewIndex = 0, resp;
      do {
        resp = await permissionStore.fetchPermissionsByGroup({
          entityName: "SecurityGroupAndPermission",
          distinct: "Y",
          noConditionFind: "Y",
          filterByDate: "Y",
          viewSize: 250,
          viewIndex: viewIndex,
          inputFields: {
            groupId: group.groupId
          }
        });

        if (!commonUtil.hasError(resp) && resp.data.count) {
          resp.data.docs.map((permission: any) => {
            permissionsByGroup.push({
              "Group Id": permission.groupId,
              "Permission ID": permission.permissionId,
              "Permission Desc": permission.permissionDescription,
              "Association date": DateTime.fromMillis(permission.fromDate).toFormat('dd-MM-yyyy')
            });
          });
          viewIndex++;
        } else {
          throw resp.data;
        }
      } while (resp.data.docs.length >= 250);
    }));
  } catch (err) {
    logger.error(err);
  }

  return permissionsByGroup;
};
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header>ion-item {
  width: 50%;
}
</style>
