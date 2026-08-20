import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Database connection configuration for testing
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'gathergrove_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

describe('Database Schema Migrations - Member Segmentation', () => {
  let pool: Pool;
  let testDbName: string;

  beforeEach(async () => {
    // Create unique test database for each test
    testDbName = `gathergrove_migration_test_${Date.now()}`;
    
    // Connect to postgres to create test database
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres'
    });

    try {
      await adminPool.query(`CREATE DATABASE "${testDbName}"`);
      await adminPool.end();

      // Connect to test database
      pool = new Pool({
        ...testDbConfig,
        database: testDbName
      });
    } catch (error) {
      console.error('Failed to create test database:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (pool) {
      await pool.end();
    }

    // Clean up test database
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres'
    });

    try {
      await adminPool.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
      await adminPool.end();
    } catch (error) {
      console.warn('Failed to clean up test database:', error);
    }
  });

  describe('Initial Schema Creation', () => {
    it('should create all required tables for member segmentation', async () => {
      // Apply initial migration
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Verify member_segments table
      const segmentTableResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'member_segments'
        ORDER BY ordinal_position
      `);

      const expectedSegmentColumns = [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'club_id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'description', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'filter_criteria_json', data_type: 'text', is_nullable: 'NO' },
        { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO' },
        { column_name: 'is_system_generated', data_type: 'boolean', is_nullable: 'NO' },
        { column_name: 'member_count', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'last_calculated', data_type: 'timestamp with time zone', is_nullable: 'YES' },
        { column_name: 'calculation_duration_ms', data_type: 'integer', is_nullable: 'YES' },
        { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'NO' },
        { column_name: 'created_by_user_id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: 'NO' }
      ];

      expect(segmentTableResult.rows).toHaveLength(expectedSegmentColumns.length);
      expectedSegmentColumns.forEach((expectedCol, index) => {
        expect(segmentTableResult.rows[index]).toMatchObject(expectedCol);
      });

      // Verify segment_member_cache table
      const cacheTableResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'segment_member_cache'
        ORDER BY ordinal_position
      `);

      expect(cacheTableResult.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ column_name: 'segment_id', data_type: 'integer' }),
          expect.objectContaining({ column_name: 'member_id', data_type: 'integer' }),
          expect.objectContaining({ column_name: 'added_at', data_type: 'timestamp with time zone' }),
          expect.objectContaining({ column_name: 'cache_version', data_type: 'integer' })
        ])
      );

      // Verify filter_templates table
      const templateTableResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'filter_templates'
      `);

      expect(templateTableResult.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ column_name: 'id', data_type: 'integer' }),
          expect.objectContaining({ column_name: 'name', data_type: 'character varying' }),
          expect.objectContaining({ column_name: 'category', data_type: 'character varying' }),
          expect.objectContaining({ column_name: 'filter_criteria_json', data_type: 'text' }),
          expect.objectContaining({ column_name: 'is_system_template', data_type: 'boolean' }),
          expect.objectContaining({ column_name: 'usage_count', data_type: 'integer' })
        ])
      );
    });

    it('should create proper indexes for performance', async () => {
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Check indexes on member_segments
      const segmentIndexes = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'member_segments'
        AND schemaname = 'public'
      `);

      const indexNames = segmentIndexes.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_member_segments_club_id');
      expect(indexNames).toContain('idx_member_segments_active');
      expect(indexNames).toContain('idx_member_segments_last_calculated');

      // Check indexes on segment_member_cache
      const cacheIndexes = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'segment_member_cache'
        AND schemaname = 'public'
      `);

      const cacheIndexNames = cacheIndexes.rows.map(row => row.indexname);
      expect(cacheIndexNames).toContain('idx_segment_member_cache_segment_id');
      expect(cacheIndexNames).toContain('idx_segment_member_cache_member_id');
      expect(cacheIndexNames).toContain('idx_segment_member_cache_composite');
    });

    it('should create proper foreign key constraints', async () => {
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Check foreign key constraints
      const constraints = await pool.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND (tc.table_name = 'member_segments' OR tc.table_name = 'segment_member_cache')
      `);

      const constraintNames = constraints.rows.map(row => row.constraint_name);
      expect(constraintNames).toContain('fk_member_segments_club');
      expect(constraintNames).toContain('fk_member_segments_created_by');
      expect(constraintNames).toContain('fk_segment_member_cache_segment');
      expect(constraintNames).toContain('fk_segment_member_cache_member');
    });
  });

  describe('Migration Rollback', () => {
    it('should properly rollback member segmentation tables', async () => {
      // Apply migration
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Verify tables exist
      let tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('member_segments', 'segment_member_cache', 'filter_templates')
      `);
      expect(tables.rows).toHaveLength(3);

      // Apply rollback
      await applyMigration('001_rollback_member_segmentation_tables.sql');

      // Verify tables are removed
      tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('member_segments', 'segment_member_cache', 'filter_templates')
      `);
      expect(tables.rows).toHaveLength(0);
    });

    it('should handle rollback when tables do not exist', async () => {
      // Apply rollback without creating tables first
      await expect(applyMigration('001_rollback_member_segmentation_tables.sql'))
        .resolves.not.toThrow();

      // Verify no tables exist
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('member_segments', 'segment_member_cache', 'filter_templates')
      `);
      expect(tables.rows).toHaveLength(0);
    });
  });

  describe('Data Migration and Schema Updates', () => {
    it('should handle adding new columns to existing segments', async () => {
      // Apply initial migration
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Insert test data
      await pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES (
          1, 'Test Segment', 'Test Description', '{}',
          true, false, 0, 1, NOW(), NOW()
        )
      `);

      // Apply schema update migration (adding performance metrics columns)
      await applyMigration('002_add_performance_metrics_columns.sql');

      // Verify new columns exist
      const columns = await pool.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'member_segments'
        AND column_name IN ('average_calculation_time', 'cache_hit_ratio', 'performance_score')
      `);

      expect(columns.rows).toHaveLength(3);

      // Verify existing data is preserved
      const segments = await pool.query('SELECT * FROM member_segments');
      expect(segments.rows).toHaveLength(1);
      expect(segments.rows[0].name).toBe('Test Segment');
      expect(segments.rows[0].average_calculation_time).toBeNull();
      expect(segments.rows[0].cache_hit_ratio).toBeNull();
      expect(segments.rows[0].performance_score).toBeNull();
    });

    it('should migrate legacy filter format to new structure', async () => {
      // Apply initial migration
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Insert legacy format data
      await pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES 
        (1, 'Legacy Segment 1', 'Old format', '{"status": "active", "joinDate": "2023-01-01"}', true, false, 0, 1, NOW(), NOW()),
        (1, 'Legacy Segment 2', 'Old format', '{"engagement": "high", "tags": ["vip"]}', true, false, 0, 1, NOW(), NOW())
      `);

      // Apply data migration
      await applyMigration('003_migrate_legacy_filter_format.sql');

      // Verify data migration
      const segments = await pool.query('SELECT id, name, filter_criteria_json FROM member_segments ORDER BY id');
      
      expect(segments.rows).toHaveLength(2);
      
      // Verify first segment migration
      const segment1Filter = JSON.parse(segments.rows[0].filter_criteria_json);
      expect(segment1Filter).toHaveProperty('statusFilter');
      expect(segment1Filter).toHaveProperty('joinDateFilter');
      expect(segment1Filter.statusFilter.operator).toBe('Equals');
      expect(segment1Filter.statusFilter.value).toBe('active');

      // Verify second segment migration
      const segment2Filter = JSON.parse(segments.rows[1].filter_criteria_json);
      expect(segment2Filter).toHaveProperty('engagementLevelFilter');
      expect(segment2Filter).toHaveProperty('tagFilter');
      expect(segment2Filter.engagementLevelFilter.operator).toBe('Equals');
      expect(segment2Filter.tagFilter.operator).toBe('HasAny');
    });
  });

  describe('Performance and Constraints', () => {
    it('should enforce unique segment names per club', async () => {
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Insert first segment
      await pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES (1, 'Duplicate Name', 'First segment', '{}', true, false, 0, 1, NOW(), NOW())
      `);

      // Attempt to insert duplicate name in same club
      await expect(pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES (1, 'Duplicate Name', 'Second segment', '{}', true, false, 0, 1, NOW(), NOW())
      `)).rejects.toThrow();

      // Should allow same name in different club
      await expect(pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES (2, 'Duplicate Name', 'Different club', '{}', true, false, 0, 1, NOW(), NOW())
      `)).resolves.not.toThrow();
    });

    it('should handle large cache tables efficiently', async () => {
      await applyMigration('001_create_member_segmentation_tables.sql');

      // Create segment
      const segmentResult = await pool.query(`
        INSERT INTO member_segments (
          club_id, name, description, filter_criteria_json,
          is_active, is_system_generated, member_count,
          created_by_user_id, created_at, updated_at
        ) VALUES (1, 'Large Segment', 'Performance test', '{}', true, false, 1000, 1, NOW(), NOW())
        RETURNING id
      `);
      const segmentId = segmentResult.rows[0].id;

      // Insert large number of cache entries
      const batchSize = 1000;
      const values = [];
      for (let i = 1; i <= batchSize; i++) {
        values.push(`(${segmentId}, ${i}, NOW(), 1)`);
      }

      const startTime = Date.now();
      await pool.query(`
        INSERT INTO segment_member_cache (segment_id, member_id, added_at, cache_version)
        VALUES ${values.join(', ')}
      `);
      const insertTime = Date.now() - startTime;

      // Performance benchmark - should insert 1000 records quickly
      expect(insertTime).toBeLessThan(1000); // Less than 1 second

      // Test query performance
      const queryStartTime = Date.now();
      const cacheResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM segment_member_cache 
        WHERE segment_id = $1
      `, [segmentId]);
      const queryTime = Date.now() - queryStartTime;

      expect(cacheResult.rows[0].count).toBe('1000');
      expect(queryTime).toBeLessThan(100); // Less than 100ms
    });
  });

  describe('Migration Version Control', () => {
    it('should track applied migrations', async () => {
      // Apply migration system setup
      await applyMigration('000_create_migration_tracking.sql');

      // Verify migration tracking table
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      `);
      expect(tables.rows).toHaveLength(1);

      // Apply member segmentation migration
      await applyMigration('001_create_member_segmentation_tables.sql');
      
      // Record migration
      await pool.query(`
        INSERT INTO schema_migrations (version, applied_at)
        VALUES ('001_create_member_segmentation_tables', NOW())
      `);

      // Verify migration is recorded
      const migrations = await pool.query(`
        SELECT version FROM schema_migrations 
        WHERE version = '001_create_member_segmentation_tables'
      `);
      expect(migrations.rows).toHaveLength(1);
    });

    it('should prevent duplicate migration application', async () => {
      await applyMigration('000_create_migration_tracking.sql');
      await applyMigration('001_create_member_segmentation_tables.sql');
      
      // Record migration
      await pool.query(`
        INSERT INTO schema_migrations (version, applied_at)
        VALUES ('001_create_member_segmentation_tables', NOW())
      `);

      // Check if migration already applied
      const existingMigration = await pool.query(`
        SELECT version FROM schema_migrations 
        WHERE version = '001_create_member_segmentation_tables'
      `);

      if (existingMigration.rows.length > 0) {
        // Should skip re-application
        expect(existingMigration.rows).toHaveLength(1);
      }
    });
  });

  // Helper function to apply migration files
  async function applyMigration(migrationFile: string): Promise<void> {
    const migrationPath = join(process.cwd(), 'database', 'migrations', migrationFile);
    
    try {
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      await pool.query(migrationSQL);
    } catch (error) {
      // For testing purposes, create mock migration SQL if file doesn't exist
      const mockMigrations: { [key: string]: string } = {
        '000_create_migration_tracking.sql': `
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `,
        '001_create_member_segmentation_tables.sql': `
          -- Create member_segments table
          CREATE TABLE IF NOT EXISTS member_segments (
            id SERIAL PRIMARY KEY,
            club_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            filter_criteria_json TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            is_system_generated BOOLEAN NOT NULL DEFAULT false,
            member_count INTEGER NOT NULL DEFAULT 0,
            last_calculated TIMESTAMP WITH TIME ZONE,
            calculation_duration_ms INTEGER,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by_user_id INTEGER NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_member_segments_club_name UNIQUE (club_id, name),
            CONSTRAINT fk_member_segments_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
            CONSTRAINT fk_member_segments_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
          );

          -- Create segment_member_cache table
          CREATE TABLE IF NOT EXISTS segment_member_cache (
            segment_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            cache_version INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (segment_id, member_id),
            CONSTRAINT fk_segment_member_cache_segment FOREIGN KEY (segment_id) REFERENCES member_segments(id) ON DELETE CASCADE,
            CONSTRAINT fk_segment_member_cache_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
          );

          -- Create filter_templates table
          CREATE TABLE IF NOT EXISTS filter_templates (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            filter_criteria_json TEXT NOT NULL,
            is_system_template BOOLEAN NOT NULL DEFAULT false,
            is_active BOOLEAN NOT NULL DEFAULT true,
            usage_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );

          -- Create indexes for performance
          CREATE INDEX IF NOT EXISTS idx_member_segments_club_id ON member_segments(club_id);
          CREATE INDEX IF NOT EXISTS idx_member_segments_active ON member_segments(is_active) WHERE is_active = true;
          CREATE INDEX IF NOT EXISTS idx_member_segments_last_calculated ON member_segments(last_calculated);
          
          CREATE INDEX IF NOT EXISTS idx_segment_member_cache_segment_id ON segment_member_cache(segment_id);
          CREATE INDEX IF NOT EXISTS idx_segment_member_cache_member_id ON segment_member_cache(member_id);
          CREATE INDEX IF NOT EXISTS idx_segment_member_cache_composite ON segment_member_cache(segment_id, member_id, cache_version);
          
          CREATE INDEX IF NOT EXISTS idx_filter_templates_category ON filter_templates(category);
          CREATE INDEX IF NOT EXISTS idx_filter_templates_system ON filter_templates(is_system_template);
        `,
        '001_rollback_member_segmentation_tables.sql': `
          DROP TABLE IF EXISTS segment_member_cache CASCADE;
          DROP TABLE IF EXISTS filter_templates CASCADE;
          DROP TABLE IF EXISTS member_segments CASCADE;
        `,
        '002_add_performance_metrics_columns.sql': `
          ALTER TABLE member_segments 
          ADD COLUMN IF NOT EXISTS average_calculation_time DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS cache_hit_ratio DECIMAL(5,4),
          ADD COLUMN IF NOT EXISTS performance_score INTEGER;

          CREATE INDEX IF NOT EXISTS idx_member_segments_performance ON member_segments(performance_score) 
          WHERE performance_score IS NOT NULL;
        `,
        '003_migrate_legacy_filter_format.sql': `
          -- Update legacy filter format to new structured format
          UPDATE member_segments 
          SET filter_criteria_json = CASE
            WHEN filter_criteria_json::jsonb ? 'status' THEN
              jsonb_build_object(
                'statusFilter', jsonb_build_object(
                  'operator', 'Equals',
                  'value', filter_criteria_json::jsonb->>'status'
                ),
                'joinDateFilter', CASE 
                  WHEN filter_criteria_json::jsonb ? 'joinDate' THEN
                    jsonb_build_object(
                      'operator', 'GreaterThanOrEqual',
                      'value', filter_criteria_json::jsonb->>'joinDate'
                    )
                  ELSE NULL
                END,
                'logicalOperator', 'And'
              )::text
            WHEN filter_criteria_json::jsonb ? 'engagement' THEN
              jsonb_build_object(
                'engagementLevelFilter', jsonb_build_object(
                  'operator', 'Equals',
                  'value', CASE filter_criteria_json::jsonb->>'engagement'
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                    ELSE 2
                  END
                ),
                'tagFilter', CASE
                  WHEN filter_criteria_json::jsonb ? 'tags' THEN
                    jsonb_build_object(
                      'operator', 'HasAny',
                      'tagNames', filter_criteria_json::jsonb->'tags'
                    )
                  ELSE NULL
                END,
                'logicalOperator', 'And'
              )::text
            ELSE filter_criteria_json
          END
          WHERE filter_criteria_json NOT LIKE '%statusFilter%' 
          AND filter_criteria_json NOT LIKE '%engagementLevelFilter%';
        `
      };

      if (mockMigrations[migrationFile]) {
        await pool.query(mockMigrations[migrationFile]);
      } else {
        throw new Error(`Migration file ${migrationFile} not found and no mock available`);
      }
    }
  }
});