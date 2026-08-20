-- Migration: Create member_tags table
-- Description: Define tags for categorizing and grouping members
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE member_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#007bff' COMMENT 'Hex color code for tag display',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Unique constraints
    CONSTRAINT uk_member_tags_name UNIQUE (club_id, name),
    
    -- Indexes for performance
    INDEX idx_member_tags_club_id (club_id),
    INDEX idx_member_tags_name (club_id, name)
) ENGINE=InnoDB COMMENT='Tags for categorizing members';

-- Add validation check for tag name length and format
ALTER TABLE member_tags 
ADD CONSTRAINT chk_tag_name_length 
CHECK (CHAR_LENGTH(name) >= 2 AND CHAR_LENGTH(name) <= 100);

-- Add validation check for hex color format
ALTER TABLE member_tags 
ADD CONSTRAINT chk_tag_color_format 
CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$');

-- Add validation to prevent reserved tag names
ALTER TABLE member_tags 
ADD CONSTRAINT chk_tag_name_not_reserved 
CHECK (LOWER(name) NOT IN ('all', 'none', 'undefined', 'null', 'admin', 'system'));

-- Create trigger to update member count when tags are created/deleted
-- Note: The actual member count will be maintained by the application
-- but we can add a computed column for caching

-- Add a computed member count column (updated via application logic)
ALTER TABLE member_tags 
ADD COLUMN member_count INT NOT NULL DEFAULT 0 
COMMENT 'Cached count of members with this tag - updated by application';

-- Add index for sorting by member count
CREATE INDEX idx_member_tags_count ON member_tags (club_id, member_count DESC);