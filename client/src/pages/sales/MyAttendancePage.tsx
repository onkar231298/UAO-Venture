import { SalesLayout } from "@/components/layouts/SalesLayout";
import { MyAttendance } from "@/components/hr/MyAttendance";

export default function MyAttendancePage() {
  return (
    <SalesLayout title="My Attendance" subtitle="View your attendance and apply for leave">
      <MyAttendance />
    </SalesLayout>
  );
}
