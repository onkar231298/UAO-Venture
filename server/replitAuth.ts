// Removed openid-client imports - Replit Auth disabled
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
// Removed memoize import - no longer needed
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Removed OIDC config - no longer needed

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Auto-create table if missing in production
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Check for production indicators - NODE_ENV or absence of dev domain
  const isProduction = process.env.NODE_ENV === 'production' || !process.env.REPLIT_DEV_DOMAIN;
  
  console.log('[Session] isProduction:', isProduction, 'NODE_ENV:', process.env.NODE_ENV);
  
  // Session secret with fallback for production environments
  const sessionSecret = process.env.SESSION_SECRET || 'bfi-organic-session-secret-2025';
  
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'bfi.sid', // Custom session name to avoid conflicts
    proxy: true, // Trust the reverse proxy (Replit's infrastructure)
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/',
    },
  });
}

// Removed Replit Auth helper functions

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for admin, staff, and customer login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Authenticate all staff, including super admins, against their hashed passwords.
        const staffUser = await storage.verifyStaffCredentials(email, password);
        if (staffUser) {
          const userSession = {
            claims: {
              sub: staffUser.id,
              email: staffUser.email,
              first_name: staffUser.firstName,
              last_name: staffUser.lastName,
              role: staffUser.role,
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            },
            isLocal: true,
            isAdmin: staffUser.role === 'super_admin' || staffUser.role === 'admin',
            isStaff: true
          };
          return done(null, userSession);
        }

        // Check for demo customer credentials
        const demoCustomers = [
          { email: 'customer@example.com', password: 'customer123', id: 'cust_001', firstName: 'John', lastName: 'Doe' },
          { email: 'buyer@company.com', password: 'buyer123', id: 'cust_002', firstName: 'Jane', lastName: 'Smith' }
        ];

        const customer = demoCustomers.find(c => c.email === email && c.password === password);
        if (customer) {
          // Create/get customer from database
          let customerUser = await storage.getUser(customer.id);
          if (!customerUser) {
            customerUser = await storage.upsertUser({
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              role: 'customer',
              companyName: "",
              phoneNumber: "",
              address: "",
              profileImageUrl: ""
            });
          }

          const userSession = {
            claims: {
              sub: customerUser.id,
              email: customerUser.email,
              first_name: customerUser.firstName,
              last_name: customerUser.lastName,
              role: customerUser.role,
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            },
            isLocal: true,
            isAdmin: false,
            isStaff: false
          };
          return done(null, userSession);
        }

        return done(null, false);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Replit Auth removed - only local admin login supported

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Helper to clear the session cookie with correct attributes
  const clearSessionCookie = (res: any) => {
    const isProduction = process.env.NODE_ENV === 'production' || !process.env.REPLIT_DEV_DOMAIN;
    // Must match the same options used when setting the cookie so browsers accept the deletion
    res.clearCookie('bfi.sid', {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    });
  };

  // Unified logout - completely destroy session and clear cookie
  app.get("/api/logout", (req, res) => {
    const sessionId = req.session?.id;
    // First logout from passport (removes req.user)
    req.logout((err) => {
      if (err) {
        console.error('[Logout] Error during logout:', err);
      }
      
      // Destroy the entire session from the store
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[Logout] Error destroying session:', destroyErr, 'Session ID:', sessionId);
        }
        
        // Clear the session cookie with matching attributes so browser removes it
        clearSessionCookie(res);
        
        console.log('[Logout] Session destroyed and cookie cleared, session ID:', sessionId);
        res.redirect("/login");
      });
    });
  });

  // Redirect /admin/login to unified /login page
  app.get("/admin/login", (req, res) => {
    res.redirect("/login");
  });

  // Helper to redirect by role after successful login
  const redirectByRole = (res: any, role: string) => {
    if (role === 'admin' || role === 'super_admin') {
      return res.redirect('/admin');
    } else if (role.includes('sales')) {
      return res.redirect('/sales');
    } else if (role.includes('quality')) {
      return res.redirect('/quality/dashboard');
    } else if (role === 'customer') {
      return res.redirect('/customer/dashboard');
    } else {
      return res.redirect('/staff');
    }
  };

  // Unified login endpoint - redirects based on user role
  app.post("/admin/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.redirect('/login?error=login_failed');
      }
      if (!user) {
        return res.redirect('/login?error=invalid_credentials');
      }

      // If a different user is currently logged in, log them out first.
      // req.logout() removes the user from the session but does NOT destroy the
      // session object, so req.session.regenerate() is still callable afterward.
      const doLogin = () => {
        // regenerate() creates a brand-new session ID and clears all session data,
        // preventing any previous user's data from leaking into the new session.
        req.session.regenerate((regenErr) => {
          if (regenErr) {
            console.error('[Login] Session regeneration failed:', regenErr);
            return res.redirect('/login?error=login_failed');
          }

          req.logIn(user, (loginErr) => {
            if (loginErr) {
              console.error('[Login] Login failed:', loginErr);
              return res.redirect('/login?error=login_failed');
            }

            req.session.save((saveErr) => {
              if (saveErr) {
                console.error('[Login] Session save failed:', saveErr);
              }
              console.log('[Login] User logged in successfully:', user.claims?.email, 'Role:', user.claims?.role);
              redirectByRole(res, user.claims?.role || '');
            });
          });
        });
      };

      // If someone else is already logged in on this browser, log them out first
      if (req.isAuthenticated()) {
        console.log('[Login] Existing session found — clearing before new login');
        req.logout((logoutErr) => {
          if (logoutErr) console.error('[Login] Error clearing existing session:', logoutErr);
          doLogin();
        });
      } else {
        doLogin();
      }
    })(req, res, next);
  });

  // Customer login endpoint
  app.post("/customer/login", passport.authenticate('local', {
    successRedirect: '/customer/dashboard',
    failureRedirect: '/login?error=customer_failed'
  }));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle local admin sessions
  if (user.isLocal) {
    // Check if admin session is still valid
    if (user.claims && user.claims.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= user.claims.exp) {
        return next();
      } else {
        return res.status(401).json({ message: "Session expired" });
      }
    }
    return next(); // Local admin session without expiration
  }

  // Reject any non-local sessions (Replit Auth removed)
  return res.status(401).json({ message: "Unauthorized" });
};
