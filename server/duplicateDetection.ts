import { db } from './db';
import { companies, users } from '@shared/schema';
import { eq, or, and, ilike, sql, ne, inArray } from 'drizzle-orm';

export interface DuplicateMatch {
  companyId: number;
  companyName: string;
  matchType: 'exact_name' | 'normalized_name' | 'email_domain' | 'phone' | 'fuzzy_name';
  confidence: number;
  matchDetails: string;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
}

export interface DuplicateCheckResult {
  hasPotentialDuplicates: boolean;
  matches: DuplicateMatch[];
  highestConfidence: number;
  recommendedAction: 'block' | 'review' | 'allow';
}

export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(pvt|private|ltd|limited|llc|inc|incorporated|corp|corporation|co|company|llp|plc|gmbh|ag|sa|srl|bv|nv)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractEmailDomain(email: string): string | null {
  if (!email) return null;
  
  const match = email.toLowerCase().trim().match(/@([a-zA-Z0-9.-]+)$/);
  if (!match) return null;
  
  const domain = match[1];
  
  const freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'live.com', 'msn.com', 'rediffmail.com', 'inbox.com'
  ];
  
  if (freeEmailDomains.includes(domain)) {
    return null;
  }
  
  return domain;
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeCompanyName(name1);
  const normalized2 = normalizeCompanyName(name2);
  
  if (normalized1 === normalized2) return 100;
  if (!normalized1 || !normalized2) return 0;
  
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const jaccardSimilarity = intersection.size / union.size;
  
  const levenshteinSimilarity = 1 - (levenshteinDistance(normalized1, normalized2) / Math.max(normalized1.length, normalized2.length));
  
  return Math.round((jaccardSimilarity * 0.4 + levenshteinSimilarity * 0.6) * 100);
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  return dp[m][n];
}

export async function checkForDuplicates(
  companyName: string,
  email?: string,
  phone?: string,
  excludeCompanyId?: number
): Promise<DuplicateCheckResult> {
  const matches: DuplicateMatch[] = [];
  
  const normalizedName = normalizeCompanyName(companyName);
  const emailDomain = email ? extractEmailDomain(email) : null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  
  try {
    const conditions = [];
    
    if (normalizedName) {
      conditions.push(eq(companies.normalizedName, normalizedName));
    }
    
    if (companyName) {
      conditions.push(ilike(companies.companyName, companyName.trim()));
    }
    
    if (emailDomain) {
      conditions.push(eq(companies.normalizedDomain, emailDomain));
    }
    
    if (conditions.length === 0) {
      return {
        hasPotentialDuplicates: false,
        matches: [],
        highestConfidence: 0,
        recommendedAction: 'allow'
      };
    }
    
    let query = db.select().from(companies).where(
      and(
        or(...conditions),
        ne(companies.duplicateStatus, 'merged')
      )
    );
    
    const potentialMatches = await query;
    
    // Collect all unique assigned user IDs for batch lookup
    const assignedUserIds = new Set<string>();
    for (const company of potentialMatches) {
      if (company.assignedTo) {
        assignedUserIds.add(company.assignedTo);
      }
    }
    
    // Fetch user names for all assigned users
    const userMap = new Map<string, string>();
    if (assignedUserIds.size > 0) {
      const usersList = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, Array.from(assignedUserIds)));
      for (const user of usersList) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User';
        userMap.set(user.id, fullName);
      }
    }
    
    for (const company of potentialMatches) {
      if (excludeCompanyId && company.id === excludeCompanyId) continue;
      
      const assignedUserName = company.assignedTo ? userMap.get(company.assignedTo) || null : null;
      
      if (company.companyName.toLowerCase().trim() === companyName.toLowerCase().trim()) {
        matches.push({
          companyId: company.id,
          companyName: company.companyName,
          matchType: 'exact_name',
          confidence: 100,
          matchDetails: 'Exact company name match',
          assignedToUserId: company.assignedTo,
          assignedToUserName: assignedUserName
        });
        continue;
      }
      
      if (company.normalizedName === normalizedName) {
        matches.push({
          companyId: company.id,
          companyName: company.companyName,
          matchType: 'normalized_name',
          confidence: 95,
          matchDetails: 'Company names match after normalization (removing legal suffixes like Pvt Ltd, Inc, etc.)',
          assignedToUserId: company.assignedTo,
          assignedToUserName: assignedUserName
        });
        continue;
      }
      
      if (emailDomain && company.normalizedDomain === emailDomain) {
        matches.push({
          companyId: company.id,
          companyName: company.companyName,
          matchType: 'email_domain',
          confidence: 85,
          matchDetails: `Same email domain: @${emailDomain}`,
          assignedToUserId: company.assignedTo,
          assignedToUserName: assignedUserName
        });
        continue;
      }
      
      const similarity = calculateNameSimilarity(companyName, company.companyName);
      if (similarity >= 70) {
        matches.push({
          companyId: company.id,
          companyName: company.companyName,
          matchType: 'fuzzy_name',
          confidence: similarity,
          matchDetails: `Company names are ${similarity}% similar`,
          assignedToUserId: company.assignedTo,
          assignedToUserName: assignedUserName
        });
      }
    }
    
    if (normalizedName && matches.length === 0) {
      const allCompanies = await db.select({
        id: companies.id,
        companyName: companies.companyName,
        duplicateStatus: companies.duplicateStatus,
        assignedTo: companies.assignedTo
      })
      .from(companies)
      .where(ne(companies.duplicateStatus, 'merged'))
      .limit(500);
      
      // Collect assigned user IDs for fallback matches
      const fallbackUserIds = new Set<string>();
      for (const company of allCompanies) {
        if (company.assignedTo) {
          fallbackUserIds.add(company.assignedTo);
        }
      }
      
      // Fetch user names for fallback matches
      const fallbackUserMap = new Map<string, string>();
      if (fallbackUserIds.size > 0) {
        const fallbackUsers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, Array.from(fallbackUserIds)));
        for (const user of fallbackUsers) {
          const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User';
          fallbackUserMap.set(user.id, fullName);
        }
      }
      
      for (const company of allCompanies) {
        if (excludeCompanyId && company.id === excludeCompanyId) continue;
        
        const similarity = calculateNameSimilarity(companyName, company.companyName);
        if (similarity >= 75) {
          const assignedUserName = company.assignedTo ? fallbackUserMap.get(company.assignedTo) || null : null;
          matches.push({
            companyId: company.id,
            companyName: company.companyName,
            matchType: 'fuzzy_name',
            confidence: similarity,
            matchDetails: `Company names are ${similarity}% similar`,
            assignedToUserId: company.assignedTo,
            assignedToUserName: assignedUserName
          });
        }
      }
    }
    
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const highestConfidence = matches.length > 0 ? matches[0].confidence : 0;
    
    let recommendedAction: 'block' | 'review' | 'allow' = 'allow';
    if (highestConfidence >= 95) {
      recommendedAction = 'review';
    } else if (highestConfidence >= 80) {
      recommendedAction = 'review';
    }
    
    return {
      hasPotentialDuplicates: matches.length > 0,
      matches: matches.slice(0, 10),
      highestConfidence,
      recommendedAction
    };
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return {
      hasPotentialDuplicates: false,
      matches: [],
      highestConfidence: 0,
      recommendedAction: 'allow'
    };
  }
}

export async function updateNormalizedFields(companyId: number, companyName: string, email?: string): Promise<void> {
  const normalizedName = normalizeCompanyName(companyName);
  const normalizedDomain = email ? extractEmailDomain(email) : null;
  
  await db.update(companies)
    .set({
      normalizedName,
      normalizedDomain,
      updatedAt: new Date()
    })
    .where(eq(companies.id, companyId));
}

export async function backfillNormalizedFields(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;
  
  try {
    const allCompanies = await db.select({
      id: companies.id,
      companyName: companies.companyName,
      primaryEmail: companies.primaryEmail
    }).from(companies);
    
    for (const company of allCompanies) {
      try {
        await updateNormalizedFields(company.id, company.companyName, company.primaryEmail || undefined);
        updated++;
      } catch (e) {
        errors++;
        console.error(`Failed to update company ${company.id}:`, e);
      }
    }
    
    return { updated, errors };
  } catch (error) {
    console.error('Error backfilling normalized fields:', error);
    return { updated, errors };
  }
}

export async function markAsDuplicate(
  companyId: number,
  masterCompanyId: number,
  confidence: number,
  reviewedBy: string
): Promise<void> {
  await db.update(companies)
    .set({
      duplicateStatus: 'confirmed',
      duplicateOf: masterCompanyId,
      duplicateConfidence: confidence.toString(),
      duplicateReviewedAt: new Date(),
      duplicateReviewedBy: reviewedBy,
      updatedAt: new Date()
    })
    .where(eq(companies.id, companyId));
}

export async function markAsUnique(
  companyId: number,
  reviewedBy: string
): Promise<void> {
  await db.update(companies)
    .set({
      duplicateStatus: 'unique',
      duplicateOf: null,
      duplicateConfidence: null,
      duplicateReviewedAt: new Date(),
      duplicateReviewedBy: reviewedBy,
      updatedAt: new Date()
    })
    .where(eq(companies.id, companyId));
}

export async function getSuspectedDuplicates(): Promise<any[]> {
  return await db.select()
    .from(companies)
    .where(eq(companies.duplicateStatus, 'suspected'))
    .orderBy(companies.createdAt);
}
