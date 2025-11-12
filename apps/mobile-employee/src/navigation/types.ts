/**
 * Navigation type definitions for type-safe navigation
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Proposals: undefined;
  Documents: undefined;
  Profile: undefined;
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId: string };
  ClientForm: { clientId?: string };
};

export type ProposalsStackParamList = {
  ProposalsList: undefined;
  ProposalDetail: { proposalId: string };
  ProposalForm: { proposalId?: string; clientId?: string };
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  DocumentViewer: { documentId: string; documentUrl: string };
  DocumentUpload: { clientId?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
