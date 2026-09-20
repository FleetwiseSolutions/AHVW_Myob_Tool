import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Part } from "@/lib/features/jobs/jobsSlice";
import { DEFAULT_COMMENT } from "@/lib/commentPresets";
interface PartType {
  name: string;
  quantity: number;
  price: number;
  description: string;
  Part: Part;
}

export async function POST(req: Request) {
  try {
    const {
      jobDate,
      customerName,
      vehicleRegistration,
      parts,
      jobType,
      customerJobDueDateType,
      customerBalanceDueDate,
      jobDescription,
      customerComments,
      invoiceComment,
      sendEmail,
    } = await req.json();

    // Retrieve stored access token from cookies

    const cookieStore = await cookies();

    const accessToken = cookieStore.get("myob_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const companyFileId = process.env.MYOB_COMPANY_FILE_ID!;
    const apiBaseUrl = process.env.MYOB_API_BASE_URL!;
    const clientId = process.env.NEXT_PUBLIC_MYOB_CLIENT_ID!;

    // Fetch all customer contacts

    let customers: MyobCustomer[] = [];
    let nextPageLink = `${apiBaseUrl}/${companyFileId}/Contact/Customer`;

    while (nextPageLink) {
      const response = await fetch(nextPageLink, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-myobapi-key": clientId,
          "x-myobapi-version": "v2",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Error fetching customer contacts" },
          { status: response.status }
        );
      }

      const data = await response.json();
      customers = customers.concat(data.Items);
      nextPageLink = data.NextPageLink;
    }

    // Search for the customer locally
    const matchedCustomer = customers.find((customer) => {
      const fullName =
        `${customer.FirstName} ${customer.LastName}`.toLowerCase();

      const companyName = customer.CompanyName?.toLowerCase();
      const searchName = customerName.toLowerCase();
      if (customer.IsIndividual) {
        return fullName === searchName;
      } else {
        return companyName === searchName;
      }
    });
    if (!matchedCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const taxCodesUrl = `${apiBaseUrl}/${companyFileId}/GeneralLedger/taxCode`;
    const taxCodesResponse = await fetch(taxCodesUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-myobapi-key": clientId,
        "x-myobapi-version": "v2",
        "Content-Type": "application/json",
      },
    });

    if (!taxCodesResponse.ok) {
      const errorData = await taxCodesResponse.json();
      console.error("Error fetching Tax Codes:", errorData);
      return NextResponse.json(
        { error: errorData.Message || "Error fetching taxCodes" },
        { status: taxCodesResponse.status }
      );
    }

    type TaxCodeType = {
      Items: TaxCode[];
    };

    const taxCodesData: TaxCodeType = await taxCodesResponse.json();

    const matchedTaxCode = taxCodesData.Items.find((taxCode: TaxCode) => {
      const name = taxCode.Code.toLowerCase();
      return name === "GST".toLowerCase();
    });

    if (!matchedTaxCode) {
      return NextResponse.json(
        { error: "Tax Code not found" },
        { status: 404 }
      );
    }

    const jobDescriptionItem = {
      Type: "Header",
      Description: `Vehicle Registration: ${jobDescription.registration}
Odometer: ${jobDescription.odometer}
Vehicle Type: ${jobDescription.vehicleType}
      `,
    };

    const customerCommentsItem = {
      Type: "Header",
      Description: customerComments,
    };

    const invoiceData = {
      Customer: { UID: matchedCustomer.UID },
      Number: `A${new Date().toISOString().slice(2, 19).replace(/[-T:]/g, "")}`,
      Date: new Date(jobDate).toISOString(),
      CustomerPurchaseOrderNumber: `${vehicleRegistration} - ${jobType}`,
      IsTaxInclusive: false,
      Terms: {
        PaymentIsDue: customerJobDueDateType,
        DiscountDate: 0,
        BalanceDueDate: customerBalanceDueDate,
        DiscountForEarlyPayment: 0,
        MonthlyChargeForLatePayment: 0,
      },

      Lines: [
        ...[jobDescriptionItem].filter(() => jobDescription),
        ...[customerCommentsItem].filter(() => customerComments),
        ...parts.map((part: PartType) => ({
          Type: "Transaction",
          Description: part.description,
          UnitCount: part.quantity,
          UnitPrice: part.price,
          ShipQuantity: part.quantity,
          DiscountPercent: 0,
          TaxCode: { UID: matchedTaxCode.UID },
          Item: { UID: part.Part.myobAccountUID },
          Total: parseFloat((part.price * part.quantity).toFixed(2)),
        })),
      ], // Empty initially

      // Falls back to the default preset only if the client sent nothing;
      // an empty string is respected (custom comment left blank).
      Comment:
        typeof invoiceComment === "string" ? invoiceComment : DEFAULT_COMMENT,
    };

    const response = await fetch(
      `${apiBaseUrl}/${companyFileId}/Sale/Invoice/Item`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-myobapi-key": clientId,
          "x-myobapi-version": "v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.Message }, { status: 400 });
    }

    const location = response.headers.get("location");

    const uid = location!.split("/").pop();

    if (!sendEmail) {
      return NextResponse.json({
        success: true,
        invoiceNumber: invoiceData.Number,
      });
    }

    // The invoice already exists at this point, so an email failure must not
    // look like an invoice failure - report it separately.
    const customerEmail =
      matchedCustomer?.Addresses?.[0]?.Email || "ahvwpl@gmail.com";
    const recipientName =
      matchedCustomer.CompanyName ||
      `${matchedCustomer.FirstName ?? ""} ${matchedCustomer.LastName ?? ""}`.trim();
    const emailUrl = `${apiBaseUrl}/${companyFileId}/Sale/Invoice/Item/${uid}/Email`;

    try {
      const emailResponse = await fetch(emailUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-myobapi-key": clientId,
          "x-myobapi-version": "v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FormTemplate: "AHVW - Service",
          To: [{ Email: customerEmail, Name: recipientName }],
          From: { Email: "ahvw@gmail.com", Name: "AHVW Pty. Ltd." },
          Subject: `Invoice - ${invoiceData.Number}`,
          Message: "Please find attached your invoice.",
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(
          `Failed to send invoice email. Status: ${emailResponse.status}`
        );
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        invoiceNumber: invoiceData.Number,
      });
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
      return NextResponse.json({
        success: true,
        emailSent: false,
        invoiceNumber: invoiceData.Number,
      });
    }
  } catch (error) {
    console.error("Invoice Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}