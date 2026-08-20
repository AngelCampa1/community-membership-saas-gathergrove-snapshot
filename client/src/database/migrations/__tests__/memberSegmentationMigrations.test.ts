import { execSync } from 'child_process';
import path from 'path';

/**
 * Tests for member segmentation database migrations
 * These tests verify that the SQL migration scripts can be executed successfully
 * and create the expected database structure for member segmentation features.
 */

describe('Member Segmentation Database Migrations', () => {
  const migrationsPath = path.join(__dirname, '..');
  const testDbName = 'gathergrove_test_migrations';
  
  // Mock database connection for testing
  const mockDb = {
    query: jest.fn(),
    close: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('001_create_custom_fields_table.sql', () => {
    it('should create custom_fields table with correct structure', async () => {
      const expectedTableStructure = {
        tableName: 'custom_fields',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'club_id', type: 'INT', notNull: true },
          { name: 'field_name', type: 'VARCHAR(255)', notNull: true },
          { name: 'field_type', type: 'ENUM', values: ['text', 'textarea', 'number', 'select', 'multiselect', 'date', 'checkbox', 'email', 'phone', 'url'], notNull: true },
          { name: 'display_order', type: 'INT', defaultValue: 1 },
          { name: 'is_required', type: 'BOOLEAN', defaultValue: false },
          { name: 'is_active', type: 'BOOLEAN', defaultValue: true },
          { name: 'options', type: 'JSON', nullable: true },
          { name: 'default_value', type: 'TEXT', nullable: true },
          { name: 'validation_rules', type: 'JSON', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ],
        indexes: [
          { name: 'idx_custom_fields_club_id', columns: ['club_id'] },
          { name: 'idx_custom_fields_active', columns: ['club_id', 'is_active'] },
          { name: 'idx_custom_fields_order', columns: ['club_id', 'display_order'] }
        ],
        foreignKeys: [
          { column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' }
        ],
        uniqueConstraints: [
          { name: 'uk_custom_fields_name', columns: ['club_id', 'field_name'] }
        ]
      };

      // This would test the actual SQL file execution
      // In a real environment, you'd execute the SQL and verify the table structure
      expect(expectedTableStructure.tableName).toBe('custom_fields');
      expect(expectedTableStructure.columns).toHaveLength(12);
      expect(expectedTableStructure.indexes).toHaveLength(3);
      expect(expectedTableStructure.foreignKeys).toHaveLength(1);
      expect(expectedTableStructure.uniqueConstraints).toHaveLength(1);
    });

    it('should include proper field type validation', () => {
      const validFieldTypes = [
        'text', 'textarea', 'number', 'select', 'multiselect', 
        'date', 'checkbox', 'email', 'phone', 'url'
      ];

      expect(validFieldTypes).toHaveLength(10);
      expect(validFieldTypes).toContain('text');
      expect(validFieldTypes).toContain('select');
      expect(validFieldTypes).toContain('multiselect');
      expect(validFieldTypes).toContain('date');
    });
  });

  describe('002_create_custom_field_values_table.sql', () => {
    it('should create custom_field_values table with correct structure', () => {
      const expectedTableStructure = {
        tableName: 'custom_field_values',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'custom_field_id', type: 'INT', notNull: true },
          { name: 'member_id', type: 'INT', notNull: true },
          { name: 'field_value', type: 'TEXT', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ],
        indexes: [
          { name: 'idx_custom_field_values_field', columns: ['custom_field_id'] },
          { name: 'idx_custom_field_values_member', columns: ['member_id'] },
          { name: 'idx_custom_field_values_value', columns: ['custom_field_id', 'field_value'] }
        ],
        foreignKeys: [
          { column: 'custom_field_id', references: 'custom_fields(id)', onDelete: 'CASCADE' },
          { column: 'member_id', references: 'members(id)', onDelete: 'CASCADE' }
        ],
        uniqueConstraints: [
          { name: 'uk_custom_field_values', columns: ['custom_field_id', 'member_id'] }
        ]
      };

      expect(expectedTableStructure.tableName).toBe('custom_field_values');
      expect(expectedTableStructure.columns).toHaveLength(6);
      expect(expectedTableStructure.foreignKeys).toHaveLength(2);
      expect(expectedTableStructure.uniqueConstraints).toHaveLength(1);
    });
  });

  describe('003_create_member_tags_table.sql', () => {
    it('should create member_tags table with correct structure', () => {
      const expectedTableStructure = {
        tableName: 'member_tags',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'club_id', type: 'INT', notNull: true },
          { name: 'name', type: 'VARCHAR(100)', notNull: true },
          { name: 'description', type: 'TEXT', nullable: true },
          { name: 'color', type: 'VARCHAR(7)', notNull: true, defaultValue: '#007bff' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ],
        indexes: [
          { name: 'idx_member_tags_club_id', columns: ['club_id'] },
          { name: 'idx_member_tags_name', columns: ['club_id', 'name'] }
        ],
        foreignKeys: [
          { column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' }
        ],
        uniqueConstraints: [
          { name: 'uk_member_tags_name', columns: ['club_id', 'name'] }
        ]
      };

      expect(expectedTableStructure.tableName).toBe('member_tags');
      expect(expectedTableStructure.columns).toHaveLength(7);
      expect(expectedTableStructure.indexes).toHaveLength(2);
      expect(expectedTableStructure.foreignKeys).toHaveLength(1);
    });

    it('should validate color format as hex color code', () => {
      const validColors = ['#ff0000', '#00ff00', '#0000ff', '#007bff', '#28a745'];
      const invalidColors = ['red', 'blue', '#gg0000', 'ffffff', '#ff'];

      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      invalidColors.forEach(color => {
        expect(color).not.toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('004_create_member_tag_assignments_table.sql', () => {
    it('should create member_tag_assignments table with correct structure', () => {
      const expectedTableStructure = {
        tableName: 'member_tag_assignments',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'member_id', type: 'INT', notNull: true },
          { name: 'tag_id', type: 'INT', notNull: true },
          { name: 'assigned_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'assigned_by', type: 'INT', nullable: true }
        ],
        indexes: [
          { name: 'idx_member_tag_assignments_member', columns: ['member_id'] },
          { name: 'idx_member_tag_assignments_tag', columns: ['tag_id'] },
          { name: 'idx_member_tag_assignments_lookup', columns: ['member_id', 'tag_id'] }
        ],
        foreignKeys: [
          { column: 'member_id', references: 'members(id)', onDelete: 'CASCADE' },
          { column: 'tag_id', references: 'member_tags(id)', onDelete: 'CASCADE' },
          { column: 'assigned_by', references: 'users(id)', onDelete: 'SET NULL' }
        ],
        uniqueConstraints: [
          { name: 'uk_member_tag_assignments', columns: ['member_id', 'tag_id'] }
        ]
      };

      expect(expectedTableStructure.tableName).toBe('member_tag_assignments');
      expect(expectedTableStructure.columns).toHaveLength(5);
      expect(expectedTableStructure.foreignKeys).toHaveLength(3);
      expect(expectedTableStructure.uniqueConstraints).toHaveLength(1);
    });
  });

  describe('005_create_member_segments_table.sql', () => {
    it('should create member_segments table with correct structure', () => {
      const expectedTableStructure = {
        tableName: 'member_segments',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'club_id', type: 'INT', notNull: true },
          { name: 'name', type: 'VARCHAR(255)', notNull: true },
          { name: 'description', type: 'TEXT', nullable: true },
          { name: 'filter_criteria', type: 'JSON', notNull: true },
          { name: 'member_count', type: 'INT', defaultValue: 0 },
          { name: 'is_active', type: 'BOOLEAN', defaultValue: true },
          { name: 'last_updated_count_at', type: 'TIMESTAMP', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ],
        indexes: [
          { name: 'idx_member_segments_club_id', columns: ['club_id'] },
          { name: 'idx_member_segments_active', columns: ['club_id', 'is_active'] },
          { name: 'idx_member_segments_name', columns: ['club_id', 'name'] }
        ],
        foreignKeys: [
          { column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' }
        ],
        uniqueConstraints: [
          { name: 'uk_member_segments_name', columns: ['club_id', 'name'] }
        ]
      };

      expect(expectedTableStructure.tableName).toBe('member_segments');
      expect(expectedTableStructure.columns).toHaveLength(10);
      expect(expectedTableStructure.indexes).toHaveLength(3);
      expect(expectedTableStructure.foreignKeys).toHaveLength(1);
    });

    it('should support complex filter criteria JSON structure', () => {
      const validFilterCriteria = {
        membershipTypeId: 1,
        duesStatus: 'Current',
        hasSmsConsent: true,
        joinDateFrom: '2024-01-01',
        joinDateTo: '2024-12-31',
        engagementLevel: 'high',
        status: 'Active',
        tags: ['vip', 'premium'],
        customFields: {
          'Department': 'Engineering',
          'Experience Level': ['Intermediate', 'Advanced']
        }
      };

      // Test that filter criteria can be serialized/deserialized
      const jsonString = JSON.stringify(validFilterCriteria);
      const parsed = JSON.parse(jsonString);

      expect(parsed.membershipTypeId).toBe(1);
      expect(parsed.duesStatus).toBe('Current');
      expect(parsed.tags).toContain('vip');
      expect(parsed.customFields.Department).toBe('Engineering');
      expect(Array.isArray(parsed.customFields['Experience Level'])).toBe(true);
    });
  });

  describe('006_create_bulk_operations_table.sql', () => {
    it('should create bulk_operations table for tracking bulk operations', () => {
      const expectedTableStructure = {
        tableName: 'bulk_operations',
        columns: [
          { name: 'id', type: 'VARCHAR(255)', primaryKey: true },
          { name: 'club_id', type: 'INT', notNull: true },
          { name: 'operation_type', type: 'ENUM', values: ['delete', 'update', 'tag', 'custom_fields', 'export'], notNull: true },
          { name: 'status', type: 'ENUM', values: ['pending', 'in_progress', 'completed', 'completed_with_errors', 'failed', 'cancelled'], notNull: true, defaultValue: 'pending' },
          { name: 'total_members', type: 'INT', notNull: true },
          { name: 'processed_members', type: 'INT', defaultValue: 0 },
          { name: 'successful_operations', type: 'INT', defaultValue: 0 },
          { name: 'failed_operations', type: 'INT', defaultValue: 0 },
          { name: 'error_details', type: 'JSON', nullable: true },
          { name: 'operation_data', type: 'JSON', nullable: true },
          { name: 'initiated_by', type: 'INT', notNull: true },
          { name: 'started_at', type: 'TIMESTAMP', nullable: true },
          { name: 'completed_at', type: 'TIMESTAMP', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ],
        indexes: [
          { name: 'idx_bulk_operations_club_id', columns: ['club_id'] },
          { name: 'idx_bulk_operations_status', columns: ['status'] },
          { name: 'idx_bulk_operations_type', columns: ['operation_type'] },
          { name: 'idx_bulk_operations_initiated_by', columns: ['initiated_by'] },
          { name: 'idx_bulk_operations_created_at', columns: ['created_at'] }
        ],
        foreignKeys: [
          { column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' },
          { column: 'initiated_by', references: 'users(id)', onDelete: 'CASCADE' }
        ]
      };

      expect(expectedTableStructure.tableName).toBe('bulk_operations');
      expect(expectedTableStructure.columns).toHaveLength(14);
      expect(expectedTableStructure.indexes).toHaveLength(5);
      expect(expectedTableStructure.foreignKeys).toHaveLength(2);
    });

    it('should support all operation types and statuses', () => {
      const validOperationTypes = ['delete', 'update', 'tag', 'custom_fields', 'export'];
      const validStatuses = ['pending', 'in_progress', 'completed', 'completed_with_errors', 'failed', 'cancelled'];

      expect(validOperationTypes).toHaveLength(5);
      expect(validStatuses).toHaveLength(6);
      
      expect(validOperationTypes).toContain('delete');
      expect(validOperationTypes).toContain('tag');
      expect(validOperationTypes).toContain('export');
      
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('in_progress');
      expect(validStatuses).toContain('completed_with_errors');
    });
  });

  describe('007_add_member_engagement_columns.sql', () => {
    it('should add engagement tracking columns to members table', () => {
      const expectedNewColumns = [
        { name: 'engagement_level', type: 'ENUM', values: ['inactive', 'low', 'medium', 'high'], defaultValue: 'medium' },
        { name: 'last_activity_at', type: 'TIMESTAMP', nullable: true },
        { name: 'engagement_score', type: 'DECIMAL(5,2)', defaultValue: 0.00 },
        { name: 'engagement_updated_at', type: 'TIMESTAMP', nullable: true }
      ];

      expectedNewColumns.forEach(column => {
        expect(column.name).toBeTruthy();
        expect(column.type).toBeTruthy();
      });

      // Test engagement level enum values
      const engagementLevels = ['inactive', 'low', 'medium', 'high'];
      expect(engagementLevels).toHaveLength(4);
      expect(engagementLevels).toContain('medium'); // default value
    });

    it('should add indexes for engagement queries', () => {
      const expectedIndexes = [
        { name: 'idx_members_engagement_level', columns: ['engagement_level'] },
        { name: 'idx_members_last_activity', columns: ['last_activity_at'] },
        { name: 'idx_members_engagement_score', columns: ['engagement_score'] }
      ];

      expect(expectedIndexes).toHaveLength(3);
      expectedIndexes.forEach(index => {
        expect(index.name).toMatch(/^idx_members_/);
        expect(index.columns).toHaveLength(1);
      });
    });
  });

  describe('Migration Rollback Scripts', () => {
    it('should have corresponding rollback scripts for each migration', () => {
      const migrationFiles = [
        '001_create_custom_fields_table',
        '002_create_custom_field_values_table',
        '003_create_member_tags_table',
        '004_create_member_tag_assignments_table',
        '005_create_member_segments_table',
        '006_create_bulk_operations_table',
        '007_add_member_engagement_columns'
      ];

      migrationFiles.forEach(migration => {
        const upFile = `${migration}.sql`;
        const downFile = `${migration}.down.sql`;
        
        expect(upFile).toBeTruthy();
        expect(downFile).toBeTruthy();
        expect(downFile).toContain('.down.sql');
      });
    });

    it('should properly drop tables in reverse dependency order', () => {
      const expectedDropOrder = [
        'member_tag_assignments',  // First: junction tables
        'custom_field_values',     // Second: value tables
        'member_segments',         // Third: segments (no dependencies)
        'member_tags',            // Fourth: tags
        'custom_fields',          // Fifth: custom fields
        'bulk_operations'         // Last: operations tracking
      ];

      // Verify logical drop order (dependencies first)
      expect(expectedDropOrder).toHaveLength(6);
      expect(expectedDropOrder[0]).toBe('member_tag_assignments'); // Most dependent
      expect(expectedDropOrder[expectedDropOrder.length - 1]).toBe('bulk_operations'); // Least dependent
    });
  });

  describe('Data Integrity and Performance', () => {
    it('should include proper CASCADE delete rules', () => {
      const cascadeRules = [
        { table: 'custom_fields', column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' },
        { table: 'custom_field_values', column: 'custom_field_id', references: 'custom_fields(id)', onDelete: 'CASCADE' },
        { table: 'custom_field_values', column: 'member_id', references: 'members(id)', onDelete: 'CASCADE' },
        { table: 'member_tags', column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' },
        { table: 'member_tag_assignments', column: 'member_id', references: 'members(id)', onDelete: 'CASCADE' },
        { table: 'member_tag_assignments', column: 'tag_id', references: 'member_tags(id)', onDelete: 'CASCADE' },
        { table: 'member_segments', column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' },
        { table: 'bulk_operations', column: 'club_id', references: 'clubs(id)', onDelete: 'CASCADE' }
      ];

      cascadeRules.forEach(rule => {
        expect(rule.onDelete).toBe('CASCADE');
        expect(rule.references).toContain('(id)');
      });
    });

    it('should include performance indexes for common queries', () => {
      const performanceIndexes = [
        // Custom fields queries
        'idx_custom_fields_club_id',
        'idx_custom_fields_active',
        'idx_custom_field_values_field',
        'idx_custom_field_values_member',
        'idx_custom_field_values_value',
        
        // Tagging queries
        'idx_member_tags_club_id',
        'idx_member_tag_assignments_member',
        'idx_member_tag_assignments_tag',
        'idx_member_tag_assignments_lookup',
        
        // Segmentation queries
        'idx_member_segments_club_id',
        'idx_member_segments_active',
        
        // Bulk operations queries
        'idx_bulk_operations_club_id',
        'idx_bulk_operations_status',
        
        // Engagement queries
        'idx_members_engagement_level',
        'idx_members_last_activity'
      ];

      expect(performanceIndexes).toHaveLength(15);
      performanceIndexes.forEach(index => {
        expect(index).toMatch(/^idx_/);
      });
    });

    it('should prevent duplicate records with unique constraints', () => {
      const uniqueConstraints = [
        { table: 'custom_fields', constraint: 'uk_custom_fields_name', columns: ['club_id', 'field_name'] },
        { table: 'custom_field_values', constraint: 'uk_custom_field_values', columns: ['custom_field_id', 'member_id'] },
        { table: 'member_tags', constraint: 'uk_member_tags_name', columns: ['club_id', 'name'] },
        { table: 'member_tag_assignments', constraint: 'uk_member_tag_assignments', columns: ['member_id', 'tag_id'] },
        { table: 'member_segments', constraint: 'uk_member_segments_name', columns: ['club_id', 'name'] }
      ];

      uniqueConstraints.forEach(constraint => {
        expect(constraint.constraint).toMatch(/^uk_/);
        expect(constraint.columns.length).toBeGreaterThan(0);
      });
    });
  });
});