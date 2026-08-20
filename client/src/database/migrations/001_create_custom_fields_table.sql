-- Migration: Create custom_fields table
-- Description: Add support for custom member fields with various data types
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE custom_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_type ENUM(
        'text', 
        'textarea', 
        'number', 
        'select', 
        'multiselect', 
        'date', 
        'checkbox', 
        'email', 
        'phone', 
        'url'
    ) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    options JSON NULL COMMENT 'For select/multiselect fields - array of valid options',
    default_value TEXT NULL COMMENT 'Default value for the field',
    validation_rules JSON NULL COMMENT 'Additional validation rules (min/max length, regex, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Unique constraints
    CONSTRAINT uk_custom_fields_name UNIQUE (club_id, field_name),
    
    -- Indexes for performance
    INDEX idx_custom_fields_club_id (club_id),
    INDEX idx_custom_fields_active (club_id, is_active),
    INDEX idx_custom_fields_order (club_id, display_order)
) ENGINE=InnoDB COMMENT='Custom fields definition for member profiles';

-- Add validation check for field_name length and format
ALTER TABLE custom_fields 
ADD CONSTRAINT chk_field_name_length 
CHECK (CHAR_LENGTH(field_name) >= 2 AND CHAR_LENGTH(field_name) <= 255);

-- Add validation check for display_order to be positive
ALTER TABLE custom_fields 
ADD CONSTRAINT chk_display_order_positive 
CHECK (display_order > 0);

-- Add validation check for options JSON structure (select fields must have options)
-- Note: This would be enforced in application logic due to MySQL JSON constraint limitations