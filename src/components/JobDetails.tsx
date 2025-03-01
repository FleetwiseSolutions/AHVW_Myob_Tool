"use client";

import {
  fetchJobs,
  Job,
  updateJobInvoiceId,
} from "@/lib/features/jobs/jobsSlice";
import { AppDispatch, RootState } from "@/lib/store";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

export const JobMap = (jobType: string) => {
  switch (jobType) {
    case "C_SERVICE":
      return "C Service";
    case "A_SERVICE":
      return "A Service";
    case "B_SERVICE":
      return "B Service";
    default:
      return jobType;
  }
};

const VehicleTypeMap = (vehicleType: string) => {
  switch (vehicleType) {
    case "ATAUTLINER":
      return "A Trailer Tautliner";
    case "BTAUTLINER":
      return "B Trailer Tautliner";
    case "AREFER":
      return "A Refrigerator Trailer";
    case "BREFER":
      return "B Refrigerator Trailer";
    case "TIPPER":
      return "Tipper Trailer";
    case "DOG":
      return "Dog Trailer";
    default:
      return vehicleType;
  }
};

const JobDetails: React.FC = () => {
  const { selectedJob } = useSelector((state: RootState) => state.jobs);
  const dispatch = useDispatch<AppDispatch>();
  const { status, error } = useSelector((state: RootState) => state.jobs);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState("");

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const updateInvoiceId = async (job: Job, invoiceId: string) => {
    // First set the invoiceId on your job object
    const updatedJob = {
      ...job,
      invoiceId: invoiceId,
    };

    // Then dispatch the thunk
    const resultAction = await dispatch(updateJobInvoiceId(updatedJob));

    // Check if the operation was successful
    if (updateJobInvoiceId.fulfilled.match(resultAction)) {
      console.log("Job updated successfully!", resultAction.payload);
    } else {
      console.error("Failed to update job:", resultAction.error);
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (status === "failed") return <div>Error: {error}</div>;

  if (!selectedJob) {
    return (
      <div className="p-4 text-gray-500">Select a job to view details.</div>
    );
  }

  // Calculate total job cost
  const totalJobCost = selectedJob.JobPart.reduce(
    (sum, part) => sum + part.sellPrice * part.quantity,
    0
  );

  // Function to create an invoice in MYOB
  const handleCreateInvoice = async () => {
    setLoadingInvoice(true);
    setInvoiceMessage("");

    try {
      const response = await fetch("/api/myob/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: selectedJob.Customer.name,
          jobDate: selectedJob.dateOut || new Date(),
          vehicleRegistration: selectedJob.Vehicle.registration,
          customerJobDueDateType: selectedJob.Customer.jobDueDateType,
          customerBalanceDueDate: selectedJob.Customer.balanceDueDate,
          parts: selectedJob.JobPart.map((part) => ({
            name: part.Part.manufacturingPartNumber,
            quantity: part.quantity,
            price: parseFloat(part.sellPrice.toFixed(2)),
            description: `${part.Part.invoiceDisplay} ${
              part.comments ? ` - ${part.comments}` : ""
            }`,
            Part: part.Part,
          })),
          jobType: JobMap(selectedJob.type),
          jobDescription: {
            registration: selectedJob.vehicleRegistration,
            odometer: selectedJob.odometer || "N/A",
            vehicleType: VehicleTypeMap(selectedJob.Vehicle.type),
          },
          customerComments: selectedJob.inspectionComments,
        }),
      });

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setInvoiceMessage(
          `Invoice created successfully! Invoice ID: ${data.invoiceNumber}`
        );
        updateInvoiceId(selectedJob, data.invoiceNumber);
      } else {
        setInvoiceMessage(`Error creating invoice: ${data.error}`);
      }
    } catch (error) {
      setInvoiceMessage("Failed to create invoice." + error);
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-2xl font-bold mb-4">{selectedJob.serviceString}</h2>

      {/* Job Info */}
      <div className="space-y-2 mb-8">
        <p>
          <strong>Customer:</strong> {selectedJob.Customer.name}
        </p>
        <p>
          <strong>Vehicle:</strong> {selectedJob.Vehicle.registration}
        </p>
        <p>
          <strong>Date In:</strong> {selectedJob.dateIn}
        </p>
        <p>
          <strong>Date Out:</strong> {selectedJob.dateOut}
        </p>
        <p>
          <strong>Odometer:</strong> {selectedJob.odometer}
        </p>
        <p>
          <strong>Status:</strong> {selectedJob.status}
        </p>
        <p>
          <strong>Service Comments:</strong> {selectedJob.serviceComments}
        </p>
        <p>
          <strong>Inspection Comments:</strong> {selectedJob.inspectionComments}
        </p>
        <p>
          <strong>Invoice Comments:</strong> {selectedJob.invoiceComments}
        </p>
        <p>
          <strong>Service Type:</strong> {JobMap(selectedJob.type)}
        </p>
      </div>

      {/* Job Parts Table */}
      <h3 className="text-xl font-bold mb-4">Job Parts</h3>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-300">Part</th>
            <th className="p-2 border border-gray-300">Quantity</th>
            <th className="p-2 border border-gray-300">Sell Price</th>
            <th className="p-2 border border-gray-300">Hours Spent</th>
            <th className="p-2 border border-gray-300">Comments</th>
          </tr>
        </thead>
        <tbody>
          {selectedJob.JobPart.map((part) => (
            <tr key={part.id} className="hover:bg-gray-50">
              <td className="p-2 border border-gray-300">
                {part.Part.invoiceDisplay}
              </td>
              <td className="p-2 border border-gray-300">{part.quantity}</td>
              <td className="p-2 border border-gray-300">
                ${part.sellPrice.toFixed(2)}
              </td>
              <td className="p-2 border border-gray-300">{part.hoursSpent}</td>
              <td className="p-2 border border-gray-300">
                {part.comments || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Job Cost */}
      <div className="text-xl font-bold mt-4">
        <p>Total: ${totalJobCost.toFixed(2)}</p>
        <p>Total inc. GST: ${(totalJobCost * 1.1).toFixed(2)}</p>
        <p>GST: ${totalJobCost * 0.1}</p>
      </div>

      {/* Create Invoice Button */}
      <button
        className="mt-6 bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
        onClick={handleCreateInvoice}
        disabled={loadingInvoice}
      >
        {loadingInvoice ? "Creating Invoice..." : "Create Invoice"}
      </button>

      {/* Invoice Response Message */}
      {invoiceMessage && (
        <p className="mt-4 text-lg font-semibold">{invoiceMessage}</p>
      )}
    </div>
  );
};

export default JobDetails;
