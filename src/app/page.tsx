import Sidebar from "../components/Sidebar";
import JobDetails from "../components/JobDetails";

export default function Home() {
  return (
    <div className="flex overflow-auto">
      <Sidebar />
      <main className="flex-1 p-4 overflow-auto">
        <JobDetails />
      </main>
    </div>
  );
}
