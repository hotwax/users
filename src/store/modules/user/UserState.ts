export default interface UserState {
    token: string;
    current: any;
    instanceUrl: string;
    permissions: any;
    query: {
      queryString: String,
      securityGroup: String,
      status: String
    };
    selectedUser: any;
    users: any[];
}