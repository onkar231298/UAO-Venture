import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Middleware to serve static XML files with correct content-type
export function serveXMLFiles(req: Request, res: Response, next: NextFunction) {
  if (req.path.endsWith('.xml')) {
    const filePath = path.join(process.cwd(), 'public', req.path);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(filePath);
    }
  }
  next();
}

// Middleware to handle sitemap requests specifically
export function handleSitemapRequests(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/sitemap.xml' || req.path === '/api/sitemap.xml') {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(sitemapPath);
    }
  }
  next();
}