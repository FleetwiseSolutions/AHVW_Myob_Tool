import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabaseClient";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  jobDueDateType: string | null;
  balanceDueDate: number | null;
}

export interface Part {
  id: string;
  manufacturingPartNumber: string;
  myobAccountUID: string | null;
  description: string;
  invoiceDisplay: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
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

  imageUrls: string | null;

  nextServiceDate: string | null;
  nextServiceType: string | null;
  nextServiceKM: number | null;

  status: string;
  odometer: number | null;

  customerId: string;
  dateIn: string;
  dateOut: string;

  inspectionComments: string | null;
  invoiceComments: string | null;
  serviceComments: string | null;
  serviceString: string;

  vehicleRegistration: string;
  vehicleVin: string;

  Customer: Customer;
  Vehicle: Vehicle;
  JobPart: JobPart[];

  invoiceId: string | null;
  discordUrl: string | null;
  team_group: string | null;
  job_hours_reported: number | null;
  job_hours_charged: number | null;
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
    const pageSize = 1000;
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      const { data, error } = await supabase
        .from("Job")
        .select(`
          *,
          Customer (
            id,
            name,
            email,
            phone,
            jobDueDateType,
            balanceDueDate
          ),
          Vehicle (
            id,
            registration,
            vin,
            make,
            model,
            year,
            type
          ),
          JobPart (
            id,
            jobId,
            partId,
            quantity,
            sellPrice,
            hoursSpent,
            comments,
            Part (
              id,
              manufacturingPartNumber,
              myobAccountUID,
              description,
              invoiceDisplay
            )
          )
        `)
        .in("status", ["COMPLETED", "CASH"])
        .range(start, start + pageSize - 1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        moreDataAvailable = false;
      } else {
        allJobs = allJobs.concat(data as Job[]);
        start += pageSize;

        // If fewer than pageSize rows were returned, we've reached
        // the end and don't need another request.
        if (data.length < pageSize) {
          moreDataAvailable = false;
        }
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
      .update({
        invoiceId: job.invoiceId,
        status: "INVOICED",
      })
      .eq("id", job.id)
      .select()
      .single();

    if (error || !data) {
      return rejectWithValue(
        error?.message || "Failed to update job invoice ID"
      );
    }

    return data as Job;
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
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<Job[]>) => {
        state.status = "succeeded";
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch jobs";
      })
      .addCase(updateJobInvoiceId.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(
          (job) => job.id === action.payload.id
        );
        
        if (index !== -1) {
          state.jobs[index] = { ...state.jobs[index], ...action.payload };
        }

        if (state.selectedJob?.id === action.payload.id) {
          state.selectedJob = { ...state.selectedJob, ...action.payload };
        }
      });
  },
});

export const { setSelectedJob } = jobSlice.actions;
export { updateJobInvoiceId };
export default jobSlice.reducer;
