<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button v-if="redirectedFromUrl" @click="goBack($event)" slot="start" default-href="/tabs/users" />
        <ion-back-button v-else-if="hasPermission('USERS_LIST_VIEW')" slot="start" default-href="/tabs/users" />
        <ion-title>{{ translate("User details") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!isUserFetched" class="empty-state">
        <ion-item lines="none">
          <ion-spinner color="secondary" name="crescent" slot="start" />
          {{ translate("Fetching user details") }}
        </ion-item>
      </div>
      <div v-else-if="!Object.keys(selectedUser).length" class="empty-state">
        <p>{{ translate("User not found") }}</p>
      </div>
      <main v-else>
        <section class="user-details">
          <ion-card v-if="isUserFetched || Object.keys(selectedUser).length" class="profile">
            <div>
              <ion-item lines="none">
                <ion-avatar slot="start">
                  <Image :src="imageUrl"/>
                </ion-avatar>
                <ion-label class="ion-margin-start">
                  <h1 v-if="selectedUser.groupName">{{ selectedUser.groupName }}</h1>
                  <h1 v-else>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h1>
                  <p>{{ selectedUser.userLoginId }}</p>
                  <ion-badge v-if="selectedUser.userLoginId === userProfile.userLoginId">{{ translate("Your user") }}</ion-badge>
                </ion-label>
                <ion-button fill="outline" @click="editName">{{ translate('Edit') }}</ion-button>
              </ion-item>
            </div>
            <div v-if="isUserFetched">
              <ion-item @click="openCreatedByUserDetail" detail button>
                <ion-icon :icon="bodyOutline" slot="start" />
                <ion-label v-if="isCreatedBySystem()">{{ translate("Created by", { userLoginId: "&#129502;" }) }}</ion-label>
                <ion-label v-else>{{ translate("Created by", { userLoginId: selectedUser.createdByUserLogin }) }}</ion-label>
              </ion-item>
              <ion-item>
                <ion-icon :icon="cameraOutline" slot="start" />
                <ion-label v-if="!imageUrl">{{ translate("Add profile picture") }}</ion-label>
                <ion-label v-else>{{ translate("Replace profile picture") }}</ion-label>
                <input @change="uploadImage" class="ion-hide" type="file" accept="image/*" id="profilePic"/>
                <label for="profilePic">{{ translate("Upload") }}</label>
              </ion-item>
              <ion-item lines="none" :disabled="!hasPermission(Actions.APP_UPDT_BLOCK_LOGIN)">
                <ion-icon :icon="cloudyNightOutline" slot="start" />
                <ion-toggle :checked="selectedUser.statusId === 'PARTY_DISABLED'" @click.prevent="updateUserStatus($event)">
                  {{ translate("Disable user") }}
                </ion-toggle>
              </ion-item>
            </div>
            <div v-else>
              <ion-item detail button>
                <ion-icon :icon="bodyOutline" slot="start" />
                <ion-label >{{ translate("Created by", {userLoginId: selectedUser.createdByUserLogin}) }}</ion-label>
              </ion-item>
              <ion-item>
                <ion-icon :icon="cameraOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="cloudyNightOutline" slot="start" />
                <ion-toggle :disabled="!hasPermission(Actions.APP_UPDT_BLOCK_LOGIN)" :checked="selectedUser.statusId === 'PARTY_ENABLED'" @click.prevent="updateUserStatus($event)">
                  {{ translate("Disable user") }}
                </ion-toggle>
              </ion-item>
            </div>
          </ion-card>
          <ion-card v-else class="profile">
            <div>
              <ion-item lines="none">
                <ion-skeleton-text animated style="width: 10%;"/>
                <ion-label class="ion-margin-start">
                  <ion-skeleton-text animated />
                  <ion-skeleton-text animated />
                  <ion-skeleton-text animated />
                  <ion-skeleton-text animated />
                </ion-label>
              </ion-item>
            </div>
            <div>
              <ion-item>
                <ion-icon :icon="bodyOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item>
                <ion-icon :icon="cameraOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="cloudyNightOutline" slot="start" />
                <ion-label>{{ translate("Disable user") }}</ion-label>
                <ion-skeleton-text animated style="width: 30%;" />
              </ion-item>
            </div>
          </ion-card>
        </section>

        <section class="user-details">
          <ion-card v-if="isUserFetched || selectedUser.userLoginId">
            <ion-card-header>
              <ion-card-title>
                {{ translate('Login details') }}
              </ion-card-title>
            </ion-card-header>
            <template v-if="selectedUser.userLoginId">
              <ion-list>
                <!-- TODO verify disable message -->
                <!-- <ion-item v-if="selectedUser.enabled === 'N'" color="light" lines="none">
                  <ion-label class="ion-text-wrap">
                    <p class="overline">{{ translate("User disabled") }}</p>
                    <p>{{ translate('This user was disabled due to repeated failed password attempts') }}</p>
                  </ion-label>
                  <ion-icon slot="end" color="danger" :icon="warningOutline" />
                </ion-item> -->
                <ion-item>
                  <ion-label>{{ translate('Username') }}</ion-label>
                  <ion-label slot="end">{{ selectedUser.userLoginId }}</ion-label>
                </ion-item>
                <ion-item :disabled="!hasPermission(Actions.APP_UPDT_BLOCK_LOGIN) || selectedUser.statusId !== 'PARTY_ENABLED'" >
                  <ion-toggle @click.prevent="updateUserLoginStatus($event)" :checked="selectedUser.enabled == 'N'">
                    {{ translate("Block login") }}
                  </ion-toggle>
                </ion-item>
              </ion-list>
              <div class="login-detail-actions">
                <ion-button :disabled="!hasPermission(Actions.APP_UPDT_PASSWORD)" @click="resetPassword()" fill="outline" color="warning">
                  {{ translate('Reset password') }}
                </ion-button>
                <ion-button :disabled="!hasPermission(Actions.APP_UPDT_BLOCK_LOGIN) || selectedUser.hasLoggedOut === 'Y'" @click="confirmForceLogout()" fill="outline" color="danger">
                  {{ translate('Force logout') }}
                </ion-button>
              </div>
                  
            </template>
            <template v-else>
              <ion-list>
                <ion-item lines="full">
                  <ion-input label-placement="fixed" name="username" v-model="username" id="username">
                    <div slot="label">{{ translate("Username") }} <ion-text color="danger">*</ion-text></div>
                  </ion-input>
                </ion-item>
                <ion-item ref="password" lines="none">
                  <ion-input 
                    label-placement="fixed" 
                    :placeholder="translate('Default password')" 
                    name="password" 
                    v-model="password" 
                    id="password"
                    :type="showPassword ? 'text' : 'password'" 
                    @ionInput="validatePassword" 
                    @ionBlur="markPasswordTouched"
                    :helper-text="translate('will be asked to reset their password when they login to OMS.', { name: selectedUser.firstName ? selectedUser.firstName : selectedUser.groupName })"
                    :error-text="translate('Password should be at least 5 characters long and contain at least one number, alphabet and special character.')"
                  >
                    <div slot="label">{{ translate("Password") }} <ion-text color="danger">*</ion-text></div>
                    <ion-button size="default" @click="showPassword = !showPassword" slot="end" fill="clear">
                      <ion-icon :icon="showPassword ? eyeOutline : eyeOffOutline" slot="icon-only" />
                    </ion-button>
                  </ion-input>
                </ion-item>
              </ion-list>
              <ion-button @click="createNewUserLogin()" :disabled="!hasPermission(Actions.APP_UPDT_BLOCK_LOGIN)" fill="outline" expand="block">
                {{ translate('Add credentials') }}
              </ion-button>
            </template>
          </ion-card>
          <ion-card v-else>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Login details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item>
                <ion-label>{{ translate('Username') }}</ion-label>
                <ion-skeleton-text animated style="width: 40%;" />
              </ion-item>
              <ion-item>
                <ion-label>{{ translate("Block login") }}</ion-label>
                <ion-skeleton-text animated style="width: 40%;" />
              </ion-item>
            </ion-list>
            <ion-button disabled fill="outline" color="warning" expand="block">
              {{ translate('Reset password') }}
            </ion-button>
          </ion-card>
  
          <ion-card v-if="isUserFetched">
            <ion-card-header>
              <ion-card-title>
                {{ translate('Contact details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item>
                <ion-icon :icon="mailOutline" slot="start" />
                <ion-label class="ion-text-wrap">{{ selectedUser?.emailDetails ? selectedUser.emailDetails.email : translate('Email') }}</ion-label>
                <ion-button size="default" v-if="selectedUser?.emailDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'email', selectedUser.emailDetails.email)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
                <ion-button  size="default" v-else @click="addContactField('email')" slot="end" fill="clear">
                  <ion-icon slot="icon-only" :icon="addCircleOutline" />
                </ion-button>
              </ion-item>
              <ion-item>
                <ion-icon :icon="callOutline" slot="start" />
                <ion-label class="ion-text-wrap">{{ selectedUser?.phoneNumberDetails ? selectedUser.phoneNumberDetails.contactNumber : translate('Phone number') }}</ion-label>
                <ion-button size="default" v-if="selectedUser?.phoneNumberDetails" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'phoneNumber', selectedUser.phoneNumberDetails.contactNumber)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
                <ion-button size="default" v-else @click="addContactField('phoneNumber')" slot="end" fill="clear">
                  <ion-icon slot="icon-only" :icon="addCircleOutline" />
                </ion-button>
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="businessOutline" slot="start" />
                <ion-label class="ion-text-wrap">{{ selectedUser.externalId ? selectedUser.externalId : translate('External ID') }}</ion-label>
                <ion-button size="default" v-if="selectedUser.externalId" slot="end" fill="clear" color="medium" @click="openContactActionsPopover($event, 'externalId', selectedUser.externalId)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
                <ion-button size="default" v-else @click="addContactField('externalId')" slot="end" fill="clear">
                  <ion-icon slot="icon-only" :icon="addCircleOutline" />
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card>
          <ion-card v-else>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Contact details') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item>
                <ion-icon :icon="mailOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item>
                <ion-icon :icon="callOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item lines="none">
                <ion-icon :icon="businessOutline" slot="start" />
                <ion-skeleton-text animated />
              </ion-item>
            </ion-list>
          </ion-card>
        </section>

        <div class="section-header">
          <h1>{{ translate('Permissions') }}</h1>
        </div>

        <section class="user-details">
          <ion-card v-if="isUserFetched">
            <ion-card-header>
              <ion-card-title>
                {{ translate('Clearance') }}
              </ion-card-title>
            </ion-card-header>

            <ion-list>
              <ion-list-header color="light">
                <ion-label>{{ translate('Security Group') }}</ion-label>
                <ion-button :disabled="!hasPermission(Actions.APP_SECURITY_GROUP_CREATE) || !selectedUser.userLoginId" @click="selectSecurityGroup()" v-if="userSecurityGroups.length">
                  {{ translate('Add') }}
                  <ion-icon slot="end" :icon="addCircleOutline" />
                </ion-button>
              </ion-list-header>
              <ion-button :disabled="!hasPermission(Actions.APP_SECURITY_GROUP_CREATE) || !selectedUser.userLoginId" v-if="!userSecurityGroups.length" @click="selectSecurityGroup()" fill="outline" expand="block" class="ion-margin">
                <ion-icon :icon="addOutline" slot='start' />
                {{ translate('Add to security group') }}
              </ion-button>
              <ion-item v-if="!selectedUser.userLoginId">
                <ion-label>{{ translate('Security groups can only be assigned after a login is created. Please add login credentials for above.') }}</ion-label>
              </ion-item>
              <ion-item v-else>
                <ion-label>{{ translate("View history") }}</ion-label>
                <ion-button  size="default" slot="end" fill="clear" color="medium" @click="openUserSecurityGroupAssocHistoryModal($event)">
                  <ion-icon slot="icon-only" :icon="timeOutline" />
                </ion-button>
              </ion-item>

              <template v-if="!hasPermission(Actions.APP_SUPER_USER) && checkUserAssociatedSecurityGroup('SUPER')">
                <ion-item lines="none" :disabled="true">
                  <ion-label>{{ translate('Super') }}</ion-label>
                  <ion-button  size="default" slot="end" fill="clear" color="medium">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                </ion-item>
              </template>
              <template v-else>
                <ion-item :disabled="!hasPermission(Actions.APP_SECURITY_GROUP_CREATE)" v-for="securityGroup in userSecurityGroups" :key="securityGroup.groupId">
                  <ion-label>
                    {{ getSecurityGroupName(securityGroup.groupId) }}
                  </ion-label>
                  <ion-button size="default" slot="end" fill="clear" color="medium" @click="openSecurityGroupActionsPopover($event, securityGroup)">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                </ion-item>
              </template>

            <!--<ion-item lines="none">
              <template v-if="!hasPermission(Actions.APP_SUPER_USER) && selectedUser.securityGroup?.groupId === 'SUPER'">
                <ion-label>{{ translate('Security Group') }}</ion-label>        
                <ion-label slot="end">{{ translate('Super') }}</ion-label>
              </template>
              <ion-select v-else :label="translate('Security Group')" interface="popover" :disabled="!hasPermission(Actions.APP_SECURITY_GROUP_CREATE) || !selectedUser.userLoginId" :value="selectedUser.securityGroup?.groupId" @ionChange="updateSecurityGroup($event)">
                <ion-select-option v-for="securityGroup in getSecurityGroups(securityGroups)" :key="securityGroup.groupId" :value="securityGroup.groupId">
                  {{ securityGroup.groupName || securityGroup.groupId}}
                </ion-select-option>
                <ion-select-option value="">{{ translate("None") }}</ion-select-option>
              </ion-select>
            </ion-item>-->

              <ion-list-header color="light">
                <ion-label>{{ translate('Product stores') }}</ion-label>
                <ion-button :disabled="!hasPermission(Actions.APP_UPDT_PRODUCT_STORE_CONFG)" @click="selectProductStore()" v-if="userProductStores.length">
                  {{ translate('Add') }}
                  <ion-icon slot="end" :icon="addCircleOutline" />
                </ion-button>
              </ion-list-header>

              <ion-button :disabled="!hasPermission(Actions.APP_UPDT_PRODUCT_STORE_CONFG)" v-if="!userProductStores.length" @click="selectProductStore()" fill="outline" expand="block" class="ion-margin">
                <ion-icon :icon="addOutline" slot='start' />
                {{ translate('Add to a product store') }}
              </ion-button>

              <ion-item :disabled="!hasPermission(Actions.APP_UPDT_PRODUCT_STORE_CONFG)" v-for="store in userProductStores" :key="store.productStoreId">
                <ion-label>
                  <h2>{{ store.storeName || store.productStoreId }}</h2>
                  <p>{{ getRoleTypeDesc(store.roleTypeId) }}</p>
                </ion-label>
                <ion-button size="default" slot="end" fill="clear" color="medium" @click="openProductStoreActionsPopover($event, store)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
              </ion-item>
            </ion-list>

          </ion-card>
          <ion-card v-else>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Clearance') }}
              </ion-card-title>
            </ion-card-header>
            <ion-item lines="none">
              <ion-icon :icon="businessOutline" slot="start" />
              <ion-label>{{ translate('Security Group') }}</ion-label>        
              <ion-skeleton-text animated style="width: 40%;" />
            </ion-item>
            <ion-button disabled fill="outline" expand="block">
              <ion-icon :icon="addOutline" slot='start' />
              {{ translate('Add to a product store') }}
            </ion-button>
          </ion-card>

          <ion-card v-if="isUserFetched">
            <ion-card-header>
              <ion-card-title>
                {{ translate('Fulfillment') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item :disabled="!hasPermission(Actions.APP_UPDT_PICKER_CONFG)">
                <ion-toggle @click.prevent="updatePickerRoleStatus($event)" :checked="selectedUser?.isWarehousePicker">
                  {{ translate("Show as picker") }}
                </ion-toggle>
              </ion-item>
              <ion-item v-if="isUserFulfillmentAdmin">
                <ion-label>{{ translate("This user has 'STOREFULFILLMENT_ADMIN' permission, enabling access to all facilities.") }}</ion-label>
              </ion-item>
              <ion-item lines="none" button detail @click="selectFacility()" :disabled="!hasPermission(Actions.APP_UPDT_FULFILLMENT_FACILITY) || checkUserAssociatedSecurityGroup('INTEGRATION')">
                <ion-label>{{ getUserFacilities().length === 1 ? translate('Added to 1 facility') : translate('Added to facilities', { count: getUserFacilities().length }) }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-card>
          <ion-card v-else>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Fulfillment') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item>
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item lines="none">
                <ion-skeleton-text animated />
              </ion-item>
            </ion-list>
          </ion-card>

          <ion-card v-if="isUserFetched">
            <ion-card-header>
              <ion-card-title>
                {{ translate('Favorites') }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
            {{ translate('Select your favorites to preselect them across all applications') }}
          </ion-card-content>
            <ion-list>
              <ion-item>
                <ion-select :label="translate('Product store')" interface="popover" :value="selectedUser.favoriteProductStorePref?.userPrefValue ? selectedUser.favoriteProductStorePref?.userPrefValue : ''" @ionChange="updateFavoriteProductStore($event)" :disabled="!selectedUser?.userLoginId">
                  <ion-select-option v-for="productStore in userProductStores" :key="productStore.productStoreId" :value="productStore.productStoreId">
                    {{ productStore.storeName || productStore.productStoreId}}
                  </ion-select-option>
                  <ion-select-option value="">{{ translate("None") }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item lines="none">
                <ion-select :label="translate('Shopify shop')" interface="popover" :value="selectedUser.favoriteShopifyShopPref?.userPrefValue ? selectedUser.favoriteShopifyShopPref?.userPrefValue : ''" @ionChange="updateFavoriteShopifyShop($event)" :disabled="!selectedUser?.userLoginId">
                  <ion-select-option v-for="shopifyShop in shopifyShopsForProductStore" :key="shopifyShop.shopId" :value="shopifyShop.shopId">
                    {{ shopifyShop.name || shopifyShop.shopId }}
                  </ion-select-option>
                  <ion-select-option value="">{{ translate("None") }}</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </ion-card>
          <ion-card v-else>
            <ion-card-header>
              <ion-card-title>
                {{ translate('Favorites') }}
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item>
                <ion-skeleton-text animated />
              </ion-item>
              <ion-item lines="none">
                <ion-skeleton-text animated />
              </ion-item>
            </ion-list>
          </ion-card>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>
<script lang="ts">
import {
  alertController,
  IonAvatar,
  IonBackButton,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex'
import {
  addOutline,
  addCircleOutline,
  bodyOutline,
  businessOutline,
  callOutline,
  cameraOutline,
  cloudyNightOutline,
  ellipsisVerticalOutline,
  eyeOffOutline,
  eyeOutline,
  mailOutline,
  timeOutline,
  warningOutline,
} from 'ionicons/icons';
import { translate } from '@hotwax/dxp-components';
import ContactActionsPopover from '@/components/ContactActionsPopover.vue'
import ProductStoreActionsPopover from '@/components/ProductStoreActionsPopover.vue'
import SecurityGroupActionsPopover from '@/components/SecurityGroupActionsPopover.vue'
import ResetPasswordModal from '@/components/ResetPasswordModal.vue'
import SelectFacilityModal from '@/components/SelectFacilityModal.vue'
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import SelectSecurityGroupModal from '@/components/SelectSecurityGroupModal.vue'
import UserSecurityGroupAssocHistoryModal from '@/components/UserSecurityGroupAssocHistoryModal.vue'
import { UserService } from "@/services/UserService";
import { isValidEmail, isValidPassword, showToast } from "@/utils";
import { hasError } from '@/adapter';
import { DateTime } from "luxon";
import Image from "@/components/Image.vue";
import { Actions, hasPermission } from '@/authorization'
import emitter from "@/event-bus";
import logger from '@/logger';

export default defineComponent({
  name: "UserDetails",
  components: {
    IonAvatar,
    IonBackButton,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonSkeletonText,
    IonSpinner,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
    Image
  },
  computed: {
    ...mapGetters({
      selectedUser: 'user/getSelectedUser',
      userProductStores: 'user/getUserProductStores',
      userSecurityGroups: 'user/getUserSecurityGroups',
      getRoleTypeDesc: 'util/getRoleTypeDesc',
      securityGroups: 'util/getSecurityGroups',
      userProfile: 'user/getUserProfile',
      baseUrl: 'user/getBaseUrl',
      shopifyShops: 'util/getShopifyShops',
      organizationPartyId: 'util/getOrganizationPartyId',
      redirectedFromUrl: 'user/getRedirectedFromUrl'
    })
  },
  props: ['partyId'],
  data() {
    return {
      OPTIONS: {
        email: {
          header: 'Add email',
          placeholder: 'Email'
        },
        phoneNumber: {
          header: 'Add phone number',
          placeholder: 'Phone number'
        },
        externalId: {
          header: 'Add external ID',
          placeholder: 'External ID'
        }
      } as any,
      username: "",
      password: "",
      isUserEnabled: false as boolean,
      imageUrl: "",
      isUserFetched: false,
      showPassword: false,
      shopifyShopsForProductStore: [] as any,
      isUserFulfillmentAdmin: false
    }
  },
  async ionViewWillLeave() {
    await this.store.dispatch("user/updateRedirectedFromUrl", "")
  },
  async ionViewWillEnter() {
    this.isUserFetched = false
    await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId, isFetchRequired: true });
    await this.fetchProfileImage()
    await Promise.all([this.store.dispatch('util/getSecurityGroups'), this.store.dispatch('util/fetchShopifyShopConfigs')]);
    const productStoreId = this.selectedUser.favoriteProductStorePref?.userPrefValue;
    if (productStoreId) {
      this.getShopifyShops(productStoreId);
    }
    this.isUserFulfillmentAdmin = this.selectedUser.securityGroups?.length ? await UserService.isUserFulfillmentAdmin(this.selectedUser.securityGroups.map((group: any) => group.groupId)) : false
    this.isUserFetched = true
    this.username = this.selectedUser.groupName ? (this.selectedUser.groupName)?.toLowerCase() : (`${this.selectedUser.firstName}.${this.selectedUser.lastName}`?.toLowerCase())
  },
  methods: {
    checkUserAssociatedSecurityGroup(securityGroupId: any) {
      return this.userSecurityGroups?.some((userSecurityGroup:any) => userSecurityGroup.groupId === securityGroupId)
    },
    getSecurityGroupName(securityGroupId: any) {
      const group = this.securityGroups.find((group: any) => group.groupId === securityGroupId);
      return group?.groupName || group?.groupId || null;
    },
    getShopifyShops(productStoreId: string) {
      this.shopifyShopsForProductStore = this.shopifyShops.filter((shopifyShop:any) => shopifyShop.productStoreId === productStoreId);
    },
    updateFavoriteProductStore(event: any) {
      const selectedProductStoreId = event.target.value;
      if (selectedProductStoreId && selectedProductStoreId !== this.selectedUser?.favoriteProductStorePref?.userPrefValue) {
        this.store.dispatch('user/setFavoriteProductStore', {"userLoginId": this.selectedUser?.userLoginId, "productStoreId": selectedProductStoreId})
        .then(() => {
          this.getShopifyShops(selectedProductStoreId);
          showToast(translate('Favorite product store updated successfully.'));
        }).catch(() =>{
          showToast(translate("Failed to set favorite product store."));
        })
      }
    },
    goBack($event: any) {
      $event.preventDefault();
      // Going 2 routes back, as we have login route as well in the history causing error when using back method or -1
      window.history.go(-2)
    },
    updateFavoriteShopifyShop(event: any) {
      const selectedShopId = event.target.value;
      if (selectedShopId && selectedShopId !== this.selectedUser?.favoriteShopifyShopPref?.userPrefValue) {
        this.store.dispatch('user/setFavoriteShopifyShop', {"userLoginId": this.selectedUser?.userLoginId, "shopId": selectedShopId})
        .then(() => {
          showToast(translate('Favorite shopify shop updated successfully.'));
        }).catch(() => {
          showToast(translate("Failed to set favorite shopify shop."));
        })
      }
    },
    async openContactActionsPopover(event: Event, type: string, value: string) {
      const contactActionsPopover = await popoverController.create({
        component: ContactActionsPopover,
        event,
        componentProps: {
          type,
          placeholder: this.OPTIONS[type].placeholder,
          value,
          contactMechId: type === 'email'
            ? this.selectedUser.emailDetails.contactMechId
            : (type === 'phoneNumber'
              ? this.selectedUser.phoneNumberDetails.contactMechId
              : '')
        },
        showBackdrop: false,
      });
      return contactActionsPopover.present();
    },
    async openCreatedByUserDetail() {
      if(this.isCreatedBySystem()) {
        window.open('https://youtu.be/dQw4w9WgXcQ?si=cPE1jkfRLPiebJuW', '_blank');
      } else {
        this.router.push({ path: `/user-details/${this.selectedUser.createdByUserPartyId}` })
      }
    },
    isCreatedBySystem() {
      return !this.selectedUser.createdByUserLogin || this.selectedUser.createdByUserLogin === 'system'
    },
    async addContactField(type: string) {
      const contactUpdateAlert = await alertController.create({
        header: translate(this.OPTIONS[type].header),
        inputs:  [{
          // TODO add validation for phone
          name: "input",
          placeholder: translate(this.OPTIONS[type].placeholder),
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Save'),
          handler: async (result) => {
            const input = result.input.trim()
            if (!input) {
              showToast(translate('Please enter a value'))
              return false // returning false will not close the input
            }

            let selectedUser = JSON.parse(JSON.stringify(this.selectedUser))
            try {
              if (type === 'email') {
                if (!isValidEmail(input)) {
                  showToast(translate('Invalid email address.'))
                  return false
                }

                const resp = await UserService.createUpdatePartyEmailAddress({
                  emailAddress: input,
                  partyId: this.selectedUser.partyId,
                  contactMechPurposeTypeId: 'PRIMARY_EMAIL'
                })
                if (hasError(resp)) resp.data 
                selectedUser = {
                  ...selectedUser,
                  emailDetails: {
                    email: input,
                    contactMechId: resp.data.contactMechId
                  }
                }
              } else if (type === 'phoneNumber') {
                const resp = await UserService.createUpdatePartyTelecomNumber({
                  contactNumber: input,
                  partyId: this.selectedUser.partyId,
                  contactMechPurposeTypeId: 'PRIMARY_PHONE'
                })
                if (hasError(resp)) resp.data
                selectedUser = {
                  ...selectedUser,
                  phoneNumberDetails: {
                    contactNumber: input,
                    contactMechId: resp.data.contactMechId
                  }
                }
              } else {
                let resp = {} as any
                if (this.selectedUser.partyTypeId === 'PERSON') {
                  resp = await UserService.updatePerson({
                    externalId: input,
                    partyId: this.selectedUser.partyId,
                    firstName: this.selectedUser.firstName,
                    lastName: this.selectedUser.lastName
                  })
                } else {
                  resp = await UserService.updatePartyGroup({
                    externalId: input,
                    partyId: this.selectedUser.partyId,
                    groupName: this.selectedUser.groupName
                  })
                }
                if (hasError(resp)) resp.data
                selectedUser = {
                  ...selectedUser,
                  externalId: input
                }
              }
              this.store.dispatch('user/updateSelectedUser', selectedUser)
              showToast(translate(`${this.OPTIONS[type].placeholder} added successfully.`))
            } catch (error) {
              showToast(translate(`Failed to add ${type === 'email' ? 'email' : (type === 'phoneNumber' ? 'phone number' : 'external ID')}.`))
              logger.error(error)
            }
            return true
          }
        }]
      })
      await contactUpdateAlert.present()
    },
    validatePassword(event: any) {
      const value = event.target.value;
      (this as any).$refs.password.$el.classList.remove('ion-valid');
      (this as any).$refs.password.$el.classList.remove('ion-invalid');

      if (value === '') return;

      isValidPassword(value)
        ? (this as any).$refs.password.$el.classList.add('ion-valid')
        : (this as any).$refs.password.$el.classList.add('ion-invalid');
    },
    markPasswordTouched() {
      (this as any).$refs.password.$el.classList.add('ion-touched');
    },
    async createNewUserLogin() {
      this.username = this.username.trim()
      let missingFields = ''

      if(!this.password && !this.username) {
        missingFields = 'username and password'
      } else if(!this.password) {
        missingFields = 'password'
      } else if(!this.username){
        missingFields = 'username'
      }
      
      if (!this.password || !this.username) {
        showToast(translate("Please add a to create a user login", { missingFields }))
        return
      }

      if(await UserService.isUserLoginIdAlreadyExists(this.username)) {
        return;
      }

      try {
        const resp = await UserService.createNewUserLogin({
          partyId: this.partyId,
          currentPassword: this.password,
          currentPasswordVerify: this.password,
          userLoginId: this.username,
          enabled: 'Y',
          userPrefTypeId: 'ORGANIZATION_PARTY',
          userPrefValue: this.organizationPartyId,
        })
        if (!hasError(resp)) {
          await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId, isFetchRequired: true });
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Something went wrong.'));
        logger.error(error)
      }
    },
    async resetPassword() {
      const resetPasswordModal = await modalController.create({
        component: ResetPasswordModal,
        componentProps: {
          email: this.selectedUser.emailDetails?.email,
          userLoginId: this.selectedUser.userLoginId
        }
      });

      return resetPasswordModal.present();
    },
    async confirmForceLogout() {
      const message = 'Are you sure you want to perform this action?'
      const alert = await alertController.create({
        header: translate("Force logout user"),
        message: translate(message),
        buttons: [
          {
            text: translate("No"),
          },
          {
            text: translate("Yes"),
            handler: async () => {
              await this.forceLogout();
            }
          }
        ],
      });
      return alert.present();
    },
    async forceLogout() {
      try {
        const resp = await UserService.forceLogout({
          userLoginId: this.selectedUser.userLoginId
        })
        if (hasError(resp)) {
          throw resp
        }
        await this.store.dispatch("user/getSelectedUserDetails", { partyId: this.partyId, isFetchRequired: true });
        showToast(translate('User has been logged out.'));
      } catch (error) {
        showToast(translate('Failed to perform force logout.'));
        logger.error(error)
      }
    },
    async updateUserLoginStatus(event: any) {
      event.stopImmediatePropagation();

      const isChecked = !event.target.checked;
      const header = isChecked ? 'Block user login' : 'Unblock user login'
      const message = isChecked ? 'Block this user from logging into HotWax Commerce. Login can be re-enabled by disabling this setting' : 'Unblocking a user will allow them to login to the OMS again with their credentials.'

      const alert = await alertController.create({
        header: translate(header),
        message: translate(message),
        buttons: [{
          text: translate('No'),
          role: ''
        }, {
          text: translate('Yes'),
          role: 'success',
          handler: async () => {
            try {
              const resp = await UserService.updateUserLoginStatus({
                enabled: isChecked ? 'N' : 'Y',
                partyId: this.partyId,
                userLoginId: this.selectedUser.userLoginId
              })
              if (!hasError(resp)) {
                showToast(translate('User login status updated successfully.'))
                // updating toggle state on success
                event.target.checked = isChecked
                this.selectedUser.enabled = isChecked ? 'N' : 'Y'
              } else {
                throw resp.data
              }
            } catch (error) {
              showToast(translate('Failed to update user login status.'))
              logger.error(error)
            }
          }
        }],
      });

      await alert.present();
    },
    async openSecurityGroupActionsPopover(event: Event, securityGroup: any) {
      const securityGroupActionsPopover = await popoverController.create({
        component: SecurityGroupActionsPopover,
        componentProps: {
          securityGroup : {...securityGroup, groupName: this.getSecurityGroupName(securityGroup.groupId)}
        },
        event,
        showBackdrop: false,
      });
      securityGroupActionsPopover.present();

      const result = await securityGroupActionsPopover.onDidDismiss();
      this.isUserFulfillmentAdmin = result.data.length ? await UserService.isUserFulfillmentAdmin(result.data.map((group: any) => group.groupId)) : false
    },
    async openProductStoreActionsPopover(event: Event, store: any) {
      const productStoreActionsPopover = await popoverController.create({
        component: ProductStoreActionsPopover,
        componentProps: {
          productStore: store
        },
        event,
        showBackdrop: false,
      });
      return productStoreActionsPopover.present();
    },
    async selectFacility() {
      let componentProps = {
        selectedFacilities: this.getUserFacilities()
      } as any

      if(this.selectedUser.partyTypeId === 'PARTY_GROUP') {
        componentProps['isFacilityLogin'] = true
      }

      const selectFacilityModal = await modalController.create({
        component: SelectFacilityModal,
        componentProps
      });

      selectFacilityModal.onDidDismiss().then( async (result) => {
        if (result.data && result.data.value) {
          const facilitiesToAdd = result.data.value.facilitiesToAdd
          const facilitiesToRemove = result.data.value.facilitiesToRemove

          const removeResponses = await Promise.allSettled(facilitiesToRemove
            .map(async (payload: any) => await UserService.removePartyFromFacility({
              partyId: this.selectedUser.partyId,
              facilityId: payload.facilityId,
              roleTypeId: payload.roleTypeId,
              fromDate: payload.fromDate,
              thruDate: DateTime.now().toMillis()
            }))
          )
    
          // explicitly calling ensurePartyRole (ensurePartyRole) as addToPartyTole 
          // and removeFromPartyRole are running in parallel on the server causing issues
          if (facilitiesToAdd.length) {
            try {
              const resp = await UserService.ensurePartyRole({
                partyId: this.partyId,
                roleTypeId: 'WAREHOUSE_PICKER',
              })
              if (hasError(resp)) {
                showToast(translate('Something went wrong.'));
                throw resp.data
              }
            } catch (error) {
              logger.error(error)
              return
            }
          }

          const createResponses = await Promise.allSettled(facilitiesToAdd
            .map(async (payload: any) => await UserService.addPartyToFacility({
              partyId: this.selectedUser.partyId,
              facilityId: payload.facilityId,
              roleTypeId: 'WAREHOUSE_PICKER',
            }))
          )

          const hasFailedResponse = [...removeResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some association(s).'))
          } else {
            showToast(translate('Facility associations updated successfully.'))
          }
          // refetching updated associated facilities
          const userFacilities = await UserService.getUserFacilities(this.selectedUser.partyId)
          this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, facilities: userFacilities })
        }
      })
      return selectFacilityModal.present();
    },
    async selectSecurityGroup() {
      const selectSecurityGroupModal = await modalController.create({
        component: SelectSecurityGroupModal,
        componentProps: { selectedSecurityGroups: this.userSecurityGroups }
      });

      selectSecurityGroupModal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.value) {
          const securityGroupsToCreate = result.data.value.securityGroupsToCreate
          const securityGroupsToRemove = result.data.value.securityGroupsToRemove

          try {
            const updateResponses = await Promise.allSettled(securityGroupsToRemove
              .map(async (payload: any) => await UserService.removeUserSecurityGroup({
                groupId: payload.groupId,
                userLoginId: this.selectedUser.userLoginId
              }))
            )

            const createResponse = await UserService.addUserToSecurityGroup({
              groupIds: securityGroupsToCreate?.map((group: any) => group.groupId),
              userLoginId: this.selectedUser.userLoginId
            })

            const hasFailedResponse = [...updateResponses, createResponse].some((response: any) => response.status === 'rejected')
            if (hasFailedResponse) {
              showToast(translate('Failed to update some security group(s).'))
            } else {
              showToast(translate('Security group(s) updated successfully.'))
            }
            // refetching security groups
            const userSecurityGroups = await UserService.getUserSecurityGroups(this.selectedUser.userLoginId)
            this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, securityGroups: userSecurityGroups })
            this.isUserFulfillmentAdmin = userSecurityGroups.length ? await UserService.isUserFulfillmentAdmin(userSecurityGroups.map((group: any) => group.groupId)) : false
          } catch (error) {
            logger.error(error)
            showToast(translate('Failed to update some security group(s).'))
          }
        }
      })

      return selectSecurityGroupModal.present();
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { selectedProductStores: this.userProductStores }
      });

      selectProductStoreModal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.value) {
          const productStoresToCreate = result.data.value.productStoresToCreate
          const productStoresToRemove = result.data.value.productStoresToRemove

          const updateResponses = await Promise.allSettled(productStoresToRemove
            .map(async (payload: any) => await UserService.updateProductStoreRole({
              partyId: this.selectedUser.partyId,
              productStoreId: payload.productStoreId,
              roleTypeId: payload.roleTypeId,
              fromDate: this.userProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
              thruDate: DateTime.now().toMillis()
            }))
          )

          // explicitly calling ensurePartyRole (ensurePartyRole) as addToPartyTole
          // and removeFromPartyRole are running in parallel on the server causing issues
          if (productStoresToCreate.length) {
            try {
              const resp = await UserService.ensurePartyRole({
                partyId: this.selectedUser.partyId,
                roleTypeId: "APPLICATION_USER",
              })
              if (hasError(resp)) {
                showToast(translate('Something went wrong.'));
                throw resp.data
              }
            } catch (error) {
              logger.error(error)
              return
            }
          }

          const createResponses = await Promise.allSettled(productStoresToCreate
            .map(async (payload: any) => await UserService.createProductStoreRole({
              productStoreId: payload.productStoreId,
              partyId: this.selectedUser.partyId,
              roleTypeId: "APPLICATION_USER",
            }))
          )

          const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some role(s).'))
          } else {
            showToast(translate('Role(s) updated successfully.'))
          }
          // refetching product stores with updated roles
          const userProductStores = await UserService.getUserProductStores(this.selectedUser.partyId)
          this.store.dispatch('user/updateSelectedUser', { ...this.selectedUser, productStores: userProductStores })
        }
      })

      return selectProductStoreModal.present();
    },
    async updatePickerRoleStatus(event: any) {
      event.stopImmediatePropagation();
      const isChecked = !event.target.checked;

      try {
        let resp;
        if (isChecked) {
          resp = await UserService.ensurePartyRole({
            partyId: this.selectedUser?.partyId,
            roleTypeId: "WAREHOUSE_PICKER"
          })
        } else {
          resp = await UserService.deletePartyRole({
            partyId: this.selectedUser?.partyId,
            roleTypeId: "WAREHOUSE_PICKER"
          })
        }
        if (!hasError(resp)) {
          showToast(translate('User picker role updated successfully.'))

          const currentUser = JSON.parse(JSON.stringify(this.selectedUser))
          currentUser.isWarehousePicker = isChecked
          await this.store.dispatch("user/updateSelectedUser", currentUser);
          // updating toggle state on success
          event.target.checked = isChecked
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to update user role.'))
        logger.error(error)
      }
    },
    async editName() {
      let inputFields = [{
          name: "firstName",
          value: this.selectedUser.firstName
        }, 
        {
          name: "lastName",
          value: this.selectedUser.lastName
        }]

      if(this.selectedUser.partyTypeId === 'PARTY_GROUP') {
        inputFields = [{
          name: "groupName",
          value: this.selectedUser.groupName
        }]
      }

      const alert = await alertController.create({
        header: translate("Edit name"),
        inputs: inputFields,
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Confirm'),
          handler: async (data: any) => {
            if(data.firstName || data.groupName) {
              let resp;
              const payload = { partyId: this.selectedUser.partyId, ...data }

              emitter.emit('presentLoader')

              try {
                if(this.selectedUser.partyTypeId === 'PARTY_GROUP') {
                  resp = await UserService.updatePartyGroup(payload)
                } else {
                  resp = await UserService.updatePerson(payload)
                }

                if(!hasError(resp)) {
                  showToast(translate("User renamed successfully."))
                  await this.store.dispatch("user/updateSelectedUser", { ...this.selectedUser, ...payload });
                }else {
                  throw resp.data;
                }
              } catch(err) {
                logger.error(err)
              }

              emitter.emit('dismissLoader')
            }
          }
        }]
      })

      alert.present()
    },
    async updateUserStatus(event: any) {
      event.stopImmediatePropagation();

      const isChecked = !event.target.checked
      let resp;

      const payload = {
        partyId: this.selectedUser.partyId,
        statusId: isChecked ? 'PARTY_DISABLED' : 'PARTY_ENABLED'
      }

      emitter.emit('presentLoader')

      try {
        if (isChecked && this.selectedUser.userLoginId) {   
          await UserService.updateUserLoginStatus({
            enabled: 'N',
            partyId: this.partyId,
            userLoginId: this.selectedUser.userLoginId
          });   
          this.selectedUser.enabled = 'N';         
        }
        if(this.selectedUser.partyTypeId === 'PARTY_GROUP') {
          resp = await UserService.updatePartyGroup(payload)
        } else {
          resp = await UserService.updatePerson({...payload, firstName: this.selectedUser.firstName})
        }

        if(!hasError(resp)) {
          showToast(translate("User status updated successfully."))
          await this.store.dispatch("user/updateSelectedUser", { ...this.selectedUser, ...payload });
          event.target.checked = isChecked
        }else {
          throw resp.data;
        }
      } catch(err) {
        logger.error(err)
        showToast(translate("Failed to update user status."))
      }

      emitter.emit('dismissLoader')
    },
   
    async validateImageType(file: any, validImageTypes: string[]): Promise<boolean> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = document.createElement('img');
          img.onload = () => {
            if (validImageTypes.includes(file.type)) {
              resolve(true);
            } else {
              reject(false);
            }
          };
          img.onerror = () => {
            reject(false);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    },

    async uploadImage(event: any) {
      const selectedFile = event.target.files[0];
      if (!selectedFile) {
        return;
      }

      // Validate the file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      try {
        await this.validateImageType(selectedFile, validImageTypes);
      } catch (error) {
        showToast(translate("Please upload a valid image file, supported types: jpg/jpeg, png, gif, svg"));
        return;
      }

      const formData = new FormData();
      formData.append('partyId', this.selectedUser.partyId);
      formData.append('_uploadedFile_contentType', 'image/*');
      formData.append('uploadedFile', selectedFile, selectedFile?.name);
      try {
        const resp = await UserService.uploadPartyImage(formData);
        if (!hasError(resp)) {
          showToast(translate("Image uploaded successfully."))
          await this.fetchProfileImage()
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate("Failed to upload image."))
        logger.error('Error uploading image:', error);
      }
    },

    async fetchProfileImage() {
      const profileImage = await UserService.fetchLogoImageForParty(this.selectedUser.partyId)

      if (profileImage.objectInfo) {
        this.imageUrl = (this.baseUrl.startsWith('http') ? this.baseUrl.replace(/api\/?/, "") : `https://${this.baseUrl}.hotwax.io/`) + profileImage.objectInfo
      }
    },

    getSecurityGroups(securityGroups: any) {
      const excludedSecurityGroups = JSON.parse(process.env.VUE_APP_EXCLUDED_SECURITY_GROUPS as string)
      const selectedSecurityGroupIds = this.selectedUser.securityGroups.map((securityGroup: any) => securityGroup.groupId)

      if(!hasPermission(Actions.APP_SUPER_USER)) excludedSecurityGroups.push('SUPER')

      // We have some excluded security groups that can't be created by any users,
      // But if a user exists of these excluded security groups, we will show them in the select option.
      selectedSecurityGroupIds.map((selectedSecurityGroupId:any) => {
        if(excludedSecurityGroups.includes(selectedSecurityGroupId)) {
          excludedSecurityGroups.splice(excludedSecurityGroups.indexOf(selectedSecurityGroupId), 1)
        }
      })

      return securityGroups.filter((group: any) => !excludedSecurityGroups.includes(group.groupId))
    },
    // Currently a user is getting associated with two roles at a time i.e., 'WAREHOUSE_PICKER' and 'FAC_LOGIN'
    // And here we only want to show records of 'WAREHOUSE_PICKER'
    getUserFacilities() {
      return this.selectedUser.facilities.filter((facility: any) => facility.roleTypeId === 'WAREHOUSE_PICKER')
    },
    async openUserSecurityGroupAssocHistoryModal() {
      const userSecurityGroupAssocHistoryModal = await modalController.create({
        component: UserSecurityGroupAssocHistoryModal,
      });

      return userSecurityGroupAssocHistoryModal.present();
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return {
      addOutline,
      addCircleOutline,
      bodyOutline,
      businessOutline,
      callOutline,
      cameraOutline,
      cloudyNightOutline,
      ellipsisVerticalOutline,
      eyeOffOutline,
      eyeOutline,
      hasPermission,
      mailOutline,
      router,
      store,
      timeOutline,
      translate,
      warningOutline,
      Actions
    }
  }
})
</script>
<style scoped>
.login-detail-actions {
  padding: var(--spacer-xs) 10px 10px;
}

.user-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  align-items: start;
}

.profile {
  grid-column: span 2;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacer-xs) 10px 0px;
}

ion-card>ion-button[expand="block"] {
  margin-inline: var(--spacer-sm);
  margin-bottom: var(--spacer-sm);
}

ion-skeleton-text {
  width: 100%;
  height: 40%;
}

@media (min-width: 700px) {
  main {
    margin: var(--spacer-xl);
  }

  .user-details {
    gap: var(--spacer-base);
  }
}

label {
  cursor: pointer;
}
</style>