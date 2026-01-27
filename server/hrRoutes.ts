import { Router, Request, Response } from "express";
import { db } from "./db";
import { attendanceRecords, employeeSalaries, salarySlips, users, paidHolidays } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { objectStorageClient } from "./objectStorage";

const router = Router();

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
    const userId = req.user?.id;
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

// Punch In
router.post("/api/hr/attendance/punch-in", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { photoBase64, latitude, longitude, address } = req.body;

    if (!photoBase64) {
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

    // Upload photo to object storage
    const timestamp = Date.now();
    const privateDir = getPrivateObjectDir();
    const photoPath = `${privateDir}/attendance/${userId}/punch_in_${today}_${timestamp}.jpg`;
    const photoBuffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    const { bucketName, objectName } = parseObjectPath(photoPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    await file.save(photoBuffer, { contentType: 'image/jpeg' });

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { photoBase64, latitude, longitude, address } = req.body;

    if (!photoBase64) {
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

    // Upload photo to object storage
    const timestamp = Date.now();
    const privateDir = getPrivateObjectDir();
    const photoPath = `${privateDir}/attendance/${userId}/punch_out_${today}_${timestamp}.jpg`;
    const photoBuffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    const { bucketName, objectName } = parseObjectPath(photoPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    await file.save(photoBuffer, { contentType: 'image/jpeg' });

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    let query = db.select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.userId, userId))
      .orderBy(desc(attendanceRecords.date));

    const records = await query;
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// Admin: Get all employees attendance
router.get("/api/hr/admin/attendance", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
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
    const userRole = req.user?.role;
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
    const userRole = req.user?.role;
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
    const userRole = req.user?.role;
    if (!userRole || !["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId } = req.params;
    const { basicSalary, houseRentAllowance, conveyanceAllowance, medicalAllowance, specialAllowance, deductions, bankAccountNumber, bankName, ifscCode, panNumber } = req.body;

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
          basicSalary: basicSalary?.toString(),
          houseRentAllowance: houseRentAllowance?.toString(),
          conveyanceAllowance: conveyanceAllowance?.toString(),
          medicalAllowance: medicalAllowance?.toString(),
          specialAllowance: specialAllowance?.toString(),
          grossSalary: grossSalary.toString(),
          deductions: deductions?.toString(),
          netSalary: netSalary.toString(),
          bankAccountNumber,
          bankName,
          ifscCode,
          panNumber,
          updatedAt: new Date()
        })
        .where(eq(employeeSalaries.id, existing.id));
    } else {
      await db.insert(employeeSalaries).values({
        userId,
        basicSalary: basicSalary?.toString(),
        houseRentAllowance: houseRentAllowance?.toString(),
        conveyanceAllowance: conveyanceAllowance?.toString(),
        medicalAllowance: medicalAllowance?.toString(),
        specialAllowance: specialAllowance?.toString(),
        grossSalary: grossSalary.toString(),
        deductions: deductions?.toString(),
        netSalary: netSalary.toString(),
        bankAccountNumber,
        bankName,
        ifscCode,
        panNumber
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
    const userRole = req.user?.role;
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

// Generate salary slip for an employee for a specific month
router.post("/api/hr/admin/salary-slip/generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
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

    // Get attendance for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const attendance = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ));

    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const leaveDays = attendance.filter(a => a.status === 'leave').length;
    const totalOvertimeHours = attendance.reduce((sum, a) => sum + (parseFloat(a.overtimeHours || '0') || 0), 0);

    // Check if slip already exists
    const [existing] = await db.select()
      .from(salarySlips)
      .where(and(
        eq(salarySlips.userId, userId),
        eq(salarySlips.month, month),
        eq(salarySlips.year, year)
      ));

    const slipData = {
      userId,
      month,
      year,
      basicSalary: salaryConfig.basicSalary,
      houseRentAllowance: salaryConfig.houseRentAllowance,
      conveyanceAllowance: salaryConfig.conveyanceAllowance,
      medicalAllowance: salaryConfig.medicalAllowance,
      specialAllowance: salaryConfig.specialAllowance,
      grossSalary: salaryConfig.grossSalary,
      totalDeductions: salaryConfig.deductions,
      netSalary: salaryConfig.netSalary,
      workingDays: 30,
      presentDays,
      absentDays,
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
    const userRole = req.user?.role;
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

// Get attendance photo
router.get("/api/hr/attendance/photo/:photoPath(*)", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
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
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
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
    const userRole = req.user?.role;
    
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
    const userRole = req.user?.role;
    
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

export default router;
