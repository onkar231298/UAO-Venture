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
    },
  });
}

// Removed Replit Auth helper functions

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for both admin and customer login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Check for admin credentials
        if (email === 'admin@bfiorganic.com' && password === 'onkar231298') {
          const adminUser = await storage.getUser('admin_001');
          if (adminUser) {
            const userSession = {
              claims: {
                sub: adminUser.id,
                email: adminUser.email,
                first_name: adminUser.firstName,
                last_name: adminUser.lastName,
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
              },
              isLocal: true,
              isAdmin: true
            };
            return done(null, userSession);
          }
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
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            },
            isLocal: true,
            isAdmin: false
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

  // Replit OAuth routes removed - admin uses /admin/login only

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Local admin logout - redirect to admin login
      res.redirect("/admin/login");
    });
  });

  // Admin login routes
  app.get("/admin/login", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>BFI Organic - Admin Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #16a085 0%, #f4d03f 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
          }
          .logo {
            text-align: center;
            margin-bottom: 2rem;
          }
          .logo h1 {
            color: #16a085;
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
          }
          .logo p {
            color: #666;
            font-size: 0.9rem;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e1e1;
            border-radius: 5px;
            font-size: 1rem;
            transition: border-color 0.3s;
          }
          input:focus {
            outline: none;
            border-color: #16a085;
          }
          button {
            width: 100%;
            background: #16a085;
            color: white;
            padding: 0.75rem;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
          }
          button:hover {
            background: #138d75;
          }
          .error {
            background: #fee;
            color: #c33;
            padding: 0.75rem;
            border-radius: 5px;
            margin-bottom: 1rem;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">
            <h1>BFI ORGANIC</h1>
            <p>Backend Administration</p>
          </div>
          ${req.query.error ? '<div class="error">Invalid credentials. Please try again.</div>' : ''}
          <form action="/admin/login" method="POST">
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" placeholder="Enter admin email" required>
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" placeholder="Enter admin password" required>
            </div>
            <button type="submit">Login to Admin Dashboard</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // Unified login endpoint for both admin and customers
  app.post("/admin/login", passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/login?error=admin_failed'
  }));

  // Customer login endpoint
  app.post("/customer/login", passport.authenticate('local', {
    successRedirect: '/',
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
