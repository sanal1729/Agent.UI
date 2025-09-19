import { Branch } from "./branch";

export interface Organization {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  branches: Branch[];
}