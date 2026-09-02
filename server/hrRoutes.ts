import { Router, Request, Response } from "express";
import { db } from "./db";
import { attendanceRecords, employeeSalaries, salarySlips, users, paidHolidays, leaveApplications, monthlyIncentives, activityHeartbeats, dailyPerformanceSummary } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, asc, or, isNull } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { objectStorageClient } from "./objectStorage";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import {
  calculateSalaryAmounts,
  calculateSalaryPeriod,
  getStoredSalarySlipBreakdown,
  isValidIsoDate,
  SalaryPeriodNotStartedError,
} from "./hrSalaryCalculation";

const router = Router();

// Helper function to convert number to words (Indian format)
function convertNumberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertBelowHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };
  
  const convertBelowThousand = (n: number): string => {
    if (n < 100) return convertBelowHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelowHundred(n % 100) : '');
  };
  
  let result = '';
  
  // Crore (10 million)
  if (num >= 10000000) {
    result += convertBelowThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Lakh (100 thousand)
  if (num >= 100000) {
    result += convertBelowHundred(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Thousand
  if (num >= 1000) {
    result += convertBelowHundred(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Hundred
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  // Below hundred
  if (num > 0) {
    result += convertBelowHundred(num);
  }
  
  return 'Rupees ' + result.trim();
}

// Helper function to get user ID from request (handles both Replit auth and local staff users)
function getUserId(req: Request): string | null {
  const user = req.user as any;
  if (!user) return null;
  // For local staff/admin users, id is in claims.sub
  if (user.claims?.sub) return user.claims.sub;
  // For Replit auth users, id is at top level
  if (user.id) return user.id;
  return null;
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const parts = normalizedPath.split('/');
  const bucketName = parts[0];
  const objectName = parts.slice(1).join('/');
  return { bucketName, objectName };
}

function getPrivateObjectDir(): string {
  return process.env.PRIVATE_OBJECT_DIR || '';
}

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Sign a direct-to-storage URL so the browser can upload the attendance photo
// straight to object storage. This keeps the large image out of the app's
// request body (which can be rejected at the deployment edge with a 403).
async function signObjectURL(opts: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: opts.bucketName,
    object_name: opts.objectName,
    method: opts.method,
    expires_at: new Date(Date.now() + opts.ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL, errorcode: ${response.status}`);
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Calculate working hours between two timestamps
function calculateWorkingHours(punchIn: Date, punchOut: Date): number {
  const diff = punchOut.getTime() - punchIn.getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

// Get current user's attendance status for today
router.get("/api/hr/attendance/today", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const today = getTodayDate();
    const [record] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.date, today)
      ));

    res.json(record || null);
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// Get a presigned URL so the browser can upload the attendance photo directly
// to object storage, instead of sending a large base64 image in the request
// body (which the deployment edge can reject with a 403).
router.post("/api/hr/attendance/photo-upload-url", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const type = req.body?.type === "out" ? "out" : "in";
    const privateDir = getPrivateObjectDir();
    if (!privateDir) {
      return res.status(500).json({ error: "Object storage not configured" });
    }

    const today = getTodayDate();
    const timestamp = Date.now();
    const photoPath = `${privateDir}/attendance/${userId}/punch_${type}_${today}_${timestamp}.jpg`;
    const { bucketName, objectName } = parseObjectPath(photoPath);
    const uploadURL = await signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });

    res.json({ uploadURL, photoPath });
  } catch (error) {
    console.error("Error generating attendance photo upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Validate that a provided photo path belongs to the requesting user, lives
// under the expected attendance directory, matches the strict naming pattern,
// and that the object was actually uploaded — before persisting it. This stops
// a client from punching with a fabricated/never-uploaded path.
async function resolveAttendancePhotoPath(
  providedPath: string | undefined | null,
  userId: string,
  type: "in" | "out"
): Promise<string | null> {
  if (!providedPath || typeof providedPath !== "string") return null;
  const privateDir = getPrivateObjectDir();
  const expectedPrefix = `${privateDir}/attendance/${userId}/`;
  if (!providedPath.startsWith(expectedPrefix)) return null;

  const fileName = providedPath.slice(expectedPrefix.length);
  // Strict format: punch_{in|out}_{YYYY-MM-DD}_{timestamp}.jpg
  const pattern = new RegExp(`^punch_${type}_\\d{4}-\\d{2}-\\d{2}_\\d+\\.jpg$`);
  if (!pattern.test(fileName)) return null;

  // Confirm the object was actually uploaded to storage.
  try {
    const { bucketName, objectName } = parseObjectPath(providedPath);
    const [exists] = await objectStorageClient.bucket(bucketName).file(objectName).exists();
    if (!exists) return null;
  } catch {
    return null;
  }

  return providedPath;
}

// Punch In
router.post("/api/hr/attendance/punch-in", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { photoBase64, photoPath: providedPhotoPath, latitude, longitude, address } = req.body;

    if (!photoBase64 && !providedPhotoPath) {
      return res.status(400).json({ error: "Photo is required for punch in" });
    }

    const today = getTodayDate();
    
    // Check if already punched in today
    const [existing] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.date, today)
      ));

    if (existing && existing.punchInTime) {
      return res.status(400).json({ error: "Already punched in today" });
    }

    // Prefer a photo already uploaded directly to object storage; fall back to
    // base64 in the body for backward compatibility with older clients.
    const privateDir = getPrivateObjectDir();
    let photoPath = await resolveAttendancePhotoPath(providedPhotoPath, userId, "in");
    if (!photoPath) {
      if (!photoBase64) {
        return res.status(400).json({ error: "Photo is required for punch in" });
      }
      const timestamp = Date.now();
      photoPath = `${privateDir}/attendance/${userId}/punch_in_${today}_${timestamp}.jpg`;
      const photoBuffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const { bucketName, objectName } = parseObjectPath(photoPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(photoBuffer, { contentType: 'image/jpeg' });
    }

    const punchInTime = new Date();

    if (existing) {
      // Update existing record with punch in
      await db.update(attendanceRecords)
        .set({
          punchInTime,
          punchInPhotoUrl: photoPath,
          punchInLatitude: latitude?.toString(),
          punchInLongitude: longitude?.toString(),
          punchInAddress: address,
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, existing.id));
    } else {
      // Create new attendance record
      await db.insert(attendanceRecords).values({
        userId,
        date: today,
        punchInTime,
        punchInPhotoUrl: photoPath,
        punchInLatitude: latitude?.toString(),
        punchInLongitude: longitude?.toString(),
        punchInAddress: address,
        status: "present"
      });
    }

    const [record] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.date, today)
      ));

    res.json({ success: true, record });
  } catch (error) {
    console.error("Error punching in:", error);
    res.status(500).json({ error: "Failed to punch in" });
  }
});

// Punch Out
router.post("/api/hr/attendance/punch-out", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { photoBase64, photoPath: providedPhotoPath, latitude, longitude, address } = req.body;

    if (!photoBase64 && !providedPhotoPath) {
      return res.status(400).json({ error: "Photo is required for punch out" });
    }

    const today = getTodayDate();
    
    // Check if punched in today
    const [existing] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.date, today)
      ));

    if (!existing || !existing.punchInTime) {
      return res.status(400).json({ error: "Must punch in first" });
    }

    if (existing.punchOutTime) {
      return res.status(400).json({ error: "Already punched out today" });
    }

    // Prefer a photo already uploaded directly to object storage; fall back to
    // base64 in the body for backward compatibility with older clients.
    const privateDir = getPrivateObjectDir();
    let photoPath = await resolveAttendancePhotoPath(providedPhotoPath, userId, "out");
    if (!photoPath) {
      if (!photoBase64) {
        return res.status(400).json({ error: "Photo is required for punch out" });
      }
      const timestamp = Date.now();
      photoPath = `${privateDir}/attendance/${userId}/punch_out_${today}_${timestamp}.jpg`;
      const photoBuffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const { bucketName, objectName } = parseObjectPath(photoPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(photoBuffer, { contentType: 'image/jpeg' });
    }

    const punchOutTime = new Date();
    const workingHours = calculateWorkingHours(new Date(existing.punchInTime), punchOutTime);
    const overtimeHours = Math.max(0, workingHours - 8);

    await db.update(attendanceRecords)
      .set({
        punchOutTime,
        punchOutPhotoUrl: photoPath,
        punchOutLatitude: latitude?.toString(),
        punchOutLongitude: longitude?.toString(),
        punchOutAddress: address,
        workingHours: workingHours.toString(),
        overtimeHours: overtimeHours.toString(),
        updatedAt: new Date()
      })
      .where(eq(attendanceRecords.id, existing.id));

    const [record] = await db.select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.id, existing.id));

    res.json({ success: true, record });
  } catch (error) {
    console.error("Error punching out:", error);
    res.status(500).json({ error: "Failed to punch out" });
  }
});

// Get user's attendance history
router.get("/api/hr/attendance/history", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { month, year } = req.query;

    let conditions = [eq(attendanceRecords.userId, userId)];
    
    // Filter by month and year if provided
    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
      // Calculate last day of month
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
      conditions.push(gte(attendanceRecords.date, startDate));
      conditions.push(lte(attendanceRecords.date, endDate));
    }

    const records = await db.select()
      .from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.date));

    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// Admin: Get all employees attendance
router.get("/api/hr/admin/attendance", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { startDate, endDate, userId } = req.query;

    let conditions = [];
    
    if (startDate) {
      conditions.push(gte(attendanceRecords.date, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(attendanceRecords.date, endDate as string));
    }
    if (userId) {
      conditions.push(eq(attendanceRecords.userId, userId as string));
    }

    const records = await db.select({
      id: attendanceRecords.id,
      userId: attendanceRecords.userId,
      date: attendanceRecords.date,
      punchInTime: attendanceRecords.punchInTime,
      punchOutTime: attendanceRecords.punchOutTime,
      punchInPhotoUrl: attendanceRecords.punchInPhotoUrl,
      punchOutPhotoUrl: attendanceRecords.punchOutPhotoUrl,
      punchInLatitude: attendanceRecords.punchInLatitude,
      punchInLongitude: attendanceRecords.punchInLongitude,
      punchInAddress: attendanceRecords.punchInAddress,
      punchOutLatitude: attendanceRecords.punchOutLatitude,
      punchOutLongitude: attendanceRecords.punchOutLongitude,
      punchOutAddress: attendanceRecords.punchOutAddress,
      workingHours: attendanceRecords.workingHours,
      overtimeHours: attendanceRecords.overtimeHours,
      status: attendanceRecords.status,
      remarks: attendanceRecords.remarks,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      userEmail: users.email,
      userRole: users.role,
      userDepartment: users.department
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(attendanceRecords.date), asc(users.firstName));

    res.json(records);
  } catch (error) {
    console.error("Error fetching admin attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

// Admin: Get all staff users for dropdown
router.get("/api/hr/admin/staff", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const staff = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      department: users.department
    })
    .from(users)
    .where(eq(users.userType, "staff"))
    .orderBy(asc(users.firstName));

    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Admin: Get/Update employee salary config
router.get("/api/hr/admin/salary/:userId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId } = req.params;

    const [salary] = await db.select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId));

    res.json(salary || null);
  } catch (error) {
    console.error("Error fetching salary:", error);
    res.status(500).json({ error: "Failed to fetch salary" });
  }
});

router.post("/api/hr/admin/salary/:userId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId } = req.params;
    const { basicSalary, houseRentAllowance, conveyanceAllowance, medicalAllowance, specialAllowance, deductions, bankAccountNumber, bankName, ifscCode, panNumber, salarySlipName, joiningDate, perDayDivisor, perDayDivisorMode } = req.body;

    if (joiningDate && !isValidIsoDate(joiningDate)) {
      return res.status(400).json({ error: "Joining date must be a valid date" });
    }

    // Helper to convert empty strings to "0" for numeric fields
    const toNumericStr = (val: any) => {
      if (val === "" || val === null || val === undefined) return "0";
      return val.toString();
    };

    const grossSalary = (parseFloat(basicSalary) || 0) + 
                        (parseFloat(houseRentAllowance) || 0) + 
                        (parseFloat(conveyanceAllowance) || 0) + 
                        (parseFloat(medicalAllowance) || 0) + 
                        (parseFloat(specialAllowance) || 0);
    
    const netSalary = grossSalary - (parseFloat(deductions) || 0);

    const [existing] = await db.select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId));

    if (existing) {
      await db.update(employeeSalaries)
        .set({
          basicSalary: toNumericStr(basicSalary),
          houseRentAllowance: toNumericStr(houseRentAllowance),
          conveyanceAllowance: toNumericStr(conveyanceAllowance),
          medicalAllowance: toNumericStr(medicalAllowance),
          specialAllowance: toNumericStr(specialAllowance),
          grossSalary: grossSalary.toString(),
          deductions: toNumericStr(deductions),
          netSalary: netSalary.toString(),
          bankAccountNumber: bankAccountNumber || "",
          bankName: bankName || "",
          ifscCode: ifscCode || "",
          panNumber: panNumber || "",
          salarySlipName: salarySlipName || "",
          joiningDate: joiningDate || null,
          perDayDivisor: parseInt(perDayDivisor) || 30,
          perDayDivisorMode: perDayDivisorMode || "fixed",
          updatedAt: new Date()
        })
        .where(eq(employeeSalaries.id, existing.id));
    } else {
      await db.insert(employeeSalaries).values({
        userId,
        basicSalary: toNumericStr(basicSalary),
        houseRentAllowance: toNumericStr(houseRentAllowance),
        conveyanceAllowance: toNumericStr(conveyanceAllowance),
        medicalAllowance: toNumericStr(medicalAllowance),
        specialAllowance: toNumericStr(specialAllowance),
        grossSalary: grossSalary.toString(),
        deductions: toNumericStr(deductions),
        netSalary: netSalary.toString(),
        bankAccountNumber: bankAccountNumber || "",
        bankName: bankName || "",
        ifscCode: ifscCode || "",
        panNumber: panNumber || "",
        salarySlipName: salarySlipName || "",
        joiningDate: joiningDate || null,
        perDayDivisor: parseInt(perDayDivisor) || 30,
        perDayDivisorMode: perDayDivisorMode || "fixed",
      });
    }

    const [salary] = await db.select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId));

    res.json({ success: true, salary });
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ error: "Failed to update salary" });
  }
});

// Admin: Get all salary configurations
router.get("/api/hr/admin/salaries", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const salaries = await db.select({
      id: employeeSalaries.id,
      userId: employeeSalaries.userId,
      basicSalary: employeeSalaries.basicSalary,
      houseRentAllowance: employeeSalaries.houseRentAllowance,
      conveyanceAllowance: employeeSalaries.conveyanceAllowance,
      medicalAllowance: employeeSalaries.medicalAllowance,
      specialAllowance: employeeSalaries.specialAllowance,
      grossSalary: employeeSalaries.grossSalary,
      deductions: employeeSalaries.deductions,
      netSalary: employeeSalaries.netSalary,
      bankAccountNumber: employeeSalaries.bankAccountNumber,
      bankName: employeeSalaries.bankName,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      userEmail: users.email,
      userRole: users.role,
      userDepartment: users.department
    })
    .from(employeeSalaries)
    .leftJoin(users, eq(employeeSalaries.userId, users.id))
    .orderBy(asc(users.firstName));

    res.json(salaries);
  } catch (error) {
    console.error("Error fetching salaries:", error);
    res.status(500).json({ error: "Failed to fetch salaries" });
  }
});

// Monthly Incentives - Get all for a specific month/year
router.get("/api/hr/admin/incentives", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { month, year } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const incentives = await db.select({
      id: monthlyIncentives.id,
      userId: monthlyIncentives.userId,
      month: monthlyIncentives.month,
      year: monthlyIncentives.year,
      numberOfEnquiries: monthlyIncentives.numberOfEnquiries,
      enquiryIncentiveAmount: monthlyIncentives.enquiryIncentiveAmount,
      salesIncentiveAmount: monthlyIncentives.salesIncentiveAmount,
      totalIncentive: monthlyIncentives.totalIncentive,
      remarks: monthlyIncentives.remarks,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      userEmail: users.email,
    })
    .from(monthlyIncentives)
    .leftJoin(users, eq(monthlyIncentives.userId, users.id))
    .where(and(
      eq(monthlyIncentives.month, monthNum),
      eq(monthlyIncentives.year, yearNum)
    ))
    .orderBy(asc(users.firstName));

    res.json(incentives);
  } catch (error) {
    console.error("Error fetching incentives:", error);
    res.status(500).json({ error: "Failed to fetch incentives" });
  }
});

// Monthly Incentives - Save/Update for an employee
router.post("/api/hr/admin/incentives/:userId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId } = req.params;
    const { month, year, numberOfEnquiries, salesIncentiveAmount, remarks } = req.body;

    const enquiries = parseInt(numberOfEnquiries) || 0;
    const enquiryIncentive = enquiries * 150; // ₹150 per enquiry
    const salesIncentive = parseFloat(salesIncentiveAmount) || 0;
    const total = enquiryIncentive + salesIncentive;

    const [existing] = await db.select()
      .from(monthlyIncentives)
      .where(and(
        eq(monthlyIncentives.userId, userId),
        eq(monthlyIncentives.month, month),
        eq(monthlyIncentives.year, year)
      ));

    if (existing) {
      await db.update(monthlyIncentives)
        .set({
          numberOfEnquiries: enquiries,
          enquiryIncentiveAmount: enquiryIncentive.toString(),
          salesIncentiveAmount: salesIncentive.toString(),
          totalIncentive: total.toString(),
          remarks,
          updatedAt: new Date()
        })
        .where(eq(monthlyIncentives.id, existing.id));
    } else {
      await db.insert(monthlyIncentives).values({
        userId,
        month,
        year,
        numberOfEnquiries: enquiries,
        enquiryIncentiveAmount: enquiryIncentive.toString(),
        salesIncentiveAmount: salesIncentive.toString(),
        totalIncentive: total.toString(),
        remarks
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving incentive:", error);
    res.status(500).json({ error: "Failed to save incentive" });
  }
});

// Generate salary slip for an employee for a specific month
router.post("/api/hr/admin/salary-slip/generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId, month, year } = req.body;

    // Get employee salary config
    const [salaryConfig] = await db.select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId));

    if (!salaryConfig) {
      return res.status(400).json({ error: "Salary not configured for this employee" });
    }

    // Get holidays for this month
    const holidays = await db.select()
      .from(paidHolidays)
      .where(and(
        eq(paidHolidays.year, year),
        eq(paidHolidays.month, month)
      ));
    
    const holidayDates = new Set(holidays.map((holiday) => String(holiday.date).slice(0, 10)));

    // Get attendance for the month. The calculation below excludes any days
    // before the employee's joining date in their first salary month.
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

    const attendance = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ));

    let salaryPeriod;
    try {
      salaryPeriod = calculateSalaryPeriod({
        year: Number(year),
        month: Number(month),
        joiningDate: salaryConfig.joiningDate,
        attendance,
        holidayDates,
      });
    } catch (error) {
      if (error instanceof SalaryPeriodNotStartedError) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }

    const {
      presentDays,
      leaveDays,
      totalOvertimeHours,
      weekendDays,
      holidayCount,
      paidDays,
      absentDays: absentDaysCalc,
      periodStartDate,
    } = salaryPeriod;

    // Check if slip already exists
    const [existing] = await db.select()
      .from(salarySlips)
      .where(and(
        eq(salarySlips.userId, userId),
        eq(salarySlips.month, month),
        eq(salarySlips.year, year)
      ));

    // Per-day divisor: joining months always use actual calendar days. Later
    // months respect the employee's configured actual/fixed deduction mode.
    const divisorMode = (salaryConfig as any).perDayDivisorMode || 'fixed';
    const fixedDivisor = salaryConfig.perDayDivisor || 30;

    // Full salary components — always show 100%, never prorate
    const fullBasic = parseFloat(salaryConfig.basicSalary || '0');
    const fullHRA = parseFloat(salaryConfig.houseRentAllowance || '0');
    const fullConveyance = parseFloat(salaryConfig.conveyanceAllowance || '0');
    const fullMedical = parseFloat(salaryConfig.medicalAllowance || '0');
    const fullSpecial = parseFloat(salaryConfig.specialAllowance || '0');
    const fullGross = fullBasic + fullHRA + fullConveyance + fullMedical + fullSpecial;
    const fullDeductions = parseFloat(salaryConfig.deductions || '0');
    const salaryMonthKey = `${year}-${String(month).padStart(2, '0')}`;
    const isJoiningMonth = salaryConfig.joiningDate?.slice(0, 7) === salaryMonthKey;
    const {
      effectiveDivisor,
      perDaySalaryRate,
      absentDeduction,
      appliedDeductions,
      netPayable,
    } = calculateSalaryAmounts({
      fullGross,
      configuredDeductions: fullDeductions,
      divisorMode,
      fixedDivisor,
      totalDaysInMonth,
      paidDays,
      isJoiningMonth,
    });

    console.log(`Salary Slip Generation for ${userId}:`);
    console.log(`  Salary Period Start: ${periodStartDate}, Total Days in Month: ${totalDaysInMonth}, Divisor Mode: ${divisorMode}, Effective Divisor: ${effectiveDivisor}`);
    console.log(`  Present Days: ${presentDays}, Leave Days: ${leaveDays}, Weekends: ${weekendDays}, Holidays: ${holidayCount}`);
    console.log(`  Paid Days: ${paidDays}, Absent Days: ${absentDaysCalc}`);
    console.log(`  Gross: ${fullGross}, Per Day: ${perDaySalaryRate.toFixed(2)}, Absent Deduction: ${absentDeduction.toFixed(2)}, Net: ${netPayable.toFixed(2)}`);

    const slipData = {
      userId,
      month,
      year,
      basicSalary: fullBasic.toFixed(2),
      houseRentAllowance: fullHRA.toFixed(2),
      conveyanceAllowance: fullConveyance.toFixed(2),
      medicalAllowance: fullMedical.toFixed(2),
      specialAllowance: fullSpecial.toFixed(2),
      grossSalary: fullGross.toFixed(2),
      totalDeductions: appliedDeductions.toFixed(2),
      netSalary: netPayable.toFixed(2),
      workingDays: totalDaysInMonth,
      presentDays: paidDays,
      absentDays: absentDaysCalc,
      leaveDays,
      overtimeHours: totalOvertimeHours.toString(),
      status: "generated",
      generatedAt: new Date()
    };

    if (existing) {
      await db.update(salarySlips)
        .set({ ...slipData, updatedAt: new Date() })
        .where(eq(salarySlips.id, existing.id));
    } else {
      await db.insert(salarySlips).values(slipData);
    }

    const [slip] = await db.select()
      .from(salarySlips)
      .where(and(
        eq(salarySlips.userId, userId),
        eq(salarySlips.month, month),
        eq(salarySlips.year, year)
      ));

    res.json({ success: true, slip });
  } catch (error) {
    console.error("Error generating salary slip:", error);
    res.status(500).json({ error: "Failed to generate salary slip" });
  }
});

// Get salary slips
router.get("/api/hr/admin/salary-slips", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { month, year } = req.query;

    let conditions = [];
    if (month) conditions.push(eq(salarySlips.month, parseInt(month as string)));
    if (year) conditions.push(eq(salarySlips.year, parseInt(year as string)));

    const slips = await db.select({
      id: salarySlips.id,
      userId: salarySlips.userId,
      month: salarySlips.month,
      year: salarySlips.year,
      basicSalary: salarySlips.basicSalary,
      houseRentAllowance: salarySlips.houseRentAllowance,
      conveyanceAllowance: salarySlips.conveyanceAllowance,
      medicalAllowance: salarySlips.medicalAllowance,
      specialAllowance: salarySlips.specialAllowance,
      grossSalary: salarySlips.grossSalary,
      totalDeductions: salarySlips.totalDeductions,
      netSalary: salarySlips.netSalary,
      workingDays: salarySlips.workingDays,
      presentDays: salarySlips.presentDays,
      absentDays: salarySlips.absentDays,
      leaveDays: salarySlips.leaveDays,
      overtimeHours: salarySlips.overtimeHours,
      status: salarySlips.status,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      userEmail: users.email,
      userDepartment: users.department
    })
    .from(salarySlips)
    .leftJoin(users, eq(salarySlips.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(salarySlips.year), desc(salarySlips.month), asc(users.firstName));

    res.json(slips);
  } catch (error) {
    console.error("Error fetching salary slips:", error);
    res.status(500).json({ error: "Failed to fetch salary slips" });
  }
});

// Download salary slip as PDF
router.get("/api/hr/admin/salary-slip/download/:userId/:month/:year", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId, month, year } = req.params;
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Get salary slip
    const [slip] = await db.select()
      .from(salarySlips)
      .where(and(
        eq(salarySlips.userId, userId),
        eq(salarySlips.month, monthNum),
        eq(salarySlips.year, yearNum)
      ));

    if (!slip) {
      return res.status(404).json({ error: "Salary slip not found" });
    }

    // Get employee details
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get salary config (for bank details)
    const [salaryConfig] = await db.select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId));

    // Get monthly incentives
    const [incentive] = await db.select()
      .from(monthlyIncentives)
      .where(and(
        eq(monthlyIncentives.userId, userId),
        eq(monthlyIncentives.month, monthNum),
        eq(monthlyIncentives.year, yearNum)
      ));

    const monthNames = ["", "January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[monthNum];

    // Generate PDF using PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary_slip_${employee.firstName}_${employee.lastName}_${monthName}_${yearNum}.pdf`);
    
    doc.pipe(res);

    // Header with company logo - position it properly without overlap
    const logoPath = path.resolve(process.cwd(), 'bfi-logo.png');
    
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 220, 30, { width: 150 });
      doc.y = 120; // Move cursor well below the logo
    } else {
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#166534')
         .text('BRIGHT FAME ORGANIC', { align: 'center' });
      doc.moveDown(1);
    }
    
    // Salary Slip title - with proper spacing after logo
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#166534')
       .text(`SALARY SLIP - ${monthName} ${yearNum}`, { align: 'center' });
    doc.moveDown(1.5);

    // Employee Details Box
    doc.rect(50, doc.y, 495, 80).stroke();
    const boxY = doc.y + 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333');
    
    // Use salarySlipName if configured, otherwise use employee name
    const displayName = salaryConfig?.salarySlipName || `${employee.firstName} ${employee.lastName}`;
    doc.text('Employee Name:', 60, boxY);
    doc.font('Helvetica').text(displayName, 160, boxY);
    
    doc.font('Helvetica-Bold').text('Employee ID:', 300, boxY);
    doc.font('Helvetica').text(userId.substring(0, 20), 390, boxY);
    
    doc.font('Helvetica-Bold').text('Department:', 60, boxY + 20);
    doc.font('Helvetica').text(employee.department || 'N/A', 160, boxY + 20);
    
    doc.font('Helvetica-Bold').text('Email:', 300, boxY + 20);
    doc.font('Helvetica').text(employee.email || 'N/A', 390, boxY + 20);
    
    doc.font('Helvetica-Bold').text('Pay Period:', 60, boxY + 40);
    doc.font('Helvetica').text(`${monthName} ${yearNum}`, 160, boxY + 40);
    
    doc.font('Helvetica-Bold').text('Working Days:', 300, boxY + 40);
    doc.font('Helvetica').text(`${slip.presentDays || 0} / ${slip.workingDays || 0}`, 390, boxY + 40);
    
    doc.moveDown(4);
    
    // Render the generated salary snapshot, not the employee's mutable current
    // configuration. Historical PDF amounts must not change after later edits.
    const fullBasic = parseFloat(slip.basicSalary || '0');
    const fullHRA = parseFloat(slip.houseRentAllowance || '0');
    const fullConveyance = parseFloat(slip.conveyanceAllowance || '0');
    const fullMedical = parseFloat(slip.medicalAllowance || '0');
    const fullSpecial = parseFloat(slip.specialAllowance || '0');
    const fullGross = parseFloat(slip.grossSalary || '0');
    const configDeductions = parseFloat(slip.totalDeductions || '0');
    const totalDays = slip.workingDays || 30;
    const paidDays = slip.presentDays || 0;
    const absentDays = Math.max(0, totalDays - paidDays);
    const {
      perDaySalaryRate: perDaySalary,
      absentDeduction,
      netPayable,
    } = getStoredSalarySlipBreakdown({
      grossSalary: fullGross,
      appliedDeductions: configDeductions,
      netSalary: parseFloat(slip.netSalary || '0'),
      absentDays,
      totalDays,
    });
    
    // Particulars Section Header
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('Particulars', 50, doc.y);
    doc.moveDown(0.5);
    
    const tableTop = doc.y;
    const col1 = 55;
    const col2 = 180;
    const col3 = 310;
    const col4 = 470;
    
    // Table Header - Earnings and Deductions side by side
    doc.rect(50, tableTop, 247, 20).fill('#166534');
    doc.rect(297, tableTop, 248, 20).fill('#dc2626');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
    doc.text('Earnings', col1, tableTop + 5);
    doc.text('Amount', col2, tableTop + 5);
    doc.text('Deductions', col3, tableTop + 5);
    doc.text('Amount', col4, tableTop + 5);
    
    let rowY = tableTop + 22;
    const rowHeight = 18;
    
    // Define earnings and deductions
    const earningsData = [
      ['Basic', fullBasic],
      ['HRA', fullHRA],
      ['Conveyance Allowance', fullConveyance],
      ['Medical Allowance', fullMedical],
      ['Special Allowance', fullSpecial],
    ];
    
    const deductionsData = [
      ['Provident Fund (PF)', configDeductions * 0.5],
      ['Professional Tax', configDeductions * 0.3],
      ['Other Deductions', configDeductions * 0.2],
      ['', 0],
      ['', 0],
    ];
    
    // Draw rows
    earningsData.forEach(([label, amount], i) => {
      doc.rect(50, rowY, 247, rowHeight).stroke('#e5e7eb');
      doc.rect(297, rowY, 248, rowHeight).stroke('#e5e7eb');
      
      doc.fillColor('#000').fontSize(8).font('Helvetica');
      doc.text(label as string, col1, rowY + 4);
      doc.text(`₹ ${(amount as number).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col2, rowY + 4);
      
      const dedLabel = deductionsData[i][0] as string;
      const dedAmount = deductionsData[i][1] as number;
      if (dedLabel) {
        doc.text(dedLabel, col3, rowY + 4);
        doc.text(`₹ ${dedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col4, rowY + 4);
      }
      rowY += rowHeight;
    });
    
    // Gross Pay row
    doc.rect(50, rowY, 247, 20).fill('#dcfce7');
    doc.rect(297, rowY, 248, 20).fill('#fee2e2');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.fillColor('#166534').text('Gross Pay', col1, rowY + 5);
    doc.text(`₹ ${fullGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col2, rowY + 5);
    doc.fillColor('#dc2626').text('Gross Deduction', col3, rowY + 5);
    doc.text(`₹ ${configDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col4, rowY + 5);
    rowY += 25;
    
    // Attendance & Leave Deductions Section
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
    doc.text('Attendance Summary & Deductions', col1, rowY);
    rowY += 18;
    
    doc.rect(50, rowY, 495, 18).fill('#f3f4f6');
    doc.fontSize(8).font('Helvetica').fillColor('#000');
    doc.text(`Total Days: ${totalDays}`, col1, rowY + 4);
    doc.text(`Paid Days: ${paidDays}`, 150, rowY + 4);
    doc.text(`Absent Days: ${absentDays}`, 250, rowY + 4);
    doc.text(`Per Day: ₹ ${perDaySalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 350, rowY + 4);
    rowY += 20;
    
    doc.rect(50, rowY, 495, 18).stroke('#e5e7eb');
    doc.fontSize(8).font('Helvetica');
    doc.text(`Less: Absent Days Deduction (${absentDays} days × ₹${perDaySalary.toFixed(2)})`, col1, rowY + 4);
    doc.fillColor('#dc2626').text(`- ₹ ${absentDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col4, rowY + 4);
    rowY += 22;
    
    // Net Calculation Summary
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
    doc.text('Net Payable Calculation', col1, rowY);
    rowY += 15;
    
    const incentiveTotal = parseFloat(incentive?.totalIncentive || '0');
    const finalNetPayable = netPayable + incentiveTotal;
    
    const summaryData = [
      ['Gross Pay', fullGross, false],
      ['Less: Statutory Deductions', -configDeductions, false],
      ['Less: Absent Days Deduction', -absentDeduction, false],
      ['Add: Incentives Earned', incentiveTotal, false],
    ];
    
    summaryData.forEach(([label, amount, isBold]) => {
      doc.rect(50, rowY, 495, 16).stroke('#e5e7eb');
      doc.fontSize(8).font('Helvetica').fillColor('#000');
      doc.text(label as string, col1, rowY + 4);
      const amtNum = amount as number;
      const amtStr = amtNum < 0 
        ? `- ₹ ${Math.abs(amtNum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : `₹ ${amtNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      doc.fillColor(amtNum < 0 ? '#dc2626' : '#000').text(amtStr, col4, rowY + 4);
      rowY += 16;
    });
    
    // Net Payable Amount (Green bar)
    doc.rect(50, rowY, 495, 24).fill('#166534');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#fff');
    doc.text('Net Payable Amount', col1, rowY + 6);
    doc.text(`₹ ${finalNetPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, col4, rowY + 6);
    rowY += 28;
    
    // Amount in words
    const amountInWords = convertNumberToWords(Math.round(finalNetPayable));
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666');
    doc.text(`In words: ${amountInWords} Only`, col1, rowY);
    rowY += 18;
    
    // Bank Details section - compact layout
    if (salaryConfig) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
      doc.text('BANK DETAILS', col1, rowY);
      rowY += 18;
      
      doc.rect(50, rowY - 5, 495, 55).stroke();
      doc.fontSize(9).font('Helvetica');
      
      doc.font('Helvetica-Bold').text('Account Holder:', col1, rowY + 3);
      doc.font('Helvetica').text(displayName, 160, rowY + 3);
      
      doc.font('Helvetica-Bold').text('Bank Name:', col1, rowY + 18);
      doc.font('Helvetica').text(salaryConfig.bankName || 'N/A', 160, rowY + 18);
      
      doc.font('Helvetica-Bold').text('Account Number:', col1, rowY + 33);
      doc.font('Helvetica').text(salaryConfig.bankAccountNumber || 'N/A', 160, rowY + 33);
      
      doc.font('Helvetica-Bold').text('IFSC Code:', 300, rowY + 18);
      doc.font('Helvetica').text(salaryConfig.ifscCode || 'N/A', 380, rowY + 18);
      
      doc.font('Helvetica-Bold').text('PAN Number:', 300, rowY + 33);
      doc.font('Helvetica').text(salaryConfig.panNumber || 'N/A', 380, rowY + 33);
      
      rowY += 65;
    }
    
    // Footer - position at bottom of first page, ensure no overlap
    const footerY = Math.min(rowY + 15, 755);
    doc.fontSize(8).fillColor('#666');
    doc.text('This is a computer-generated document and does not require a signature.', 50, footerY, { align: 'center', width: 495 });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 12, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    console.error("Error generating salary slip PDF:", error);
    res.status(500).json({ error: "Failed to generate salary slip PDF" });
  }
});

// Get attendance photo
router.get("/api/hr/attendance/photo/:photoPath(*)", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    const userId = getUserId(req);
    const { photoPath } = req.params;
    
    // Only allow admin or the owner of the photo to view it
    const isAdmin = userRole && ["super_admin", "admin"].includes(userRole);
    const isOwner = photoPath.includes(`/${userId}/`);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { bucketName, objectName } = parseObjectPath(photoPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "Photo not found" });
    }
    
    res.setHeader('Content-Type', 'image/jpeg');
    file.createReadStream().pipe(res);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(404).json({ error: "Photo not found" });
  }
});

// ============ PAID HOLIDAYS MANAGEMENT ============

// Get all paid holidays (with optional year/month filter)
router.get("/api/hr/holidays", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    
    let conditions: any[] = [];
    
    if (year) {
      conditions.push(eq(paidHolidays.year, parseInt(year as string)));
    }
    if (month) {
      conditions.push(eq(paidHolidays.month, parseInt(month as string)));
    }
    
    const holidays = await db.select()
      .from(paidHolidays)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(paidHolidays.date));
    
    res.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
});

// Create a new paid holiday (admin only)
router.post("/api/hr/holidays", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    const userId = getUserId(req);
    
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const { date, name, description, isRecurring } = req.body;
    
    if (!date || !name) {
      return res.status(400).json({ error: "Date and name are required" });
    }
    
    const holidayDate = new Date(date);
    const year = holidayDate.getFullYear();
    const month = holidayDate.getMonth() + 1;
    
    const [newHoliday] = await db.insert(paidHolidays)
      .values({
        date: holidayDate,
        name,
        description: description || null,
        year,
        month,
        isRecurring: isRecurring || false,
        createdBy: userId,
      })
      .returning();
    
    res.status(201).json(newHoliday);
  } catch (error) {
    console.error("Error creating holiday:", error);
    res.status(500).json({ error: "Failed to create holiday" });
  }
});

// Update a paid holiday (admin only)
router.patch("/api/hr/holidays/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const { id } = req.params;
    const { date, name, description, isRecurring } = req.body;
    
    const updateData: any = {};
    if (date) {
      const holidayDate = new Date(date);
      updateData.date = holidayDate;
      updateData.year = holidayDate.getFullYear();
      updateData.month = holidayDate.getMonth() + 1;
    }
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    
    const [updated] = await db.update(paidHolidays)
      .set(updateData)
      .where(eq(paidHolidays.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({ error: "Failed to update holiday" });
  }
});

// Delete a paid holiday (admin only)
router.delete("/api/hr/holidays/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const { id } = req.params;
    
    const [deleted] = await db.delete(paidHolidays)
      .where(eq(paidHolidays.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    
    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ error: "Failed to delete holiday" });
  }
});

// Check if a specific date is a holiday or weekend
router.get("/api/hr/is-day-off", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }
    
    const checkDate = new Date(date as string);
    const dayOfWeek = checkDate.getDay();
    
    // Check if weekend (Saturday = 6, Sunday = 0)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Check if holiday
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [holiday] = await db.select()
      .from(paidHolidays)
      .where(and(
        gte(paidHolidays.date, startOfDay),
        lte(paidHolidays.date, endOfDay)
      ));
    
    res.json({
      date: date,
      isWeekend,
      isHoliday: !!holiday,
      holidayName: holiday?.name || null,
      isDayOff: isWeekend || !!holiday,
    });
  } catch (error) {
    console.error("Error checking day off:", error);
    res.status(500).json({ error: "Failed to check day off" });
  }
});

// Get working days count for a month (excluding weekends and holidays)
router.get("/api/hr/working-days", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: "Year and month are required" });
    }
    
    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);
    
    // Get all days in the month
    const firstDay = new Date(yearNum, monthNum - 1, 1);
    const lastDay = new Date(yearNum, monthNum, 0);
    
    // Get holidays for this month
    const holidays = await db.select()
      .from(paidHolidays)
      .where(and(
        eq(paidHolidays.year, yearNum),
        eq(paidHolidays.month, monthNum)
      ));
    
    const holidayDates = new Set(holidays.map(h => 
      new Date(h.date).toISOString().split('T')[0]
    ));
    
    let workingDays = 0;
    let weekends = 0;
    let holidaysCount = 0;
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends++;
      } else if (holidayDates.has(dateStr)) {
        holidaysCount++;
      } else {
        workingDays++;
      }
    }
    
    res.json({
      year: yearNum,
      month: monthNum,
      totalDays: lastDay.getDate(),
      workingDays,
      weekends,
      holidays: holidaysCount,
      holidayDetails: holidays.map(h => ({
        date: h.date,
        name: h.name,
      })),
    });
  } catch (error) {
    console.error("Error calculating working days:", error);
    res.status(500).json({ error: "Failed to calculate working days" });
  }
});

// ========== LEAVE MANAGEMENT ROUTES ==========

// Get all leave applications (Admin only)
router.get("/api/hr/leaves", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { status } = req.query;
    
    let query = db.select({
      id: leaveApplications.id,
      userId: leaveApplications.userId,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      reason: leaveApplications.reason,
      status: leaveApplications.status,
      approvedBy: leaveApplications.approvedBy,
      approvalDate: leaveApplications.approvalDate,
      rejectionReason: leaveApplications.rejectionReason,
      createdAt: leaveApplications.createdAt,
      userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
      userEmail: users.email,
    })
    .from(leaveApplications)
    .leftJoin(users, eq(leaveApplications.userId, users.id))
    .orderBy(desc(leaveApplications.createdAt));

    const results = await query;
    
    const filtered = status && status !== 'all' 
      ? results.filter(r => r.status === status)
      : results;
    
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching leave applications:", error);
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
});

// Get my leave applications (Employee)
router.get("/api/hr/leaves/my", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const leaves = await db.select()
      .from(leaveApplications)
      .where(eq(leaveApplications.userId, userId))
      .orderBy(desc(leaveApplications.createdAt));
    
    res.json(leaves);
  } catch (error) {
    console.error("Error fetching my leave applications:", error);
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
});

// Apply for leave (Employee)
router.post("/api/hr/leaves/apply", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { leaveType, halfDayPeriod, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: "Leave type, start date and end date are required" });
    }

    // Validate half day period when half_day is selected
    if (leaveType === "half_day" && !halfDayPeriod) {
      return res.status(400).json({ error: "Half day period (first_half/second_half) is required for half day leave" });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ error: "Start date must be before or equal to end date" });
    }

    const [leave] = await db.insert(leaveApplications)
      .values({
        userId,
        leaveType,
        halfDayPeriod: leaveType === "half_day" ? halfDayPeriod : null,
        startDate,
        endDate,
        reason: reason || null,
        status: "pending",
      })
      .returning();

    res.json(leave);
  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ error: "Failed to apply for leave" });
  }
});

// Approve/Reject leave (Admin only)
router.patch("/api/hr/leaves/:id/status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Valid status (approved/rejected) is required" });
    }

    const [updated] = await db.update(leaveApplications)
      .set({
        status,
        approvedBy: getUserId(req),
        approvalDate: new Date(),
        rejectionReason: status === "rejected" ? rejectionReason : null,
        updatedAt: new Date(),
      })
      .where(eq(leaveApplications.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Leave application not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: "Failed to update leave status" });
  }
});

// ========== ADMIN MANUAL PUNCHING ROUTES ==========

// Get all employees for manual punching (Admin)
router.get("/api/hr/employees", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const employees = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(and(
      sql`${users.role} NOT IN ('admin', 'super_admin', 'customer')`,
      sql`${users.role} IS NOT NULL`
    ));

    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Admin manual punch (Full day / Half day / Late mark)
router.post("/api/hr/attendance/manual", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId, date, attendanceType, notes } = req.body;

    if (!userId || !date || !attendanceType) {
      return res.status(400).json({ error: "User ID, date and attendance type are required" });
    }

    // Check if attendance already exists for this date
    const [existing] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.date, date)
      ));

    let punchInTime: Date;
    let punchOutTime: Date;
    let status: string;
    let workingHours: number;

    // Set times based on attendance type
    const baseDate = new Date(date);
    switch (attendanceType) {
      case "full_day":
        punchInTime = new Date(baseDate.setHours(9, 0, 0, 0));
        punchOutTime = new Date(baseDate.setHours(18, 0, 0, 0));
        status = "present";
        workingHours = 9;
        break;
      case "half_day":
        punchInTime = new Date(baseDate.setHours(9, 0, 0, 0));
        punchOutTime = new Date(baseDate.setHours(13, 0, 0, 0));
        status = "half_day";
        workingHours = 4;
        break;
      case "late_mark":
        punchInTime = new Date(baseDate.setHours(10, 30, 0, 0));
        punchOutTime = new Date(baseDate.setHours(18, 0, 0, 0));
        status = "late";
        workingHours = 7.5;
        break;
      case "day_off":
        punchInTime = null as any;
        punchOutTime = null as any;
        status = "absent";
        workingHours = 0;
        break;
      default:
        return res.status(400).json({ error: "Invalid attendance type" });
    }

    let record;
    if (existing) {
      // Update existing record
      [record] = await db.update(attendanceRecords)
        .set({
          punchInTime,
          punchOutTime,
          workingHours: workingHours.toString(),
          status,
          remarks: notes || `Manual entry by admin: ${attendanceType}`,
          updatedAt: new Date(),
        })
        .where(eq(attendanceRecords.id, existing.id))
        .returning();
    } else {
      // Create new record
      [record] = await db.insert(attendanceRecords)
        .values({
          userId,
          date,
          punchInTime,
          punchOutTime,
          workingHours: workingHours.toString(),
          status,
          remarks: notes || `Manual entry by admin: ${attendanceType}`,
        })
        .returning();
    }

    res.json(record);
  } catch (error) {
    console.error("Error creating manual attendance:", error);
    res.status(500).json({ error: "Failed to create manual attendance" });
  }
});

// Get attendance history for an employee (Admin or self)
router.get("/api/hr/attendance/history/:userId?", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const userRole = (req.user as any)?.claims?.role || (req.user as any)?.role;
    const { userId } = req.params;
    const { month, year } = req.query;
    
    const targetUserId = userId || currentUserId;
    
    // Only admin can view other users' attendance
    if (targetUserId !== currentUserId && userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).json({ error: "You can only view your own attendance history" });
    }

    let conditions = [eq(attendanceRecords.userId, targetUserId as string)];
    
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      conditions.push(gte(attendanceRecords.date, startDate));
      conditions.push(lte(attendanceRecords.date, endDate));
    }

    const history = await db.select()
      .from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.date));

    res.json(history);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// Get my attendance summary (Employee)
router.get("/api/hr/attendance/summary", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

    const records = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ));

    const summary = {
      totalDays: lastDay,
      present: records.filter(r => r.status === "present").length,
      halfDay: records.filter(r => r.status === "half_day").length,
      late: records.filter(r => r.status === "late").length,
      absent: records.filter(r => r.status === "absent").length,
      leave: records.filter(r => r.status === "leave").length,
      totalWorkingHours: records.reduce((sum, r) => sum + parseFloat(r.workingHours || "0"), 0),
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY MONITORING & PERFORMANCE TRACKING
// ═══════════════════════════════════════════════════════════════════

function calculatePerformanceTier(totalIdleMinutes: number, heartbeatCount: number): string {
  if (heartbeatCount === 0) return "disconnected";
  if (totalIdleMinutes < 30) return "champion";
  if (totalIdleMinutes < 60) return "steady";
  if (totalIdleMinutes < 120) return "drifting";
  return "disconnected";
}

function getUserLiveStatus(lastActivityTime: Date | null): { status: string; minutesAgo: number } {
  if (!lastActivityTime) return { status: "offline", minutesAgo: -1 };
  const now = new Date();
  const diffMs = now.getTime() - lastActivityTime.getTime();
  const minutesAgo = Math.floor(diffMs / 60000);
  if (minutesAgo < 15) return { status: "online", minutesAgo };
  if (minutesAgo < 30) return { status: "away", minutesAgo };
  return { status: "offline", minutesAgo };
}

router.post("/api/activity/heartbeat", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { page, action } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    await db.insert(activityHeartbeats).values({
      userId,
      page: page || "/",
      action: action || "heartbeat",
    });

    const WORK_START_IST = 13;
    const WORK_END_IST = 21;
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const workStartUTC = new Date(new Date(todayStr + "T00:00:00Z").getTime() + (WORK_START_IST * 60 * 60 * 1000) - IST_OFFSET_MS);
    const workEndUTC = new Date(new Date(todayStr + "T00:00:00Z").getTime() + (WORK_END_IST * 60 * 60 * 1000) - IST_OFFSET_MS);

    const todayHeartbeats = await db
      .select({ timestamp: activityHeartbeats.timestamp })
      .from(activityHeartbeats)
      .where(
        and(
          eq(activityHeartbeats.userId, userId),
          gte(activityHeartbeats.timestamp, workStartUTC),
          lte(activityHeartbeats.timestamp, workEndUTC)
        )
      )
      .orderBy(asc(activityHeartbeats.timestamp));

    let totalActiveMinutes = 0;
    let totalIdleMinutes = 0;
    const IDLE_THRESHOLD = 5;

    for (let i = 1; i < todayHeartbeats.length; i++) {
      const gap = (todayHeartbeats[i].timestamp.getTime() - todayHeartbeats[i - 1].timestamp.getTime()) / 60000;
      if (gap <= IDLE_THRESHOLD) {
        totalActiveMinutes += gap;
      } else {
        totalIdleMinutes += gap;
      }
    }

    const tier = calculatePerformanceTier(totalIdleMinutes, todayHeartbeats.length);

    const existing = await db
      .select()
      .from(dailyPerformanceSummary)
      .where(and(eq(dailyPerformanceSummary.userId, userId), eq(dailyPerformanceSummary.date, todayStr)));

    if (existing.length > 0) {
      await db
        .update(dailyPerformanceSummary)
        .set({
          totalActiveMinutes: Math.round(totalActiveMinutes),
          totalIdleMinutes: Math.round(totalIdleMinutes),
          lastActivity: now,
          heartbeatCount: todayHeartbeats.length,
          tier,
          updatedAt: now,
        })
        .where(and(eq(dailyPerformanceSummary.userId, userId), eq(dailyPerformanceSummary.date, todayStr)));
    } else {
      await db.insert(dailyPerformanceSummary).values({
        userId,
        date: todayStr,
        totalActiveMinutes: Math.round(totalActiveMinutes),
        totalIdleMinutes: Math.round(totalIdleMinutes),
        firstActivity: todayHeartbeats[0]?.timestamp || now,
        lastActivity: now,
        heartbeatCount: todayHeartbeats.length,
        tier,
      });
    }

    res.json({ success: true, tier, totalActiveMinutes: Math.round(totalActiveMinutes) });
  } catch (error) {
    console.error("Error recording heartbeat:", error);
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
});

router.get("/api/hr/admin/activity-status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const reqUserId = getUserId(req);
    if (!reqUserId) return res.status(401).json({ error: "Not authenticated" });
    const requestingUser = await db.select().from(users).where(eq(users.id, reqUserId));
    if (!requestingUser.length || !["super_admin", "admin"].includes(requestingUser[0].role || "")) {
      console.log("[Activity] Access denied for user:", reqUserId, "role:", requestingUser[0]?.role);
      return res.status(403).json({ error: "Unauthorized" });
    }

    const dateParam = req.query.date as string;
    const todayStr = dateParam || new Date().toISOString().split("T")[0];

    const staffUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        department: users.department,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(
        and(
          eq(users.userType, "staff"),
          eq(users.isActive, true)
        )
      );

    console.log("[Activity] Found", staffUsers.length, "staff users for activity status");

    const performances = await db
      .select()
      .from(dailyPerformanceSummary)
      .where(eq(dailyPerformanceSummary.date, todayStr));

    const perfMap = new Map(performances.map(p => [p.userId, p]));

    const result = staffUsers.map(user => {
      const perf = perfMap.get(user.id);
      const liveStatus = getUserLiveStatus(perf?.lastActivity || null);
      return {
        ...user,
        liveStatus: liveStatus.status,
        minutesAgo: liveStatus.minutesAgo,
        totalActiveMinutes: perf?.totalActiveMinutes || 0,
        totalIdleMinutes: perf?.totalIdleMinutes || 0,
        heartbeatCount: perf?.heartbeatCount || 0,
        firstActivity: perf?.firstActivity,
        lastActivity: perf?.lastActivity,
        tier: perf?.tier || "disconnected",
      };
    });

    result.sort((a, b) => {
      const statusOrder: Record<string, number> = { online: 0, away: 1, offline: 2 };
      return (statusOrder[a.liveStatus] || 2) - (statusOrder[b.liveStatus] || 2);
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching admin activity status:", error);
    res.status(500).json({ error: "Failed to fetch activity status" });
  }
});

router.get("/api/hr/my-activity-status", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const todayStr = new Date().toISOString().split("T")[0];

    const perf = await db
      .select()
      .from(dailyPerformanceSummary)
      .where(and(eq(dailyPerformanceSummary.userId, userId), eq(dailyPerformanceSummary.date, todayStr)));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const weekPerf = await db
      .select()
      .from(dailyPerformanceSummary)
      .where(
        and(
          eq(dailyPerformanceSummary.userId, userId),
          gte(dailyPerformanceSummary.date, last7Days[0]),
          lte(dailyPerformanceSummary.date, last7Days[6])
        )
      )
      .orderBy(asc(dailyPerformanceSummary.date));

    const todayData = perf[0] || null;
    const liveStatus = getUserLiveStatus(todayData?.lastActivity || null);

    const WORK_START_IST = 13;
    const WORK_END_IST = 21;
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const workStartUTC = new Date(new Date(todayStr + "T00:00:00Z").getTime() + (WORK_START_IST * 60 * 60 * 1000) - IST_OFFSET_MS);
    const workEndUTC = new Date(new Date(todayStr + "T00:00:00Z").getTime() + (WORK_END_IST * 60 * 60 * 1000) - IST_OFFSET_MS);

    const todayHeartbeats = await db
      .select({ timestamp: activityHeartbeats.timestamp })
      .from(activityHeartbeats)
      .where(
        and(
          eq(activityHeartbeats.userId, userId),
          gte(activityHeartbeats.timestamp, workStartUTC),
          lte(activityHeartbeats.timestamp, workEndUTC)
        )
      )
      .orderBy(asc(activityHeartbeats.timestamp));

    const timelineSlots: { hour: number; active: boolean }[] = [];
    const activeHoursIST = new Set<number>();
    todayHeartbeats.forEach(h => {
      const istHour = new Date(h.timestamp.getTime() + IST_OFFSET_MS).getUTCHours();
      activeHoursIST.add(istHour);
    });
    for (let h = WORK_START_IST; h < WORK_END_IST; h++) {
      timelineSlots.push({ hour: h, active: activeHoursIST.has(h) });
    }

    res.json({
      liveStatus: liveStatus.status,
      minutesAgo: liveStatus.minutesAgo,
      totalActiveMinutes: todayData?.totalActiveMinutes || 0,
      totalIdleMinutes: todayData?.totalIdleMinutes || 0,
      tier: todayData?.tier || "disconnected",
      firstActivity: todayData?.firstActivity,
      lastActivity: todayData?.lastActivity,
      heartbeatCount: todayData?.heartbeatCount || 0,
      timeline: timelineSlots,
      weekHistory: weekPerf.map(d => ({
        date: d.date,
        activeMinutes: d.totalActiveMinutes,
        tier: d.tier,
      })),
    });
  } catch (error) {
    console.error("Error fetching my activity status:", error);
    res.status(500).json({ error: "Failed to fetch activity status" });
  }
});

router.get("/api/hr/admin/activity-history", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const reqUserId = getUserId(req);
    if (!reqUserId) return res.status(401).json({ error: "Not authenticated" });
    const requestingUser = await db.select().from(users).where(eq(users.id, reqUserId));
    if (!requestingUser.length || !["super_admin", "admin"].includes(requestingUser[0].role || "")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId, startDate, endDate } = req.query;

    const conditions = [];
    if (userId) conditions.push(eq(dailyPerformanceSummary.userId, userId as string));
    if (startDate) conditions.push(gte(dailyPerformanceSummary.date, startDate as string));
    if (endDate) conditions.push(lte(dailyPerformanceSummary.date, endDate as string));

    const history = await db
      .select({
        id: dailyPerformanceSummary.id,
        userId: dailyPerformanceSummary.userId,
        date: dailyPerformanceSummary.date,
        totalActiveMinutes: dailyPerformanceSummary.totalActiveMinutes,
        totalIdleMinutes: dailyPerformanceSummary.totalIdleMinutes,
        tier: dailyPerformanceSummary.tier,
        heartbeatCount: dailyPerformanceSummary.heartbeatCount,
        firstActivity: dailyPerformanceSummary.firstActivity,
        lastActivity: dailyPerformanceSummary.lastActivity,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        department: users.department,
      })
      .from(dailyPerformanceSummary)
      .innerJoin(users, eq(dailyPerformanceSummary.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(dailyPerformanceSummary.date))
      .limit(200);

    res.json(history);
  } catch (error) {
    console.error("Error fetching activity history:", error);
    res.status(500).json({ error: "Failed to fetch activity history" });
  }
});

export default router;
