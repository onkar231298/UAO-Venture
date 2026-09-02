import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSalaryAmounts,
  calculateSalaryPeriod,
  getStoredSalarySlipBreakdown,
  SalaryPeriodNotStartedError,
} from "./hrSalaryCalculation";

const anjaliAugustAttendance = [
  "2026-08-18",
  "2026-08-19",
  "2026-08-20",
  "2026-08-21",
  "2026-08-24",
  "2026-08-25",
  "2026-08-26",
  "2026-08-27",
  "2026-08-28",
  "2026-08-31",
].map((date) => ({ date, status: "present" }));

test("first-month salary counts paid days only from the joining date", () => {
  const result = calculateSalaryPeriod({
    year: 2026,
    month: 8,
    joiningDate: "2026-08-18",
    attendance: anjaliAugustAttendance,
    holidayDates: [],
  });

  assert.equal(result.periodStartDate, "2026-08-18");
  assert.equal(result.totalDaysInMonth, 31);
  assert.equal(result.presentDays, 10);
  assert.equal(result.weekendDays, 4);
  assert.equal(result.paidDays, 14);
  assert.equal(result.absentDays, 17);
});

test("employees who joined before the selected month use the full month", () => {
  const result = calculateSalaryPeriod({
    year: 2026,
    month: 8,
    joiningDate: "2026-07-18",
    attendance: anjaliAugustAttendance,
    holidayDates: [],
  });

  assert.equal(result.periodStartDate, "2026-08-01");
  assert.equal(result.weekendDays, 10);
  assert.equal(result.paidDays, 20);
});

test("salary slips cannot be generated before an employee joins", () => {
  assert.throws(
    () => calculateSalaryPeriod({
      year: 2026,
      month: 8,
      joiningDate: "2026-09-18",
      attendance: [],
      holidayDates: [],
    }),
    SalaryPeriodNotStartedError,
  );
});

test("a partial joining month is paid using actual calendar-day proration", () => {
  const result = calculateSalaryAmounts({
    fullGross: 31_000,
    configuredDeductions: 500,
    divisorMode: "fixed",
    fixedDivisor: 30,
    totalDaysInMonth: 31,
    paidDays: 14,
    isJoiningMonth: true,
  });

  assert.equal(result.effectiveDivisor, 31);
  assert.equal(result.absentDeduction, 17_000);
  assert.equal(result.appliedDeductions, 500);
  assert.equal(result.netPayable, 13_500);
});

test("deductions cannot make partial-month net pay negative", () => {
  const result = calculateSalaryAmounts({
    fullGross: 31_000,
    configuredDeductions: 20_000,
    divisorMode: "actual",
    fixedDivisor: 30,
    totalDaysInMonth: 31,
    paidDays: 14,
    isJoiningMonth: true,
  });

  assert.equal(result.appliedDeductions, 14_000);
  assert.equal(result.netPayable, 0);
});

test("a downloaded slip derives its breakdown from the stored payroll result", () => {
  const result = getStoredSalarySlipBreakdown({
    grossSalary: 31_000,
    appliedDeductions: 500,
    netSalary: 13_500,
    absentDays: 17,
    totalDays: 31,
  });

  assert.equal(result.absentDeduction, 17_000);
  assert.equal(result.perDaySalaryRate, 1_000);
  assert.equal(result.netPayable, 13_500);
});