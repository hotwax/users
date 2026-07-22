import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { api } = vi.hoisted(() => ({
  api: vi.fn().mockResolvedValue({ status: 200, data: {} }),
}))

vi.mock('@common', () => ({
  api,
  commonUtil: {
    hasError: () => false,
    showToast: vi.fn(),
  },
  emitter: { emit: vi.fn() },
  i18n: { global: { locale: { value: 'en-US' } } },
  logger: { error: vi.fn() },
  translate: (message: string) => message,
  useAuth: () => ({
    clearAuth: vi.fn(),
    updateUserId: vi.fn(),
  }),
}))

import { usePermissionStore } from '@/store/permission'
import { useUserStore } from '@/store/user'

describe('Moqui-only API contracts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    api.mockClear()
  })

  it('creates the Moqui and OFBiz-realm account through one Moqui API', async () => {
    await useUserStore().createNewUserLogin({
      partyId: 'PARTY_1',
      userLoginId: 'demo.user',
      currentPassword: 'password',
      currentPasswordVerify: 'password',
      requirePasswordChange: 'Y',
      enabled: 'Y',
    })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/users',
      method: 'post',
      data: {
        partyId: 'PARTY_1',
        username: 'demo.user',
        newPassword: 'password',
        newPasswordVerify: 'password',
        requirePasswordChange: 'Y',
        disabled: 'N',
      },
    })
  })

  it('uses the native userId for password changes', async () => {
    await useUserStore().resetPassword({
      userId: 'USER_1',
      newPassword: 'new-password',
      newPasswordVerify: 'new-password',
    })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/users/USER_1/password/update',
      method: 'post',
      data: {
        newPassword: 'new-password',
        newPasswordVerify: 'new-password',
      },
    })
  })

  it('soft-expires mapped user-group membership through the native userId', async () => {
    await useUserStore().removeUserSecurityGroup({
      userId: 'USER_1',
      userGroupId: 'STORE_MANAGER',
      fromDate: 100,
      thruDate: 200,
    })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/users/USER_1/groups',
      method: 'put',
      data: {
        userGroupId: 'STORE_MANAGER',
        fromDate: 100,
        thruDate: 200,
      },
    })
  })

  it('uploads profile images through the Moqui user resource', async () => {
    const formData = new FormData()
    formData.append('uploadedFile', new Blob(['image']), 'avatar.png')

    await useUserStore().uploadPartyImage({ userId: 'USER_1', formData })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/users/USER_1/profileImage',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('manages legacy security-group records through Moqui REST', async () => {
    const store = usePermissionStore()
    await store.grantPermissionToGroup({
      groupId: 'STORE_MANAGER',
      permissionId: 'ORDER_VIEW',
      fromDate: 123,
    })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/permissions/ORDER_VIEW',
      method: 'post',
      data: { groupId: 'STORE_MANAGER', fromDate: 123 },
    })
  })

  it('counts security-group users through a Moqui admin endpoint', async () => {
    await usePermissionStore().getSecurityGroupUsers({
      inputFields: { securityGroupId: 'STORE_MANAGER' },
    })

    expect(api).toHaveBeenCalledWith({
      url: 'admin/groups/STORE_MANAGER/users',
      method: 'get',
    })
  })
})
