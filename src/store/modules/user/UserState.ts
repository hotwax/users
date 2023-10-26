export default interface UserState {
  users: any[],
  securityGroupOptions: any[]
  query: {
    queryString: String,
    securityGroup: String,
    status: String
  },
  token: string,
  current: object | null,
  currentFacility: object,
  instanceUrl: string,
}