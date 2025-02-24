"use client";

// components/Sidebar.tsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store"; // Assuming you have a store setup
import { setSelectedJob } from "@/lib/features/jobs/jobsSlice";

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs } = useSelector((state: RootState) => state.jobs);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const openAuthWindow = () => {
    const authWindow = window.open(
      "/api/myob/auth",
      "_blank",
      "width=600,height=600"
    );

    if (!authWindow) {
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.serviceString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.Customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.Vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-gray-100 p-4 h-screen">
      <button
        className="w-full p-2 border border-gray-300 bg-blue-500 my-2 rounded-lg"
        onClick={openAuthWindow}
      >
        Myob Login Refresh
      </button>
      <input
        type="text"
        placeholder="Search by service, customer, or registration"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <div className="w-full h-full overflow-y-auto">
        <ul>
          {filteredJobs.map((job) => (
            <li
              key={job.id}
              onClick={() => dispatch(setSelectedJob(job))}
              className="p-2 hover:bg-gray-200 cursor-pointer rounded"
            >
              {job.serviceString}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
