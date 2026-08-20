-- Migration: Create member_tag_assignments table
-- Description: Junction table for many-to-many relationship between members and tags
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE member_tag_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    tag_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL COMMENT 'User ID who assigned the tag',
    
    -- Foreign key constraints
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES member_tags(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraints - prevent duplicate tag assignments
    CONSTRAINT uk_member_tag_assignments UNIQUE (member_id, tag_id),
    
    -- Indexes for performance
    INDEX idx_member_tag_assignments_member (member_id),
    INDEX idx_member_tag_assignments_tag (tag_id),
    INDEX idx_member_tag_assignments_lookup (member_id, tag_id),
    INDEX idx_member_tag_assignments_assigned_by (assigned_by),
    INDEX idx_member_tag_assignments_date (assigned_at)
) ENGINE=InnoDB COMMENT='Member-to-tag assignments (many-to-many relationship)';

-- Create triggers to maintain tag member counts
DELIMITER //

-- Trigger to increment member count when tag is assigned
CREATE TRIGGER tr_member_tag_assignments_insert
AFTER INSERT ON member_tag_assignments
FOR EACH ROW
BEGIN
    UPDATE member_tags 
    SET member_count = member_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
END//

-- Trigger to decrement member count when tag is removed
CREATE TRIGGER tr_member_tag_assignments_delete
AFTER DELETE ON member_tag_assignments
FOR EACH ROW
BEGIN
    UPDATE member_tags 
    SET member_count = GREATEST(member_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
END//

-- Trigger to update member count when tag assignment is updated
CREATE TRIGGER tr_member_tag_assignments_update
AFTER UPDATE ON member_tag_assignments
FOR EACH ROW
BEGIN
    -- If tag_id changed, update both old and new tag counts
    IF OLD.tag_id != NEW.tag_id THEN
        -- Decrement old tag count
        UPDATE member_tags 
        SET member_count = GREATEST(member_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.tag_id;
        
        -- Increment new tag count
        UPDATE member_tags 
        SET member_count = member_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.tag_id;
    END IF;
END//

DELIMITER ;

-- Add composite index for bulk tag operations
CREATE INDEX idx_member_tag_assignments_bulk 
ON member_tag_assignments (tag_id, member_id, assigned_at);

-- Add index for audit and reporting queries
CREATE INDEX idx_member_tag_assignments_audit 
ON member_tag_assignments (assigned_by, assigned_at, tag_id);