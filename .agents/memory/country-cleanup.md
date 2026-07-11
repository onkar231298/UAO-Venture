---
name: Country cleanup
description: Rules and results for the address_country normalization across all companies
---

## What was done
- Phase 1: 825 rows normalized (USA→United States, UK→United Kingdom, Deutschland→Germany, etc.)
- Phase 2: 128 missing countries filled using email TLD (.de/.nl/.fr etc.) and city names
- Phase 3: 42 more filled using .co.uk, company legal type (GmbH/BV/S.A.deCV/SL/AS), city names, website keywords
- Phase 4: 20 specific companies fixed by ID using company name/website context knowledge

## Canonical country names used
United States, United Kingdom, Germany, France, Netherlands, Turkey, Australia, Canada, Bulgaria, Italy, Spain, Greece, Poland, South Africa, Ukraine, Latvia, Ireland, Belgium, Portugal, Sweden, Hungary, Czech Republic, Sri Lanka, Eswatini (formerly Swaziland), Bosnia and Herzegovina, Albania, China, Madagascar, Mexico, Guatemala, Finland, Estonia, Romania, Denmark, Slovakia, Slovenia, Austria, Serbia, Croatia, Lithuania, India

## 15 remaining blank (as of cleanup)
IDs: 2980, 1460, 1827, 2065, 2829, 3014, 3009, 196, 2608, 2889, 2569, 954, 2901, 2902, 2900
Most are test/dummy entries (Company Name, companyName*, My company, PropTech, etc.) or companies with zero contact data.

**Why:** Column is `address_country` (not `country`) in the `companies` table.
