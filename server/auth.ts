import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Express, Request, Response, NextFunction } from "express";
import { randomBytes, createHash } from "crypto";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  captchaToken: z.string().min(1, "Please complete the captcha verification"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  captchaToken: z.string().min(1, "Please complete the captcha verification"),
});

// Account lock settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate secure tokens
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Simple captcha verification (you can replace with reCAPTCHA or hCaptcha)
export function verifyCaptcha(token: string): boolean {
  // For demo purposes, accept any non-empty token
  // In production, implement proper captcha verification
  return token && token.length > 0;
}

// Check if account is locked
export function isAccountLocked(user: any): boolean {
  return !!(user.lockedUntil && user.lockedUntil > new Date());
}

// Increment login attempts
export async function handleFailedLogin(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  const attempts = (user.loginAttempts || 0) + 1;
  const updates: any = { loginAttempts: attempts };

  if (attempts >= MAX_LOGIN_ATTEMPTS && !isAccountLocked(user)) {
    updates.lockedUntil = new Date(Date.now() + LOCK_TIME);
  }

  await storage.updateUser(user.id, updates);
}

// Reset login attempts on successful login
export async function handleSuccessfulLogin(userId: string): Promise<void> {
  await storage.updateUser(userId, {
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Check for hardcoded admin credentials first
        if (email === 'admin@bfiorganic.com' && password === 'onkar231298') {
          let adminUser = await storage.getUser('admin_001');
          
          if (!adminUser) {
            // Create admin user if doesn't exist
            adminUser = await storage.createUser({
              id: 'admin_001',
              email: 'admin@bfiorganic.com',
              passwordHash: await hashPassword('onkar231298'),
              firstName: 'Admin',
              lastName: 'User',
              role: 'super_admin',
              userType: 'internal',
              isVerified: true,
              isActive: true,
            });
          }

          const userSession = {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            role: adminUser.role,
            userType: adminUser.userType,
            isAdmin: true
          };
          
          await handleSuccessfulLogin(adminUser.id);
          return done(null, userSession);
        }

        // Check database for user
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          await handleFailedLogin(email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check if account is locked
        if (isAccountLocked(user)) {
          return done(null, false, { message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' });
        }

        // Check if account is active
        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated. Please contact support.' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        
        if (!isPasswordValid) {
          await handleFailedLogin(email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Successful login
        await handleSuccessfulLogin(user.id);

        const userSession = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          userType: user.userType,
          isAdmin: user.role !== 'customer'
        };

        return done(null, userSession);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        const userSession = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          userType: user.userType,
          isAdmin: user.role !== 'customer'
        };
        done(null, userSession);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Verify captcha
      if (!verifyCaptcha(validatedData.captchaToken)) {
        return res.status(400).json({ error: "Invalid captcha verification" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await hashPassword(validatedData.password);
      const verificationToken = generateToken();

      const newUser = await storage.createUser({
        id: userId,
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        companyName: validatedData.companyName || null,
        phoneNumber: validatedData.phoneNumber || null,
        role: 'customer',
        userType: 'customer',
        isVerified: false, // Require email verification
        verificationToken,
        isActive: true,
      });

      // TODO: Send verification email (implement email service)
      console.log(`Verification token for ${validatedData.email}: ${verificationToken}`);

      res.status(201).json({ 
        message: "Account created successfully. Please check your email for verification.",
        requiresVerification: true 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Verify captcha
      if (!verifyCaptcha(validatedData.captchaToken)) {
        return res.status(400).json({ error: "Invalid captcha verification" });
      }

      // Authenticate user
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ error: "Authentication failed" });
        }
        
        if (!user) {
          return res.status(401).json({ error: info?.message || "Invalid credentials" });
        }

        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ error: "Login failed" });
          }
          
          res.json({ 
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              userType: user.userType,
            },
            message: "Login successful" 
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Email verification endpoint
  app.post("/api/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null,
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: "Email verification failed" });
    }
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user is admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

// Middleware to check specific roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && roles.includes((req.user as any)?.role)) {
      return next();
    }
    res.status(403).json({ message: "Insufficient permissions" });
  };
}