import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Calendar, Check, Clock, X, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  status: string;
  workingHours: string | null;
  remarks: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ATTENDANCE_TYPES = [
  { value: "full_day", label: "Full Day Present", color: "bg-green-500" },
  { value: "half_day", label: "Half Day", color: "bg-yellow-500" },
  { value: "late_mark", label: "Late Mark", color: "bg-orange-500" },
  { value: "day_off", label: "Day Off / Absent", color: "bg-red-500" },
];

export function AdminAttendanceCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceType, setAttendanceType] = useState<string>("full_day");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
  });

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/hr/attendance/history/${selectedEmployee}`, { month: selectedMonth, year: selectedYear }],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const res = await fetch(`/api/hr/attendance/history/${selectedEmployee}?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedEmployee,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { userId: string; date: string; attendanceType: string; notes: string }) => {
      return apiRequest("/api/hr/attendance/manual", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Attendance marked successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/hr/attendance/history/${selectedEmployee}`, { month: selectedMonth, year: selectedYear }] });
      setDialogOpen(false);
      setNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to mark attendance", description: error.message, variant: "destructive" });
    },
  });

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getAttendanceForDate = (date: string) => {
    if (!Array.isArray(attendanceRecords)) return undefined;
    return attendanceRecords.find(r => r.date === date);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    const existingRecord = getAttendanceForDate(dateStr);
    if (existingRecord) {
      if (existingRecord.status === "present") setAttendanceType("full_day");
      else if (existingRecord.status === "half_day") setAttendanceType("half_day");
      else if (existingRecord.status === "late") setAttendanceType("late_mark");
      else if (existingRecord.status === "absent") setAttendanceType("day_off");
    } else {
      setAttendanceType("full_day");
    }
    
    setDialogOpen(true);
  };

  const handleMarkAttendance = () => {
    if (!selectedEmployee || !selectedDate) return;
    markAttendanceMutation.mutate({
      userId: selectedEmployee,
      date: selectedDate,
      attendanceType,
      notes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 text-white text-xs px-1">P</Badge>;
      case "half_day":
        return <Badge className="bg-yellow-500 text-white text-xs px-1">H</Badge>;
      case "late":
        return <Badge className="bg-orange-500 text-white text-xs px-1">L</Badge>;
      case "absent":
        return <Badge className="bg-red-500 text-white text-xs px-1">A</Badge>;
      case "leave":
        return <Badge className="bg-blue-500 text-white text-xs px-1">LV</Badge>;
      case "holiday":
        return <Badge className="bg-purple-500 text-white text-xs px-1">HO</Badge>;
      default:
        return null;
    }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDayOfMonth = getFirstDayOfMonth(selectedMonth, selectedYear);
  const days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-16" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = getAttendanceForDate(dateStr);
    const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    days.push(
      <div
        key={day}
        onClick={() => selectedEmployee && handleDateClick(day)}
        className={`h-16 border rounded-lg p-1 flex flex-col items-center justify-between cursor-pointer transition-colors
          ${isWeekend ? 'bg-gray-100' : 'bg-white hover:bg-blue-50'}
          ${!selectedEmployee ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <span className={`text-sm font-medium ${isWeekend ? 'text-red-500' : ''}`}>{day}</span>
        {record && getStatusBadge(record.status)}
        {!record && isWeekend && <Badge variant="outline" className="text-xs px-1">Off</Badge>}
      </div>
    );
  }

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Admin Attendance Calendar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select an employee and click on any date to mark attendance manually
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <Label>Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee..." />
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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] text-center font-semibold">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployee && selectedEmployeeData && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm">
              Viewing attendance for: <strong>{selectedEmployeeData.firstName} {selectedEmployeeData.lastName}</strong> ({selectedEmployeeData.role})
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <Badge className="bg-green-500 text-white">P</Badge> Present
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-yellow-500 text-white">H</Badge> Half Day
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-orange-500 text-white">L</Badge> Late
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-red-500 text-white">A</Badge> Absent
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-blue-500 text-white">LV</Badge> Leave
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-purple-500 text-white">HO</Badge> Holiday
          </div>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <p className="font-medium">
                {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
              </p>
            </div>
            <div>
              <Label>Date</Label>
              <p className="font-medium">{selectedDate}</p>
            </div>
            <div>
              <Label>Attendance Type</Label>
              <Select value={attendanceType} onValueChange={setAttendanceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this attendance entry..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAttendance} disabled={markAttendanceMutation.isPending}>
              {markAttendanceMutation.isPending ? "Saving..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}