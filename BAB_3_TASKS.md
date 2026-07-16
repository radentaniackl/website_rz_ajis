# BAB 3 — Database Design & Implementation Tasks

## Task Breakdown

### Phase 1: Preparation & Review

- [x] DB3-1: Review full database files (database.sql, schema.ts, relations.ts)
- [ ] DB3-2: Setup Neon database
- [ ] DB3-3: Clean migration data (username dup, MD5, dates)
- [ ] DB3-4: Add audit log table to schema
- [ ] DB3-5: Add session table for Auth.js

### Phase 2: Database Import

- [ ] DB3-6: Import database to Neon
- [ ] DB3-7: Verify import (tables, indexes, constraints)

### Phase 3: Drizzle Setup

- [ ] DB3-8: Copy schema to lib/db
- [ ] DB3-9: Configure Drizzle
- [ ] DB3-10: Generate initial migration

### Phase 4: Repository Pattern

- [ ] DB3-11: Create base repository
- [ ] DB3-12: Create specific repositories

### Phase 5: Seed Data

- [ ] DB3-13: Create seed structure
- [ ] DB3-14: Create reference seed
- [ ] DB3-15: Create master seed

### Phase 6: Testing & Security

- [ ] DB3-16: Run database tests
- [ ] DB3-17: Configure database permissions
- [ ] DB3-18: Document database

## Task Details

| Task | Tujuan | Deskripsi | Priority | Dependency | Estimasi | Output | Deliverable |
|------|--------|-----------|----------|------------|---------|--------|-------------|
| DB3-1 | Review full database files | Review complete database.sql, schema.ts, relations.ts | High | None | 0.5 day | Review report | Full understanding of schema |
| DB3-2 | Setup Neon database | Create Neon project, get connection string | High | None | 0.5 day | Neon database | Database ready for import |
| DB3-3 | Clean migration data | Clean data (username dup, MD5, dates) before import | High | DB3-2 | 2 days | Cleaned data | Data ready for import |
| DB3-4 | Add audit log table | Add audit_log table to schema | High | DB3-1 | 0.5 day | Updated schema | Audit log table defined |
| DB3-5 | Add session table | Add ajis_session table for Auth.js | High | DB3-1 | 0.5 day | Updated schema | Session table defined |
| DB3-6 | Import database to Neon | Execute database.sql import to Neon | High | DB3-3, DB3-4, DB3-5 | 1 day | Imported database | Database in Neon |
| DB3-7 | Verify import | Verify all tables, indexes, constraints created | High | DB3-6 | 0.5 day | Verification report | Import validated |
| DB3-8 | Copy schema to lib/db | Copy schema.ts and relations.ts to lib/db/ | High | DB3-1 | 0.5 day | Schema files | Drizzle schema in place |
| DB3-9 | Configure Drizzle | Setup drizzle.config.ts | High | DB3-8 | 0.5 day | Drizzle config | Drizzle configured |
| DB3-10 | Generate initial migration | Generate migration file from schema | High | DB3-9 | 0.5 day | Migration file | Migration ready |
| DB3-11 | Create base repository | Implement BaseRepository class | High | DB3-9 | 0.5 day | Base repository | Repository pattern ready |
| DB3-12 | Create specific repositories | Implement AnakRepository, UserRepository, etc. | Medium | DB3-11 | 2 days | Repository files | All repositories ready |
| DB3-13 | Create seed structure | Create seed folder structure and base seed file | Medium | DB3-6 | 0.5 day | Seed structure | Seed framework ready |
| DB3-14 | Create reference seed | Implement geographic and user group seed | Medium | DB3-13 | 1 day | Reference seed | Reference data seeded |
| DB3-15 | Create master seed | Implement kantor, wilayah, users seed | Medium | DB3-14 | 1 day | Master seed | Master data seeded |
| DB3-16 | Run database tests | Run connection, migration, constraint tests | High | DB3-10 | 1 day | Test results | Database validated |
| DB3-17 | Configure database permissions | Create database user with minimum permissions | Medium | DB3-2 | 0.5 day | Database user | Permissions configured |
| DB3-18 | Document database | Create database documentation | Low | DB3-7 | 0.5 day | Documentation | Database documented |

**Total Estimasi:** 13 days

## Critical Blockers (Perlu Klarifikasi)

1. **Complete File Review** - Review full untruncated files (database.sql, schema.ts, relations.ts)
2. **Neon Database Setup** - Create Neon project and get connection string
3. **Migration Data Cleaning** - Clean data before import (username dup, MD5 passwords, '0000-00-00' dates)
4. **Audit Log Table** - Add `audit_log` table to schema before migration
5. **Session Table** - Add `ajis_session` table for Auth.js before migration
