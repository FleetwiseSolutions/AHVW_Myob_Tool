import Sidebar from "../components/Sidebar";
import JobDetails from "../components/JobDetails";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <JobDetails />
      </main>
    </div>
  );
}