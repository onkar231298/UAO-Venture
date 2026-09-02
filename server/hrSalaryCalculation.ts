export interface SalaryAttendanceEntry {
  date: string;
  status: string | null;
  overtimeHours?: string | null;
}

export interface SalaryPeriodSummary {
  periodStartDate: string;
  totalDaysInMonth: number;
  presentDays: number;
  leaveDays: number;
  totalOvertimeHours: number;
  weekendDays: number;
  holidayCount: number;
  paidDays: number;
  absentDays: number;
}

export interface SalaryAmountSummary {
  absentDays: number;
  effectiveDivisor: number;
  perDaySalaryRate: number;
  absentDeduction: number;
  appliedDeductions: number;
  netPayable: number;
}

export interface StoredSalarySlipBreakdown {
  absentDeduction: number;
  perDaySalaryRate: number;
  netPayable: number;
}

export class SalaryPeriodNotStartedError extends Error {
  constructor() {
    super("Employee joining date is after the selected salary month");
    this.name = "SalaryPeriodNotStartedError";
  }
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function calculateSalaryPeriod({
  year,
  month,
  joiningDate,
  attendance,
  holidayDates,
}: {
  year: number;
  month: number;
  joiningDate?: string | null;
  attendance: SalaryAttendanceEntry[];
  holidayDates: Iterable<string>;
}): SalaryPeriodSummary {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid salary month or year");
  }

  if (joiningDate && !isValidIsoDate(joiningDate)) {
    throw new Error("Invalid employee joining date");
  }

  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = formatDateKey(year, month, 1);
  const monthEnd = formatDateKey(year, month, totalDaysInMonth);

  if (joiningDate && joiningDate > monthEnd) {
    throw new SalaryPeriodNotStartedError();
  }

  const periodStartDate = joiningDate && joiningDate > monthStart
    ? joiningDate
    : monthStart;
  const periodAttendance = attendance.filter(
    (entry) => entry.date >= periodStartDate && entry.date <= monthEnd,
  );

  const presentDays = periodAttendance.filter((entry) => entry.status === "present").length;
  const leaveDays = periodAttendance.filter((entry) => entry.status === "leave").length;
  const totalOvertimeHours = periodAttendance.reduce(
    (sum, entry) => sum + (parseFloat(entry.overtimeHours || "0") || 0),
    0,
  );
  const absentDates = new Set(
    periodAttendance.filter((entry) => entry.status === "absent").map((entry) => entry.date),
  );
  const holidays = new Set(Array.from(holidayDates, (date) => date.slice(0, 10)));

  const startDay = Number(periodStartDate.slice(8, 10));
  let weekendDays = 0;
  let holidayCount = 0;

  for (let day = startDay; day <= totalDaysInMonth; day++) {
    const dateKey = formatDateKey(year, month, day);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !absentDates.has(dateKey)) {
      weekendDays++;
    } else if (holidays.has(dateKey) && !absentDates.has(dateKey)) {
      holidayCount++;
    }
  }

  const paidDays = presentDays + leaveDays + weekendDays + holidayCount;

  return {
    periodStartDate,
    totalDaysInMonth,
    presentDays,
    leaveDays,
    totalOvertimeHours,
    weekendDays,
    holidayCount,
    paidDays,
    absentDays: Math.max(0, totalDaysInMonth - paidDays),
  };
}

export function calculateSalaryAmounts({
  fullGross,
  configuredDeductions,
  divisorMode,
  fixedDivisor,
  totalDaysInMonth,
  paidDays,
  isJoiningMonth,
}: {
  fullGross: number;
  configuredDeductions: number;
  divisorMode: string;
  fixedDivisor: number;
  totalDaysInMonth: number;
  paidDays: number;
  isJoiningMonth: boolean;
}): SalaryAmountSummary {
  const absentDays = Math.max(0, totalDaysInMonth - paidDays);
  // A partial first month is always prorated by that month's actual calendar
  // days. Fixed 26/30-day divisors remain available for later-month absences.
  const effectiveDivisor = isJoiningMonth
    ? totalDaysInMonth
    : divisorMode === "actual"
      ? totalDaysInMonth
      : fixedDivisor;
  const perDaySalaryRate = effectiveDivisor > 0 ? fullGross / effectiveDivisor : 0;
  const absentDeduction = Math.min(perDaySalaryRate * absentDays, fullGross);
  const earningsAfterAttendance = Math.max(0, fullGross - absentDeduction);
  const appliedDeductions = Math.min(
    Math.max(0, configuredDeductions),
    earningsAfterAttendance,
  );

  return {
    absentDays,
    effectiveDivisor,
    perDaySalaryRate,
    absentDeduction,
    appliedDeductions,
    netPayable: earningsAfterAttendance - appliedDeductions,
  };
}

export function getStoredSalarySlipBreakdown({
  grossSalary,
  appliedDeductions,
  netSalary,
  absentDays,
  totalDays,
}: {
  grossSalary: number;
  appliedDeductions: number;
  netSalary: number;
  absentDays: number;
  totalDays: number;
}): StoredSalarySlipBreakdown {
  const absentDeduction = Math.max(0, grossSalary - appliedDeductions - netSalary);
  const perDaySalaryRate = absentDays > 0
    ? absentDeduction / absentDays
    : totalDays > 0
      ? grossSalary / totalDays
      : 0;

  return {
    absentDeduction,
    perDaySalaryRate,
    netPayable: netSalary,
  };
}