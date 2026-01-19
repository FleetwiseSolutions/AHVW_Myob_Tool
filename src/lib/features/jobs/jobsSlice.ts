import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabaseClient";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobDueDateType: string;
  balanceDueDate: number;
}

export interface Part {
  id: string;
  manufacturingPartNumber: string;
  myobAccountUID: string;
  description: string;
  invoiceDisplay: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type: string;
}

export interface JobPart {
  id: string;
  jobId: string;
  partId: string;
  quantity: number;
  sellPrice: number;
  hoursSpent: number;
  comments: string | null;
  Part: Part;
}

export interface Job {
  id: string;
  type: string;
  vehicleId: string;
  nextServiceDate: string | null;
  nextServiceType: string | null;
  odometer: number | null;
  imageUrls: string | null;
  status: string;
  customerId: string;
  dateIn: string;
  dateOut: string;
  inspectionComments: string | null;
  invoiceComments: string | null;
  nextServiceKM: number | null;
  serviceComments: string | null;
  serviceString: string;
  vehicleRegistration: string;
  vehicleVin: string;
  Customer: Customer;
  Vehicle: Vehicle;
  JobPart: JobPart[]; // Add JobParts to the Job export interface
  invoiceId?: string;
}

export interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: JobState = {
  jobs: [],
  selectedJob: null,
  status: "idle",
  error: null,
};

// Async thunk to fetch jobs
export const fetchJobs = createAsyncThunk<Job[], void>(
  "jobs/fetchJobs",
  async () => {
    let allJobs: Job[] = [];
    let start = 0;
    const pageSize = 1000; // Fetch 1000 rows at a time
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      const { data, error } = await supabase
        .from("Job")
        .select(
          `
            *,
            Customer (name, email, phone, jobDueDateType, balanceDueDate),
            Vehicle (registration, vin, make, model, year, type),
            JobPart (id, partId, quantity, sellPrice, hoursSpent, comments, Part (manufacturingPartNumber, myobAccountUID, description, invoiceDisplay))
          `
        )
        .in("status", ["COMPLETED", "CASH"])
        .range(start, start + pageSize - 1); // Fetch in batches

      if (error) throw error;

      if (data.length === 0) {
        moreDataAvailable = false; // Stop fetching when no more data is available
      } else {
        allJobs = allJobs.concat(data);
        start += pageSize; // Move to the next batch
      }
    }

    return allJobs;
  }
);

const updateJobInvoiceId = createAsyncThunk<Job, Job>(
  "jobs/updateJobInvoiceId",
  async (job: Job, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from("Job")
      .update({ invoiceId: job.invoiceId, status: "INVOICED" })
      .eq("id", job.id)
      .select()
      .single(); // Ensure a single row is returned

    if (error || !data) {
      return rejectWithValue(
        error?.message || "Failed to update job invoice ID"
      );
    }

    return data; // Ensure the updated job is returned
  }
);

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<Job[]>) => {
        state.status = "succeeded";
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch jobs";
      });
  },
});

export const { setSelectedJob } = jobSlice.actions;
export { updateJobInvoiceId };
export default jobSlice.reducer;
