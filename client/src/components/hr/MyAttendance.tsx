import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Loader2, History, ClipboardList } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  workingHours: string | null;
  status: string | null;
  notes: string | null;
}

interface LeaveApplication {
  id: number;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approvalDate: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  halfDay: number;
  late: number;
  absent: number;
  leave: number;
  totalWorkingHours: number;
}

export function MyAttendance() {
  const [activeTab, setActiveTab] = useState("history");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "full_day",
    halfDayPeriod: "first_half" as "first_half" | "second_half",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get attendance history
  const { data: attendanceHistory = [], isLoading: loadingHistory } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/hr/attendance/history", selectedMonth, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());
      const response = await fetch(`/api/hr/attendance/history?${params}`);
      return response.json();
    },
  });

  // Get attendance summary
  const { data: summary } = useQuery<AttendanceSummary>({
    queryKey: ["/api/hr/attendance/summary", selectedMonth, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());
      const response = await fetch(`/api/hr/attendance/summary?${params}`);
      return response.json();
    },
  });

  // Get my leave applications
  const { data: myLeaves = [], isLoading: loadingLeaves } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/hr/leaves/my"],
  });

  // Apply for leave mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: typeof leaveForm) => {
      return apiRequest("/api/hr/leaves/apply", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Leave application submitted" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves/my"] });
      setShowApplyDialog(false);
      setLeaveForm({ leaveType: "full_day", halfDayPeriod: "first_half", startDate: "", endDate: "", reason: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to apply", description: error.message, variant: "destructive" });
    },
  });

  const handleApplyLeave = () => {
    // Validate dates before submitting
    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast({ title: "Invalid dates", description: "Start date must be before or equal to end date", variant: "destructive" });
      return;
    }
    applyLeaveMutation.mutate(leaveForm);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>;
      case "half_day":
        return <Badge className="bg-yellow-500">Half Day</Badge>;
      case "late":
        return <Badge className="bg-orange-500">Late</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "leave":
        return <Badge variant="secondary">Leave</Badge>;
      default:
        return <Badge variant="outline">{status || "-"}</Badge>;
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Attendance</h2>
          <p className="text-muted-foreground">Track your attendance and apply for leaves</p>
        </div>
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit a leave application for approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Leave Type *</Label>
                <Select
                  value={leaveForm.leaveType}
                  onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day Leave</SelectItem>
                    <SelectItem value="half_day">Half Day Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {leaveForm.leaveType === "half_day" && (
                <div>
                  <Label>Half Day Period *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="halfDayPeriod"
                        value="first_half"
                        checked={leaveForm.halfDayPeriod === "first_half"}
                        onChange={(e) => setLeaveForm({ ...leaveForm, halfDayPeriod: e.target.value as "first_half" | "second_half" })}
                        className="w-4 h-4"
                      />
                      <span>First Half (Morning)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="halfDayPeriod"
                        value="second_half"
                        checked={leaveForm.halfDayPeriod === "second_half"}
                        onChange={(e) => setLeaveForm({ ...leaveForm, halfDayPeriod: e.target.value as "first_half" | "second_half" })}
                        className="w-4 h-4"
                      />
                      <span>Second Half (Afternoon)</span>
                    </label>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date *</Label>
                  <Input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>To Date *</Label>
                  <Input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for leave..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleApplyLeave}
                  disabled={!leaveForm.startDate || !leaveForm.endDate || applyLeaveMutation.isPending}
                >
                  {applyLeaveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              <p className="text-xs text-muted-foreground">Present Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.halfDay}</div>
              <p className="text-xs text-muted-foreground">Half Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{summary.late}</div>
              <p className="text-xs text-muted-foreground">Late Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              <p className="text-xs text-muted-foreground">Absent Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{summary.leave}</div>
              <p className="text-xs text-muted-foreground">Leave Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{summary.totalWorkingHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Attendance History
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            My Leave Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance History</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records for this period
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Punch In</TableHead>
                        <TableHead>Punch Out</TableHead>
                        <TableHead>Working Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {record.punchInTime ? format(new Date(record.punchInTime), "hh:mm a") : "-"}
                          </TableCell>
                          <TableCell>
                            {record.punchOutTime ? format(new Date(record.punchOutTime), "hh:mm a") : "-"}
                          </TableCell>
                          <TableCell>{record.workingHours || "-"}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle>My Leave Applications</CardTitle>
              <CardDescription>Track the status of your leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLeaves ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leave applications yet. Click "Apply for Leave" to submit one.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <Badge variant={leave.leaveType === 'full_day' ? 'default' : 'secondary'}>
                              {leave.leaveType === 'full_day' ? 'Full Day' : 
                                `Half Day (${(leave as any).halfDayPeriod === 'first_half' ? 'Morning' : 'Afternoon'})`}
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
                            {leave.status === 'rejected' && leave.rejectionReason && (
                              <p className="text-xs text-red-500 mt-1">{leave.rejectionReason}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(leave.createdAt), "dd MMM yyyy")}
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
      </Tabs>
    </div>
  );
}
