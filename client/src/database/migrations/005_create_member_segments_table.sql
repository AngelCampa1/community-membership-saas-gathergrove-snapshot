-- Migration: Create member_segments table
-- Description: Define member segments based on filter criteria for targeted operations
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE member_segments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    filter_criteria JSON NOT NULL COMMENT 'JSON object defining the segment criteria',
    member_count INT NOT NULL DEFAULT 0 COMMENT 'Cached count of members matching criteria',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_updated_count_at TIMESTAMP NULL COMMENT 'When member count was last recalculated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Unique constraints
    CONSTRAINT uk_member_segments_name UNIQUE (club_id, name),
    
    -- Indexes for performance
    INDEX idx_member_segments_club_id (club_id),
    INDEX idx_member_segments_active (club_id, is_active),
    INDEX idx_member_segments_name (club_id, name),
    INDEX idx_member_segments_count (club_id, member_count DESC),
    INDEX idx_member_segments_updated (last_updated_count_at)
) ENGINE=InnoDB COMMENT='Member segments for targeted operations and analytics';

-- Add validation check for segment name length
ALTER TABLE member_segments 
ADD CONSTRAINT chk_segment_name_length 
CHECK (CHAR_LENGTH(name) >= 2 AND CHAR_LENGTH(name) <= 255);

-- Add validation check for member_count to be non-negative
ALTER TABLE member_segments 
ADD CONSTRAINT chk_segment_member_count 
CHECK (member_count >= 0);

-- Add JSON validation for filter_criteria structure
-- Note: Full JSON schema validation would be handled in application code
-- but we can add basic JSON validity check
ALTER TABLE member_segments 
ADD CONSTRAINT chk_filter_criteria_valid_json 
CHECK (JSON_VALID(filter_criteria));

-- Create generated columns for common filter criteria for indexing
-- These enable fast queries on common segment criteria

-- Add generated column for membership type filtering
ALTER TABLE member_segments
ADD COLUMN filter_membership_type_id INT
GENERATED ALWAYS AS (
    CASE 
        WHEN JSON_CONTAINS_PATH(filter_criteria, 'one', '$.membershipTypeId') 
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(filter_criteria, '$.membershipTypeId')) AS UNSIGNED)
        ELSE NULL
    END
) STORED;

-- Add generated column for dues status filtering
ALTER TABLE member_segments
ADD COLUMN filter_dues_status VARCHAR(50)
GENERATED ALWAYS AS (
    CASE 
        WHEN JSON_CONTAINS_PATH(filter_criteria, 'one', '$.duesStatus') 
        THEN JSON_UNQUOTE(JSON_EXTRACT(filter_criteria, '$.duesStatus'))
        ELSE NULL
    END
) STORED;

-- Add generated column for engagement level filtering
ALTER TABLE member_segments
ADD COLUMN filter_engagement_level VARCHAR(20)
GENERATED ALWAYS AS (
    CASE 
        WHEN JSON_CONTAINS_PATH(filter_criteria, 'one', '$.engagementLevel') 
        THEN JSON_UNQUOTE(JSON_EXTRACT(filter_criteria, '$.engagementLevel'))
        ELSE NULL
    END
) STORED;

-- Add generated column for status filtering
ALTER TABLE member_segments
ADD COLUMN filter_status VARCHAR(50)
GENERATED ALWAYS AS (
    CASE 
        WHEN JSON_CONTAINS_PATH(filter_criteria, 'one', '$.status') 
        THEN JSON_UNQUOTE(JSON_EXTRACT(filter_criteria, '$.status'))
        ELSE NULL
    END
) STORED;

-- Add indexes on generated columns for fast filtering
CREATE INDEX idx_member_segments_filter_membership_type 
ON member_segments (club_id, filter_membership_type_id);

CREATE INDEX idx_member_segments_filter_dues_status 
ON member_segments (club_id, filter_dues_status);

CREATE INDEX idx_member_segments_filter_engagement 
ON member_segments (club_id, filter_engagement_level);

CREATE INDEX idx_member_segments_filter_status 
ON member_segments (club_id, filter_status);

-- Add full-text search index for segment descriptions
ALTER TABLE member_segments 
ADD FULLTEXT INDEX ft_member_segments_description (name, description);

-- Create view for active segments with member counts
CREATE VIEW active_member_segments AS
SELECT 
    s.*,
    CASE 
        WHEN s.last_updated_count_at IS NULL 
             OR s.last_updated_count_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        THEN 'stale'
        ELSE 'current'
    END AS count_freshness
FROM member_segments s
WHERE s.is_active = TRUE;

-- Add trigger to automatically mark count as needing update when criteria changes
DELIMITER //

CREATE TRIGGER tr_member_segments_criteria_update
BEFORE UPDATE ON member_segments
FOR EACH ROW
BEGIN
    -- If filter criteria changed, mark count as stale
    IF JSON_UNQUOTE(OLD.filter_criteria) != JSON_UNQUOTE(NEW.filter_criteria) THEN
        SET NEW.last_updated_count_at = NULL;
    END IF;
END//

DELIMITER ;