import { api, client, hasError } from '@/adapter';
import { DateTime } from "luxon";

import store from '@/store';
import { showToast } from '@/utils';
import { translate } from '@hotwax/dxp-components';

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

const checkUserLoginId = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const sendResetPasswordEmail = async (payload: any): Promise <any> => {
  return api({
    url: "sendResetPasswordMail", 
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

const removeUserSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/removePartyUserPermission", 
    method: "post",
    data: payload
  });
}

const addUserToSecurityGroup = async (payload: any): Promise <any> => {
  return api({
    url: "service/addSecurityGroupToUserLogin", 
    method: "post",
    data: payload
  });
}

const ensurePartyRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/ensurePartyRole", 
    method: "post",
    data: payload
  });
}
const deletePartyRole = async (payload: any): Promise <any> => {
  return api({
    url: "service/deletePartyRole", 
    method: "post",
    data: payload
  });
}

const createCommercePartyRelationshipFrom = async (payload: any): Promise <any> => {
  payload = {
    ...payload,
    "partyIdFrom": "COMPANY",
    "roleTypeIdFrom": "INTERNAL_ORGANIZATIO",
    "partyRelationshipTypeId": "OWNER",
    "statusId": "ACCOUNT_CREATED",
  }
  return api({
    url: "service/createCommercePartyRelationshipFrom", 
    method: "post",
    data: payload
  });
}
const updatePartyRelationship = async (payload: any): Promise <any> => {
  return api({
    url: "service/updatePartyRelationship", 
    method: "post",
    data: payload
  });
}
const fetchPartyRelationship = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

const getUserFacilities = async (partyId: string): Promise<any> => {
  let facilities = []
  const payload = {
    inputFields: {
      partyId
    },
    noConditionFind: "Y",
    filterByDate: "Y",
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

const isUserLoginIdAlreadyExists = async(username: string): Promise<any> => {
  try {
    const resp = await checkUserLoginId({
      entityName: "UserLogin",
      inputFields: {
        userLoginId: username
      },
      viewSize: 1,
      fieldList: ['userLoginId', 'partyId'],
      distinct: 'Y',
      noConditionFind: 'Y'
    }) as any
    if(!hasError(resp) && resp.data.docs.length) {
      showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: username }))
      return true
    }
    return false
  } catch(err) {
    return false
  }
}

const finishSetup = async (payload: any): Promise <any> => {
  try {
    const selectedUser = payload.selectedUser;
    const selectedTemplate = payload.selectedTemplate;
    const partyId = selectedUser.partyId;
    const promises = [];
    
    if (selectedTemplate.isUserLoginRequired || selectedUser.partyTypeId === "PARTY_GROUP") {

      if(await isUserLoginIdAlreadyExists(payload.formData.userLoginId)) {
        throw `Could not create login user: user with ID ${payload.formData.userLoginId} already exists.`
      }

      const resp = await createNewUserLogin({
        "partyId": partyId,
        "userLoginId": payload.formData.userLoginId,
        "currentPassword": payload.formData.currentPassword,
        "currentPasswordVerify": payload.formData.currentPassword,
        "requirePasswordChange": payload.formData.requirePasswordChange ? "Y" : "N",
        "enabled": "Y",
        "userPrefTypeId": "ORGANIZATION_PARTY",
        "userPrefValue": "COMPANY"
      });
      if (!hasError(resp)) {
        addUserToSecurityGroup({
          "partyIdTo": partyId,
          "securityGroupId": payload.selectedTemplate.securityGroupId ? payload.selectedTemplate.securityGroupId : "STORE_MANAGER",
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
        
    
    if (payload.formData.emailAddress && payload.formData.emailAddress !== selectedUser.emailDetails?.email) {
      promises.push(createUpdatePartyEmailAddress({
        "partyId": partyId,
        "contactMechId": selectedUser.emailDetails?.contactMechId ? selectedUser.emailDetails?.contactMechId : "",
        "emailAddress": payload.formData.emailAddress,
        "contactMechPurposeTypeId": "PRIMARY_EMAIL",
      }));
    }

    if (payload.selectedTemplate.roleTypeId) {
      promises.push(createCommercePartyRelationshipFrom({
        "partyIdTo": partyId,
        "roleTypeIdTo": payload.selectedTemplate.roleTypeId
      }));
    }

    if (payload.productStores.length > 0 && selectedTemplate.isProductStoreRequired) {
      //This is ensure that party have required role before associating it in ProductStoreRole. Because below logic is executing in parallel.
      await ensurePartyRole({
        "partyId": partyId,
        "roleTypeId": payload.selectedTemplate.productStoreRoleTypeId
      })

      payload.productStores?.forEach((store : any) => {
        promises.push(createProductStoreRole({
          "partyId": partyId,
          "productStoreId": store.productStoreId,
          "roleTypeId": payload.selectedTemplate.productStoreRoleTypeId,
          "fromDate" : DateTime.now().toMillis()
        }));
      });
    }

    if (payload.facilities.length > 0) {
      const selectedFacilityIds = new Set(payload.facilities.map((facility: any) => facility.facilityId));
      let facilitiesToAdd = payload.facilities.filter((facility: any) => !selectedUser.facilities?.some((fac: any) => fac.facilityId === facility.facilityId));
      const facilitiestoDelete = selectedUser.facilities?.filter((facility: any) => !selectedFacilityIds.has(facility.facilityId));

      //This is ensure that party have required role before associating it in FacilityParty. Because below logic is executing in parallel.
      await ensurePartyRole({
        "partyId": partyId,
        "roleTypeId": payload.selectedTemplate.facilityRoleTypeId ? payload.selectedTemplate.facilityRoleTypeId : "WAREHOUSE_MANAGER"
      });

      facilitiestoDelete?.forEach((facility : any) => {
        promises.push(removePartyFromFacility({
          partyId: partyId,
          facilityId: facility.facilityId,
          roleTypeId: facility.roleTypeId,
          fromDate: facility.fromDate,
          thruDate: DateTime.now().toMillis()
        }));
      });

      facilitiesToAdd?.forEach((facility : any) => {
        promises.push(addPartyToFacility({
          "partyId": partyId,
          "facilityId": facility.facilityId,
          "roleTypeId" : payload.selectedTemplate.facilityRoleTypeId ? payload.selectedTemplate.facilityRoleTypeId :  "WAREHOUSE_MANAGER",
        }));
      });

      if(selectedUser.partyTypeId === "PARTY_GROUP") {
        if (!facilitiesToAdd.length && !facilitiestoDelete.length) {
          facilitiesToAdd = selectedUser.facilities
        }

        //Create role type if not exists. This is required for associating facility login user to facility.
        if (!await UserService.isRoleTypeExists("FAC_LOGIN")) {
          const resp = await UserService.createRoleType({
            "roleTypeId": "FAC_LOGIN",
            "description": "Facility Login",
          })
          if (hasError(resp)) {
            throw resp.data;
          }
        }
  
        facilitiestoDelete?.map((facility: any) => {
          const facilityLogin = selectedUser.facilities.find((selectedFacility: any) => selectedFacility.facilityId === facility.facilityId && selectedFacility.roleTypeId === 'FAC_LOGIN')

          promises.push(removePartyFromFacility({
            partyId: partyId,
            facilityId: facility.facilityId,
            roleTypeId: "FAC_LOGIN",
            fromDate: facilityLogin.fromDate,
            thruDate: DateTime.now().toMillis()
          }));
        });
  
        facilitiesToAdd?.map((facility: any) => {
          promises.push(addPartyToFacility({
            "partyId": partyId,
            "facilityId": facility.facilityId,
            "roleTypeId": "FAC_LOGIN"
          }));
        });
      }
    }

    await Promise.all(promises).then(responses => {
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

const createRoleType = async (payload: any): Promise<any> => {
  return api({
    url: "service/createRoleType",
    method: "post",
    data: payload
  });
}

const isRoleTypeExists = async (roleTypeId: string): Promise<any> => {
  try {

    const resp = await api({
      url: 'performFind',
      method: 'POST',
      data: {
        entityName: "RoleType",
        inputFields: {
          roleTypeId: roleTypeId
        },
        viewSize: 1,
        fieldList: ['roleTypeId'],
        noConditionFind: 'Y'
      }
    }) as any
    if (!hasError(resp) && resp.data.docs.length) {
      return true
    }
    return false
  } catch (err) {
    return false
  }
}

const uploadPartyImage = async (payload: any): Promise <any> => {
  let baseURL = store.getters['user/getInstanceUrl'];
  baseURL = baseURL && baseURL.startsWith('http') ? baseURL : `https://${baseURL}.hotwax.io/api/`;
  return client({
    url: 'service/uploadPartyLogoImage',
    method: 'POST',
    data: payload,
    baseURL,
    headers: { "Content-Type": "multipart/form-data" },
  })
}

const fetchLogoImageForParty = async (partyId: any): Promise<any> => {
  let profileImage = {};

  try {
    let resp = await api({
      url: 'performFind',
      method: 'POST',
      data: {
        entityName: "PartyContentDetail",
        inputFields: {
          partyId,
        },
        viewSize: 1,
        fieldList: ['partyId', 'dataResourceId'],
        noConditionFind: 'Y',
        filterByDate: 'Y'
      }
    }) as any

    if (!hasError(resp) && resp.data.count > 0) {
      const partyContents = resp.data.docs;

      resp = await api({
        url: 'performFind',
        method: 'POST',
        data: {
          entityName: "DataResource",
          inputFields: {
            dataResourceId: partyContents[0].dataResourceId
          },
          viewSize: 1,
          fieldList: ['dataResourceId', 'objectInfo'],
          noConditionFind: 'Y'
        }
      })

      if (!hasError(resp) && resp.data.count > 0) {
        profileImage = resp.data.docs[0]
      } else {
        throw resp.data
      }
    }
    return profileImage;
  } catch (error) {
    return Promise.reject(error);
  }
}

export const UserService = {
  addPartyToFacility,
  addUserToSecurityGroup,
  checkUserLoginId,
  createUser,
  createCommercePartyRelationshipFrom,
  createNewUserLogin,
  createUpdatePartyEmailAddress,
  createUpdatePartyTelecomNumber,
  createProductStoreRole,
  createRoleType,
  deletePartyContactMech,
  deletePartyRole,
  ensurePartyRole,
  getAvailableTimeZones,
  fetchLogoImageForParty,
  fetchPartyRelationship,
  fetchUsers,
  getPartyRole,
  getUserContactDetails,
  getUserLoginDetails,
  getUserPermissions,
  getUserProfile,
  getUserFacilities,
  getUserProductStores,
  getUserSecurityGroup,
  isUserLoginIdAlreadyExists,
  isRoleTypeExists,
  login,
  removePartyFromFacility,
  resetPassword,
  sendResetPasswordEmail,
  setUserTimeZone,
  updatePartyRelationship,
  updateUserLoginStatus,
  updatePartyGroup,
  updatePerson,
  updateProductStoreRole,
  uploadPartyImage,
  removeUserSecurityGroup,
  finishSetup
}