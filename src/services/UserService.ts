import { api, client, hasError } from '@/adapter';
import { DateTime } from "luxon";

import store from '@/store';

const login = async (username: string, password: string): Promise<any> => {
  return api({
    url: "login",
    method: "post",
    data: {
      'USERNAME': username,
      'PASSWORD': password
    }
  });
}

const getUserProfile = async (token: any): Promise<any> => {
  const baseURL = store.getters['user/getBaseUrl'];
  try {
    const resp = await client({
      url: "user-profile",
      method: "get",
      baseURL,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    if (hasError(resp)) return Promise.reject("Error getting user profile: " + JSON.stringify(resp.data));
    return Promise.resolve(resp.data)
  } catch (error: any) {
    return Promise.reject(error)
  }
}

const getAvailableTimeZones = async (): Promise<any> => {
  return api({
    url: "getAvailableTimeZones",
    method: "get",
    cache: true
  });
}

const fetchUsers = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  })
}

const setUserTimeZone = async (payload: any): Promise<any> => {
  return api({
    url: "setUserTimeZone",
    method: "post",
    data: payload
  });
}

const getUserPermissions = async (payload: any, token: any): Promise<any> => {
  const baseURL = store.getters['user/getBaseUrl'];
  let serverPermissions = [] as any;

  // If the server specific permission list doesn't exist, getting server permissions will be of no use
  // It means there are no rules yet depending upon the server permissions.
  if (payload.permissionIds && payload.permissionIds.length == 0) return serverPermissions;
  // TODO pass specific permissionIds
  let resp;
  // TODO Make it configurable from the environment variables.
  // Though this might not be an server specific configuration, 
  // we will be adding it to environment variable for easy configuration at app level
  const viewSize = 200;

  try {
    const params = {
      "viewIndex": 0,
      viewSize,
      permissionIds: payload.permissionIds
    }
    resp = await client({
      url: "getPermissions",
      method: "post",
      baseURL,
      data: params,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    if (resp.status === 200 && resp.data.docs?.length && !hasError(resp)) {
      serverPermissions = resp.data.docs.map((permission: any) => permission.permissionId);
      const total = resp.data.count;
      const remainingPermissions = total - serverPermissions.length;
      if (remainingPermissions > 0) {
        // We need to get all the remaining permissions
        const apiCallsNeeded = Math.floor(remainingPermissions / viewSize) + (remainingPermissions % viewSize != 0 ? 1 : 0);
        const responses = await Promise.all([...Array(apiCallsNeeded).keys()].map(async (index: any) => {
          const response = await client({
            url: "getPermissions",
            method: "post",
            baseURL,
            data: {
              "viewIndex": index + 1,
              viewSize,
              permissionIds: payload.permissionIds
            },
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json'
            }
          })
          if (!hasError(response)) {
            return Promise.resolve(response);
          } else {
            return Promise.reject(response);
          }
        }))
        const permissionResponses = {
          success: [],
          failed: []
        }
        responses.reduce((permissionResponses: any, permissionResponse: any) => {
          if (permissionResponse.status !== 200 || hasError(permissionResponse) || !permissionResponse.data?.docs) {
            permissionResponses.failed.push(permissionResponse);
          } else {
            permissionResponses.success.push(permissionResponse);
          }
          return permissionResponses;
        }, permissionResponses)

        serverPermissions = permissionResponses.success.reduce((serverPermissions: any, response: any) => {
          serverPermissions.push(...response.data.docs.map((permission: any) => permission.permissionId));
          return serverPermissions;
        }, serverPermissions)

        // If partial permissions are received and we still allow user to login, some of the functionality might not work related to the permissions missed.
        // Show toast to user intimiting about the failure
        // Allow user to login
        // TODO Implement Retry or improve experience with show in progress icon and allowing login only if all the data related to user profile is fetched.
        if (permissionResponses.failed.length > 0) Promise.reject("Something went wrong while getting complete user permissions.");
      }
    }
    return serverPermissions;
  } catch (error: any) {
    return Promise.reject(error);
  }
}

const getUserLoginDetails = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getUserContactDetails = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getPartyRole = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const resetPassword = async (payload: any): Promise <any> => {
  return api({
    url: "service/resetPassword", 
    method: "post",
    data: payload
  });
}

const updateUserLoginStatus = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateUserLoginStatus", 
    method: "post",
    data: payload
  });
}

const createUpdatePartyEmailAddress = async (payload: any): Promise <any> => {
  return api({
    url: "service/createUpdatePartyEmailAddress", 
    method: "post",
    data: payload
  });
}

const createUpdatePartyTelecomNumber = async (payload: any): Promise <any> => {
  return api({
    url: "service/createUpdatePartyTelecomNumber", 
    method: "post",
    data: payload
  });
}

const deletePartyContactMech = async (payload: any): Promise <any> => {
  return api({
    url: "service/deletePartyContactMech", 
    method: "post",
    data: payload
  });
}

const updatePartyGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/updatePartyGroup", 
    method: "post",
    data: payload
  });
}

const updatePerson = async (payload: any): Promise <any> => {
  return api({
    url: "service/updatePerson", 
    method: "post",
    data: payload
  });
}

const createUser = async (payload: any): Promise <any> => {
  return api({
    url: "service/createRelationship", 
    method: "post",
    data: payload
  });
}

const createNewUserLogin = async (payload: any): Promise <any> => {
  return api({
    url: "service/createNewUserLoginAndSetUserPreference", 
    method: "post",
    data: payload
  });
}

const sendResetPasswordEmail = async (payload: any): Promise <any> => {
  return api({
    url: "sendResetPassword", 
    method: "post",
    data: payload
  });
} 


const getUserSecurityGroup = async (userLoginId: string): Promise<any> => {
  let userSecurityGroup = {} as any
  const payload = {
    inputFields: {
      userLoginId,
    },
    entityName: "UserLoginSecurityGroup",
    filterByDate: "Y",
    viewSize: 10,
    fieldList: ["groupId", "userLoginId", "fromDate"]
  }

  try {
    const resp = await api({
      url: "performFind",
      method: "POST",
      data: payload
    }) as any


    if (!hasError(resp) || resp.data.error === 'No record found') {
      userSecurityGroup = {
        groupId: resp.data.docs ? resp.data.docs[0].groupId : '',
        fromDate: resp.data.docs && resp.data.docs[0].fromDate
      }
    } else {
      throw resp.data
    }
  } catch (error) {
    console.error('Failed to fetch user associated security group.', error)
  }

  return userSecurityGroup
}

const updateUserSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateUserLoginToSecurityGroup", 
    method: "post",
    data: payload
  });
}

const addUserToSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/addUserLoginToSecurityGroup", 
    method: "post",
    data: payload
  });
}

const createPartyRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/ensurePartyRole", 
    method: "post",
    data: payload
  });
}

const getUserFacilities = async (partyId: string): Promise<any> => {
  let facilities = []
  const payload = {
    inputFields: {
      partyId,
    },
    noConditionFind: "Y",
    entityName: "FacilityParty",
    viewSize: 100,
  }

  try {
    const resp = await api({
      url: "performFind",
      method: "POST",
      data: payload
    }) as any


    if (!hasError(resp) || resp.data.error === 'No record found') {
      facilities = resp.data.docs ? resp.data.docs : []
    } else {
      throw resp.data;
    }
  } catch (error) {
    console.error('Failed to fetch user associated facilities.', error)
  }

  return facilities
}

const addPartyToFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/addPartyToFacility", 
    method: "post",
    data: payload
  });
}

const removePartyFromFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/removePartyFromFacility", 
    method: "post",
    data: payload
  });
}

const getUserProductStores = async (partyId: string): Promise<any> => {
  let productStores = []
  const payload = {
    inputFields: {
      partyId,
    },
    viewSize: 100,
    entityName: 'ProductStoreAndRole',
    filterByDate: 'Y',
    fieldList: ['partyId', 'storeName', 'roleTypeId', 'productStoreId', 'fromDate']
  }

  try {
    const resp = await api({
      url: "performFind",
      method: "POST",
      data: payload
    }) as any

    // fetching stores and roles first as storeName and role description
    // are required in the UI
    Promise.allSettled([store.dispatch('util/getProductStores'), store.dispatch('util/fetchRoles')])

    if (!hasError(resp) || resp.data.error === 'No record found') {
      productStores = resp.data.docs ? resp.data.docs : []
    } else {
      throw resp.data
    }
  } catch (error) {
    console.error('Failed to fetch user associated product stores.', error)
  }
  return productStores
}

const createProductStoreRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/createProductStoreRole", 
    method: "post",
    data: payload
  });
}

const updateProductStoreRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateProductStoreRole", 
    method: "post",
    data: payload
  });
}

const finishSetup = async (payload: any): Promise <any> => {
  try {
    const selectedUser = payload.selectedUser;
    const selectedTemplate = payload.selectedTemplate;
    const partyId = selectedUser.partyId;
    const promises = [];
    
    if (selectedTemplate.isUserLoginRequired) {
      const resp = await createNewUserLogin({
        "partyId": partyId,
        "userLoginId": payload.formData.userLoginId,
        "currentPassword": payload.formData.currentPassword,
        "currentPasswordVerify": payload.formData.currentPassword,
        "requirePasswordChange": payload.formData.requirePasswordChange ? "Y" : "N",
        "userPrefTypeId": "ORGANIZATION_PARTY",
        "userPrefValue": "COMPANY"
      });
      if (!hasError(resp)) {
        addUserToSecurityGroup({
          "userLoginId": payload.formData.userLoginId,
          "groupId": payload.selectedTemplate.securityGroupId ?? "STORE_MANAGER",
          "fromDate" : DateTime.now().toMillis()
        });
      } else {
        throw resp.data;
      }
    }
    
    if (selectedTemplate.isEmployeeIdRequired) {
      if (selectedUser.partyTypeId === "PARTY_GROUP") {
        promises.push(updatePartyGroup({
          "partyId": partyId,
          "groupName": selectedUser.groupName,
          "externalId": payload.formData.externalId
        }));
      } else {
        promises.push(updatePerson({
          "firstName": selectedUser.firstName,
          "lastName": selectedUser.lastName,
          "partyId": partyId,
          "externalId": payload.formData.externalId
        }));
      }
    }
        
    
    if (payload.formData.emailAddress) {
      promises.push(createUpdatePartyEmailAddress({
        "partyId": partyId,
        "emailAddress": payload.formData.emailAddress
      }));
    }
    if (payload.formData.contactNumber) {
      promises.push(createUpdatePartyTelecomNumber({
        "partyId": partyId,
        "contactNumber": payload.formData.contactNumber
      }));
    }
    if (payload.selectedTemplate.roleTypeId) {
      promises.push(createPartyRole({
        "partyId": partyId,
        "roleTypeId": payload.selectedTemplate.roleTypeId
      }));
    }

    if (payload.productStores && selectedTemplate.isProductStoreRequired) {
      payload.productStores?.forEach((store : any) => {
        promises.push(createProductStoreRole({
          "partyId": partyId,
          "productStoreId": store.productStoreId,
          "roleTypeId": payload.selectedTemplate.productStoreRoleTypeId,
          "fromDate" : DateTime.now().toMillis()
        }));
      });
    }

    if (payload.facilities) {
      payload.facilities?.forEach((facility : any) => {
        promises.push(addPartyToFacility({
          "partyId": partyId,
          "facilityId": facility.facilityId,
          "roleTypeId" : payload.selectedTemplate.facilityRoleTypeId ?? "WAREHOUSE_MANAGER",
        }));
      });
    }

    Promise.all(promises).then(responses => {
      responses.forEach(response => {
        if (hasError(response)) {
          throw response.data;
        }
      });
    })
    
  } catch (error: any) {
    return Promise.reject(error)
  }
}

export const UserService = {
  addPartyToFacility,
  addUserToSecurityGroup,
  createUser,
  createPartyRole,
  createNewUserLogin,
  createUpdatePartyEmailAddress,
  createUpdatePartyTelecomNumber,
  createProductStoreRole,
  deletePartyContactMech,
  getAvailableTimeZones,
  fetchUsers,
  getPartyRole,
  getUserContactDetails,
  getUserLoginDetails,
  getUserPermissions,
  getUserProfile,
  getUserFacilities,
  getUserProductStores,
  getUserSecurityGroup,
  login,
  removePartyFromFacility,
  resetPassword,
  sendResetPasswordEmail,
  setUserTimeZone,
  updateUserLoginStatus,
  updatePartyGroup,
  updatePerson,
  updateProductStoreRole,
  updateUserSecurityGroup,
  finishSetup
}