import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Download, MapPin, User, DollarSign, FileText, Image, Loader2, Plus, Trash2, CalendarDays, UserCog, ClipboardCheck, Check, X, Gift } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AdminAttendanceCalendar } from "@/components/hr/AdminAttendanceCalendar";

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
}

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInPhotoUrl: string | null;
  punchOutPhotoUrl: string | null;
  punchInLatitude: string | null;
  punchInLongitude: string | null;
  punchInAddress: string | null;
  punchOutLatitude: string | null;
  punchOutLongitude: string | null;
  punchOutAddress: string | null;
  workingHours: string | null;
  overtimeHours: string | null;
  status: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  userDepartment: string | null;
}

interface SalaryConfig {
  id: number;
  userId: string;
  basicSalary: string | null;
  houseRentAllowance: string | null;
  conveyanceAllowance: string | null;
  medicalAllowance: string | null;
  specialAllowance: string | null;
  grossSalary: string | null;
  deductions: string | null;
  netSalary: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  userDepartment: string | null;
}

interface SalarySlip {
  id: number;
  userId: string;
  month: number;
  year: number;
  basicSalary: string | null;
  houseRentAllowance: string | null;
  conveyanceAllowance: string | null;
  medicalAllowance: string | null;
  specialAllowance: string | null;
  grossSalary: string | null;
  totalDeductions: string | null;
  netSalary: string | null;
  workingDays: number | null;
  presentDays: number | null;
  absentDays: number | null;
  leaveDays: number | null;
  overtimeHours: string | null;
  status: string | null;
  userName: string | null;
  userEmail: string | null;
  userDepartment: string | null;
}

interface MonthlyIncentive {
  id: number;
  userId: string;
  month: number;
  year: number;
  numberOfEnquiries: number | null;
  enquiryIncentiveAmount: string | null;
  salesIncentiveAmount: string | null;
  totalIncentive: string | null;
  remarks: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface PaidHoliday {
  id: number;
  date: string;
  name: string;
  description: string | null;
  year: number;
  month: number;
  isRecurring: boolean | null;
  createdAt: string | null;
  createdBy: string | null;
}

export default function HRManagement() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
    description: "",
  });
  const [holidayFilterYear, setHolidayFilterYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/hr/admin/staff"],
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/hr/admin/attendance", startDate, endDate, selectedEmployee],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedEmployee && selectedEmployee !== "all") params.set("userId", selectedEmployee);
      const response = await fetch(`/api/hr/admin/attendance?${params}`);
      return response.json();
    },
  });

  const { data: salaries = [] } = useQuery<SalaryConfig[]>({
    queryKey: ["/api/hr/admin/salaries"],
  });

  const { data: salarySlips = [] } = useQuery<SalarySlip[]>({
    queryKey: ["/api/hr/admin/salary-slips", selectedMonth, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());
      const response = await fetch(`/api/hr/admin/salary-slips?${params}`);
      return response.json();
    },
  });

  const { data: holidays = [], isLoading: loadingHolidays } = useQuery<PaidHoliday[]>({
    queryKey: ["/api/hr/holidays", holidayFilterYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("year", holidayFilterYear.toString());
      const response = await fetch(`/api/hr/holidays?${params}`);
      return response.json();
    },
  });

  const { data: workingDaysInfo } = useQuery({
    queryKey: ["/api/hr/working-days", selectedYear, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("year", selectedYear.toString());
      params.set("month", selectedMonth.toString());
      const response = await fetch(`/api/hr/working-days?${params}`);
      return response.json();
    },
  });

  const [salaryForm, setSalaryForm] = useState({
    basicSalary: "",
    houseRentAllowance: "",
    conveyanceAllowance: "",
    medicalAllowance: "",
    specialAllowance: "",
    deductions: "",
    bankAccountNumber: "",
    bankName: "",
    ifscCode: "",
    panNumber: "",
  });

  const [incentiveMonth, setIncentiveMonth] = useState(new Date().getMonth() + 1);
  const [incentiveYear, setIncentiveYear] = useState(new Date().getFullYear());
  const [showIncentiveDialog, setShowIncentiveDialog] = useState(false);
  const [selectedIncentiveStaff, setSelectedIncentiveStaff] = useState<StaffMember | null>(null);
  const [incentiveForm, setIncentiveForm] = useState({
    numberOfEnquiries: "0",
    salesIncentiveAmount: "0",
    remarks: "",
  });

  const { data: monthlyIncentives = [] } = useQuery<MonthlyIncentive[]>({
    queryKey: ["/api/hr/admin/incentives", { month: incentiveMonth, year: incentiveYear }],
    queryFn: async () => {
      const response = await fetch(`/api/hr/admin/incentives?month=${incentiveMonth}&year=${incentiveYear}`, { credentials: "include" });
      return response.json();
    },
  });

  const saveIncentiveMutation = useMutation({
    mutationFn: async (data: typeof incentiveForm) => {
      const response = await fetch(`/api/hr/admin/incentives/${selectedIncentiveStaff?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          month: incentiveMonth,
          year: incentiveYear,
        }),
      });
      if (!response.ok) throw new Error("Failed to save incentive");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Incentive saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/admin/incentives", { month: incentiveMonth, year: incentiveYear }] });
      setShowIncentiveDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to save incentive", variant: "destructive" });
    },
  });

  const { data: currentSalary } = useQuery({
    queryKey: ["/api/hr/admin/salary", selectedStaff?.id],
    enabled: !!selectedStaff?.id,
    queryFn: async () => {
      const response = await fetch(`/api/hr/admin/salary/${selectedStaff?.id}`);
      return response.json();
    },
  });

  const saveSalaryMutation = useMutation({
    mutationFn: async (data: typeof salaryForm) => {
      return apiRequest(`/api/hr/admin/salary/${selectedStaff?.id}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Salary configuration saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/admin/salaries"] });
      setShowSalaryDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const generateSlipMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("/api/hr/admin/salary-slip/generate", {
        method: "POST",
        body: JSON.stringify({ userId, month: selectedMonth, year: selectedYear }),
      });
    },
    onSuccess: () => {
      toast({ title: "Salary slip generated" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/admin/salary-slips"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate", description: error.message, variant: "destructive" });
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (data: typeof holidayForm) => {
      return apiRequest("/api/hr/holidays", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Holiday added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/holidays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/working-days"] });
      setShowHolidayDialog(false);
      setHolidayForm({ date: "", name: "", description: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add holiday", description: error.message, variant: "destructive" });
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/hr/holidays/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ title: "Holiday deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/holidays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/working-days"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  // Manual Punching State
  const [manualPunchForm, setManualPunchForm] = useState({
    userId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    attendanceType: "full_day",
    notes: "",
  });

  // Leave Management State
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("all");

  // Get employees for manual punching
  const { data: employees = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/hr/employees"],
  });

  // Get all leave applications
  const { data: leaveApplications = [], isLoading: loadingLeaves } = useQuery<any[]>({
    queryKey: ["/api/hr/leaves", leaveStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leaveStatusFilter !== "all") params.set("status", leaveStatusFilter);
      const response = await fetch(`/api/hr/leaves?${params}`);
      return response.json();
    },
  });

  // Manual punch mutation
  const manualPunchMutation = useMutation({
    mutationFn: async (data: typeof manualPunchForm) => {
      return apiRequest("/api/hr/attendance/manual", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Attendance marked successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/admin/attendance"] });
      setManualPunchForm({ userId: "", date: format(new Date(), "yyyy-MM-dd"), attendanceType: "full_day", notes: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to mark attendance", description: error.message, variant: "destructive" });
    },
  });

  // Approve/Reject leave mutation
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      return apiRequest(`/api/hr/leaves/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
    },
    onSuccess: () => {
      toast({ title: "Leave status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const handleEditSalary = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowSalaryDialog(true);
  };

  const handleViewPhoto = (photoPath: string) => {
    setPhotoUrl(`/api/hr/attendance/photo/${photoPath}`);
    setShowPhotoDialog(true);
  };

  const downloadAttendanceReport = () => {
    let csv = "Employee,Email,Department,Date,Punch In,Punch Out,Working Hours,Status,Location\n";
    attendance.forEach((record) => {
      csv += `"${record.userName || ''}","${record.userEmail || ''}","${record.userDepartment || ''}","${record.date}","${record.punchInTime ? format(new Date(record.punchInTime), "HH:mm:ss") : ''}","${record.punchOutTime ? format(new Date(record.punchOutTime), "HH:mm:ss") : ''}","${record.workingHours || ''}","${record.status || ''}","${record.punchInAddress || ''}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const downloadSalarySheet = () => {
    let csv = "Employee,Email,Department,Month,Year,Basic,HRA,Conveyance,Medical,Special,Gross,Deductions,Net,Present Days,Absent Days\n";
    salarySlips.forEach((slip) => {
      csv += `"${slip.userName || ''}","${slip.userEmail || ''}","${slip.userDepartment || ''}","${slip.month}","${slip.year}","${slip.basicSalary || 0}","${slip.houseRentAllowance || 0}","${slip.conveyanceAllowance || 0}","${slip.medicalAllowance || 0}","${slip.specialAllowance || 0}","${slip.grossSalary || 0}","${slip.totalDeductions || 0}","${slip.netSalary || 0}","${slip.presentDays || 0}","${slip.absentDays || 0}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary_sheet_${selectedMonth}_${selectedYear}.csv`;
    a.click();
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Management</h1>
          <p className="text-muted-foreground">Manage attendance, salaries, and employee records</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="manual-punch" className="gap-2">
            <UserCog className="h-4 w-4" />
            Manual Punch
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Leaves
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="salaries" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Salary Config
          </TabsTrigger>
          <TabsTrigger value="incentives" className="gap-2">
            <Gift className="h-4 w-4" />
            Incentives
          </TabsTrigger>
          <TabsTrigger value="payslips" className="gap-2">
            <FileText className="h-4 w-4" />
            Salary Slips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>View and download employee attendance</CardDescription>
                </div>
                <Button onClick={downloadAttendanceReport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label>Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Punch In</TableHead>
                        <TableHead>Punch Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Photos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{record.userName}</p>
                                <p className="text-xs text-muted-foreground">{record.userDepartment}</p>
                              </div>
                            </TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>
                              {record.punchInTime ? format(new Date(record.punchInTime), "HH:mm") : "-"}
                            </TableCell>
                            <TableCell>
                              {record.punchOutTime ? format(new Date(record.punchOutTime), "HH:mm") : "-"}
                            </TableCell>
                            <TableCell>{record.workingHours ? `${record.workingHours}h` : "-"}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === "present" ? "default" : "secondary"}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {record.punchInAddress ? (
                                <div className="flex items-center gap-1 max-w-[150px]">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate text-xs">{record.punchInAddress}</span>
                                </div>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {record.punchInPhotoUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewPhoto(record.punchInPhotoUrl!)}
                                  >
                                    <Image className="h-4 w-4" />
                                  </Button>
                                )}
                                {record.punchOutPhotoUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewPhoto(record.punchOutPhotoUrl!)}
                                  >
                                    <Image className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Punching Tab - Calendar Based */}
        <TabsContent value="manual-punch" className="space-y-4">
          <AdminAttendanceCalendar />
          
          {/* Quick Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Quick Attendance Entry
              </CardTitle>
              <CardDescription>
                Quickly mark attendance for a specific employee and date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <Label>Select Employee *</Label>
                  <Select
                    value={manualPunchForm.userId}
                    onValueChange={(value) => setManualPunchForm({ ...manualPunchForm, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={manualPunchForm.date}
                    onChange={(e) => setManualPunchForm({ ...manualPunchForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Attendance Type *</Label>
                  <Select
                    value={manualPunchForm.attendanceType}
                    onValueChange={(value) => setManualPunchForm({ ...manualPunchForm, attendanceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_day">Full Day (9:00 AM - 6:00 PM)</SelectItem>
                      <SelectItem value="half_day">Half Day (9:00 AM - 1:00 PM)</SelectItem>
                      <SelectItem value="late_mark">Late Mark (10:30 AM - 6:00 PM)</SelectItem>
                      <SelectItem value="day_off">Day Off / Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={manualPunchForm.notes}
                    onChange={(e) => setManualPunchForm({ ...manualPunchForm, notes: e.target.value })}
                    placeholder="Reason..."
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => manualPunchMutation.mutate(manualPunchForm)}
                    disabled={!manualPunchForm.userId || !manualPunchForm.date || manualPunchMutation.isPending}
                    className="w-full"
                  >
                    {manualPunchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Mark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Leave Applications
                  </CardTitle>
                  <CardDescription>Review and manage employee leave requests</CardDescription>
                </div>
                <Select value={leaveStatusFilter} onValueChange={setLeaveStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeaves ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : leaveApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leave applications found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveApplications.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{leave.userName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{leave.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={leave.leaveType === 'full_day' ? 'default' : 'secondary'}>
                              {leave.leaveType === 'full_day' ? 'Full Day' : 'Half Day'}
                            </Badge>
                          </TableCell>
                          <TableCell>{leave.startDate}</TableCell>
                          <TableCell>{leave.endDate}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{leave.reason || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                leave.status === 'approved' ? 'default' :
                                leave.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                              className={leave.status === 'approved' ? 'bg-green-500' : ''}
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {leave.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'approved' })}
                                  disabled={updateLeaveStatusMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'rejected' })}
                                  disabled={updateLeaveStatusMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Salary Configuration</CardTitle>
              <CardDescription>Configure salary components for each employee</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>HRA</TableHead>
                      <TableHead>Conveyance</TableHead>
                      <TableHead>Medical</TableHead>
                      <TableHead>Special</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => {
                      const salary = salaries.find((s) => s.userId === member.id);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell>₹{salary?.basicSalary || "-"}</TableCell>
                          <TableCell>₹{salary?.houseRentAllowance || "-"}</TableCell>
                          <TableCell>₹{salary?.conveyanceAllowance || "-"}</TableCell>
                          <TableCell>₹{salary?.medicalAllowance || "-"}</TableCell>
                          <TableCell>₹{salary?.specialAllowance || "-"}</TableCell>
                          <TableCell className="font-medium text-green-600">₹{salary?.grossSalary || "-"}</TableCell>
                          <TableCell className="text-red-600">₹{salary?.deductions || "0"}</TableCell>
                          <TableCell className="font-bold">₹{salary?.netSalary || "-"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleEditSalary(member)}>
                              Configure
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Paid Holidays Management
                  </CardTitle>
                  <CardDescription>
                    Manage paid holidays for the organization. Saturdays and Sundays are automatically considered as off days.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowHolidayDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Saturdays and Sundays are automatically considered as paid off days. 
                  Add public holidays and company-specific holidays below.
                </p>
              </div>

              <div className="flex gap-4 mb-4">
                <div>
                  <Label>Filter by Year</Label>
                  <Select value={holidayFilterYear.toString()} onValueChange={(v) => setHolidayFilterYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {workingDaysInfo && (
                  <div className="flex items-end gap-6 text-sm">
                    <div className="text-center">
                      <span className="block text-muted-foreground">Working Days</span>
                      <span className="font-semibold text-lg">{workingDaysInfo.workingDays}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-muted-foreground">Weekends</span>
                      <span className="font-semibold text-lg">{workingDaysInfo.weekends}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-muted-foreground">Holidays</span>
                      <span className="font-semibold text-lg">{workingDaysInfo.holidays}</span>
                    </div>
                  </div>
                )}
              </div>

              {loadingHolidays ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No holidays added for {holidayFilterYear}. Click "Add Holiday" to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => {
                      const holidayDate = new Date(holiday.date);
                      const dayName = format(holidayDate, "EEEE");
                      return (
                        <TableRow key={holiday.id}>
                          <TableCell>{format(holidayDate, "dd MMM yyyy")}</TableCell>
                          <TableCell>{dayName}</TableCell>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell className="text-muted-foreground">{holiday.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                              disabled={deleteHolidayMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incentives" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Monthly Incentives
                  </CardTitle>
                  <CardDescription>Manage monthly incentives for employees - enquiry incentive (₹150 per enquiry) and sales incentive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div>
                  <Label>Month</Label>
                  <Select value={incentiveMonth.toString()} onValueChange={(v) => setIncentiveMonth(parseInt(v))}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={incentiveYear.toString()} onValueChange={(v) => setIncentiveYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>No. of Enquiries</TableHead>
                      <TableHead>Enquiry Incentive (×₹150)</TableHead>
                      <TableHead>Sales Incentive</TableHead>
                      <TableHead>Total Incentive</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => {
                      const incentive = monthlyIncentives.find((i) => i.userId === member.id);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{incentive?.numberOfEnquiries || 0}</TableCell>
                          <TableCell className="text-green-600 font-medium">₹{incentive?.enquiryIncentiveAmount || "0"}</TableCell>
                          <TableCell className="text-blue-600 font-medium">₹{incentive?.salesIncentiveAmount || "0"}</TableCell>
                          <TableCell className="font-bold text-purple-600">₹{incentive?.totalIncentive || "0"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{incentive?.remarks || "-"}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedIncentiveStaff(member);
                                setIncentiveForm({
                                  numberOfEnquiries: (incentive?.numberOfEnquiries || 0).toString(),
                                  salesIncentiveAmount: incentive?.salesIncentiveAmount || "0",
                                  remarks: incentive?.remarks || "",
                                });
                                setShowIncentiveDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Salary Slips</CardTitle>
                  <CardDescription>Generate and download salary slips</CardDescription>
                </div>
                <Button onClick={downloadSalarySheet} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div>
                  <Label>Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>HRA</TableHead>
                      <TableHead>Conveyance</TableHead>
                      <TableHead>Medical</TableHead>
                      <TableHead>Special</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => {
                      const slip = salarySlips.find((s) => s.userId === member.id);
                      const hasSalaryConfig = salaries.some((s) => s.userId === member.id);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground">{member.department}</p>
                            </div>
                          </TableCell>
                          <TableCell>{slip?.basicSalary || "-"}</TableCell>
                          <TableCell>{slip?.houseRentAllowance || "-"}</TableCell>
                          <TableCell>{slip?.conveyanceAllowance || "-"}</TableCell>
                          <TableCell>{slip?.medicalAllowance || "-"}</TableCell>
                          <TableCell>{slip?.specialAllowance || "-"}</TableCell>
                          <TableCell>{slip?.grossSalary || "-"}</TableCell>
                          <TableCell className="font-medium">{slip?.netSalary || "-"}</TableCell>
                          <TableCell>
                            {slip ? (
                              <Badge variant={slip.status === "paid" ? "default" : "secondary"}>
                                {slip.status}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!hasSalaryConfig || generateSlipMutation.isPending}
                              onClick={() => generateSlipMutation.mutate(member.id)}
                            >
                              {generateSlipMutation.isPending ? "..." : slip ? "Regenerate" : "Generate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Salary</DialogTitle>
            <DialogDescription>
              {selectedStaff?.firstName} {selectedStaff?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Basic Salary (INR)</Label>
              <Input
                type="number"
                value={currentSalary?.basicSalary || salaryForm.basicSalary}
                onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: e.target.value })}
                placeholder="11200"
              />
            </div>
            <div>
              <Label>House Rent Allowance</Label>
              <Input
                type="number"
                value={currentSalary?.houseRentAllowance || salaryForm.houseRentAllowance}
                onChange={(e) => setSalaryForm({ ...salaryForm, houseRentAllowance: e.target.value })}
                placeholder="4480"
              />
            </div>
            <div>
              <Label>Conveyance Allowance</Label>
              <Input
                type="number"
                value={currentSalary?.conveyanceAllowance || salaryForm.conveyanceAllowance}
                onChange={(e) => setSalaryForm({ ...salaryForm, conveyanceAllowance: e.target.value })}
                placeholder="1280"
              />
            </div>
            <div>
              <Label>Medical Allowance</Label>
              <Input
                type="number"
                value={currentSalary?.medicalAllowance || salaryForm.medicalAllowance}
                onChange={(e) => setSalaryForm({ ...salaryForm, medicalAllowance: e.target.value })}
                placeholder="960"
              />
            </div>
            <div>
              <Label>Special Allowance</Label>
              <Input
                type="number"
                value={currentSalary?.specialAllowance || salaryForm.specialAllowance}
                onChange={(e) => setSalaryForm({ ...salaryForm, specialAllowance: e.target.value })}
                placeholder="10080"
              />
            </div>
            <div>
              <Label>Deductions</Label>
              <Input
                type="number"
                value={currentSalary?.deductions || salaryForm.deductions}
                onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Bank Account</Label>
              <Input
                value={currentSalary?.bankAccountNumber || salaryForm.bankAccountNumber}
                onChange={(e) => setSalaryForm({ ...salaryForm, bankAccountNumber: e.target.value })}
                placeholder="Account number"
              />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={currentSalary?.bankName || salaryForm.bankName}
                onChange={(e) => setSalaryForm({ ...salaryForm, bankName: e.target.value })}
                placeholder="Bank name"
              />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input
                value={currentSalary?.ifscCode || salaryForm.ifscCode}
                onChange={(e) => setSalaryForm({ ...salaryForm, ifscCode: e.target.value })}
                placeholder="IFSC code"
              />
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input
                value={currentSalary?.panNumber || salaryForm.panNumber}
                onChange={(e) => setSalaryForm({ ...salaryForm, panNumber: e.target.value })}
                placeholder="PAN number"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSalaryDialog(false)}>Cancel</Button>
            <Button onClick={() => saveSalaryMutation.mutate(salaryForm)} disabled={saveSalaryMutation.isPending}>
              {saveSalaryMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIncentiveDialog} onOpenChange={setShowIncentiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Monthly Incentive - {new Date(incentiveYear, incentiveMonth - 1, 1).toLocaleString('default', { month: 'long' })} {incentiveYear}
            </DialogTitle>
            <DialogDescription>
              {selectedIncentiveStaff?.firstName} {selectedIncentiveStaff?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Number of Enquiries Received</Label>
              <Input
                type="number"
                value={incentiveForm.numberOfEnquiries}
                onChange={(e) => setIncentiveForm({ ...incentiveForm, numberOfEnquiries: e.target.value })}
                placeholder="0"
              />
              <p className="text-sm text-green-600 mt-1 font-medium">
                Enquiry Incentive: ₹{(parseInt(incentiveForm.numberOfEnquiries) || 0) * 150} (×₹150)
              </p>
            </div>
            <div>
              <Label>Sales Incentive Amount (₹)</Label>
              <Input
                type="number"
                value={incentiveForm.salesIncentiveAmount}
                onChange={(e) => setIncentiveForm({ ...incentiveForm, salesIncentiveAmount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-700">
                Total Incentive: ₹{((parseInt(incentiveForm.numberOfEnquiries) || 0) * 150) + (parseFloat(incentiveForm.salesIncentiveAmount) || 0)}
              </p>
            </div>
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={incentiveForm.remarks}
                onChange={(e) => setIncentiveForm({ ...incentiveForm, remarks: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowIncentiveDialog(false)}>Cancel</Button>
            <Button onClick={() => saveIncentiveMutation.mutate(incentiveForm)} disabled={saveIncentiveMutation.isPending}>
              {saveIncentiveMutation.isPending ? "Saving..." : "Save Incentive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Photo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img src={photoUrl} alt="Attendance" className="w-full h-full object-cover" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Add Paid Holiday
            </DialogTitle>
            <DialogDescription>
              Add a new paid holiday. All employees will have this day off with full pay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Holiday Date *</Label>
              <Input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Holiday Name *</Label>
              <Input
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="e.g., Republic Day, Diwali, Christmas"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={holidayForm.description}
                onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                placeholder="Additional details about the holiday"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowHolidayDialog(false);
              setHolidayForm({ date: "", name: "", description: "" });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => addHolidayMutation.mutate(holidayForm)} 
              disabled={addHolidayMutation.isPending || !holidayForm.date || !holidayForm.name}
            >
              {addHolidayMutation.isPending ? "Adding..." : "Add Holiday"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
