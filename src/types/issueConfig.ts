export interface IssueOption {
  id: string;
  label: string;
}

export interface IssueConfig {
  issueReasons: IssueOption[];
  deferredReasons: IssueOption[];
  issueFlags: IssueOption[];
  updatedAt?: string;
}
