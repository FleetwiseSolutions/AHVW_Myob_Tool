interface MyobCustomer {
  UID?: string; // Unique customer identifier (GUID). Required for updates.
  CompanyName?: string; // Required if IsIndividual is false.
  LastName?: string; // Required if IsIndividual is true.
  FirstName?: string; // Required if IsIndividual is true.
  IsIndividual: boolean; // True for individual, false for company.
  DisplayID?: string; // Customer card ID.
  IsActive?: boolean; // True if active, false if inactive.
  Addresses?: Address[]; // Up to five addresses.
  Notes?: string; // Additional notes.
  Identifiers?: Identifier[]; // AccountRight only.
  CustomList1?: CustomList; // AccountRight only.
  CustomList2?: CustomList; // AccountRight only.
  CustomList3?: CustomList; // AccountRight only.
  CustomField1?: CustomField; // AccountRight only.
  CustomField2?: CustomField; // AccountRight only.
  CustomField3?: CustomField; // AccountRight only.
  CurrentBalance?: number; // Customer balance.
  SellingDetails?: SellingDetails;
  PaymentDetails?: PaymentDetails;
  ForeignCurrency?: ForeignCurrency; // AccountRight only.
}

interface Address {
  Location: number; // 1 to 5.
  Street?: string;
  City?: string;
  State?: string;
  PostCode?: string;
  Country?: string;
  Phone1?: string;
  Phone2?: string;
  Phone3?: string;
  Fax?: string;
  Email?: string;
  Website?: string;
  ContactName?: string;
  Salutation?: string;
}

interface Identifier {
  Label?: string;
  Value?: string;
}

interface CustomList {
  Label?: string;
  Value?: string;
}

interface CustomField {
  Label?: string;
  Value?: string;
}

interface SellingDetails {
  SaleLayout?:
    | "NoDefault"
    | "Service"
    | "Item"
    | "Professional"
    | "TimeBilling"
    | "Miscellaneous";
  PrintedForm?: string;
  InvoiceDelivery?: string;
  ItemPriceLevel?:
    | "Level A"
    | "Level B"
    | "Level C"
    | "Level D"
    | "Level E"
    | "Level F";
  IncomeAccount?: AccountLink;
  ReceiptMemo?: string;
  SalesPerson?: EmployeeLink;
  SaleComment?: string;
  ShippingMethod?: string;
  HourlyBillingRate?: number;
  ABN?: string; // Applicable for AU region.
  ABNBranch?: string; // Applicable for AU region.
  TaxCode?: TaxCodeLink;
  FreightTaxCode?: TaxCodeLink;
  UseCustomerTaxCode?: boolean;
  Terms?: Terms;
  Credit?: Credit;
  TaxIdNumber?: string;
  Memo?: string;
}

interface AccountLink {
  UID: string; // Unique identifier (GUID).
  Name?: string;
  DisplayID?: string;
  URI?: string;
}

interface EmployeeLink {
  UID: string; // Unique identifier (GUID).
  Name?: string;
  DisplayID?: string;
  URI?: string;
}

interface TaxCodeLink {
  UID: string; // Unique identifier (GUID).
  Code?: string;
  URI?: string;
}

interface Terms {
  PaymentIsDue?:
    | "CashOnDelivery"
    | "PrePaid"
    | "InAGivenNumberOfDays"
    | "OnADayOfTheMonth"
    | "NumberOfDaysAfterEOM"
    | "DayOfMonthAfterEOM";
  DiscountDate?: number;
  BalanceDueDate?: number;
  DiscountForEarlyPayment?: number; // Percentage.
  MonthlyChargeForLatePayment?: number; // Percentage.
  VolumeDiscount?: number; // Percentage.
}

interface Credit {
  Limit?: number;
  Available?: number;
  PastDue?: number;
  OnHold?: boolean;
}

interface PaymentDetails {
  Method?:
    | "American Express"
    | "Bank Card"
    | "Barter Card"
    | "Cash"
    | "Cheque"
    | "Diners Club"
    | "EFTPOS"
    | "MasterCard"
    | "Money Order"
    | "Other"
    | "Visa";
  CardNumber?: string; // Last 4 digits.
  NameOnCard?: string;
  BSBNumber?: string; // Applicable for AU region.
  BankAccountNumber?: string;
  BankAccountName?: string;
  Notes?: string;
}

interface ForeignCurrency {
  UID: string; // Unique identifier (GUID).
  Code?: string;
  CurrencyName?: string;
  URI?: string;
}

interface TaxCode {
  UID?: string; // Unique tax code identifier (GUID). Required for updates.
  Code: string; // 3-character code assigned to the tax code.
  Description?: string; // Description of the tax code.
  Type?: TaxCodeType; // Type of tax code.
  Rate?: number; // Tax rate as a decimal (e.g., 0.10 for 10%).
  IsActive?: boolean; // Indicates if the tax code is active.
  LinkedAccount?: AccountLink; // Account associated with the tax code.
  LastModified?: string; // DateTime of the last modification.
  RowVersion?: string; // Incrementing number for change control.
}

type TaxCodeType =
  | "ImportDuty"
  | "SalesTax"
  | "GST_VAT"
  | "InputTaxed"
  | "Consolidated"
  | "LuxuryCarTax"
  | "WithholdingsTax"
  | "NoABN_TFN";

interface AccountLink {
  UID: string; // Unique identifier (GUID) for the account.
  Name?: string; // Name of the account.
  DisplayID?: string; // Account code with separator (e.g., '1-1100').
  URI?: string; // Uniform Resource Identifier for the account object.
}
