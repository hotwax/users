export default interface UserState {
    token: string;
    current: any;
    instanceUrl: string;
    permissions: any;
    selectedUser: any;
    users: any[];
    query: {
      queryString: String,
      securityGroup: String,
      status: String
    };
}