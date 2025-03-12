export default interface UserState {
    token: string;
    current: any;
    instanceUrl: string;
    permissions: any;
    query: {
      queryString: string,
      securityGroup: string,
      status: string,
      hideDisabledUser: boolean
    };
    selectedUser: any;
    users: any;
    omsRedirectionInfo: {
      url: string;
      token: string;
    }
    redirectedFrom: string;
}