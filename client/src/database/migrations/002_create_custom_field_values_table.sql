-- Migration: Create custom_field_values table
-- Description: Store custom field values for individual members
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE custom_field_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    custom_field_id INT NOT NULL,
    member_id INT NOT NULL,
    field_value TEXT NULL COMMENT 'Stored as text, validated based on field_type',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    -- Unique constraints - one value per field per member
    CONSTRAINT uk_custom_field_values UNIQUE (custom_field_id, member_id),
    
    -- Indexes for performance
    INDEX idx_custom_field_values_field (custom_field_id),
    INDEX idx_custom_field_values_member (member_id),
    INDEX idx_custom_field_values_value (custom_field_id, field_value(255))
) ENGINE=InnoDB COMMENT='Custom field values for individual members';

-- Add optimization for field value searches (for text fields)
-- Create a generated column for efficient searching of text values
ALTER TABLE custom_field_values 
ADD COLUMN field_value_searchable VARCHAR(500) 
GENERATED ALWAYS AS (
    CASE 
        WHEN CHAR_LENGTH(field_value) <= 500 THEN field_value 
        ELSE LEFT(field_value, 500) 
    END
) STORED;

-- Add index on the searchable column
CREATE INDEX idx_custom_field_values_searchable 
ON custom_field_values (custom_field_id, field_value_searchable);

-- Add full-text search index for text content
ALTER TABLE custom_field_values 
ADD FULLTEXT INDEX ft_custom_field_values_text (field_value);