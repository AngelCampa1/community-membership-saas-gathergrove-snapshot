-- Migration: Add member engagement tracking columns
-- Description: Extend members table with engagement tracking for segmentation
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

-- Add engagement tracking columns to members table
ALTER TABLE members 
ADD COLUMN engagement_level ENUM('inactive', 'low', 'medium', 'high') 
    NOT NULL DEFAULT 'medium' 
    COMMENT 'Member engagement level based on activity and participation',
    
ADD COLUMN last_activity_at TIMESTAMP NULL 
    COMMENT 'Timestamp of member last activity (login, event attendance, etc.)',
    
ADD COLUMN engagement_score DECIMAL(5,2) 
    NOT NULL DEFAULT 0.00 
    COMMENT 'Calculated engagement score (0-100)',
    
ADD COLUMN engagement_updated_at TIMESTAMP NULL 
    COMMENT 'When engagement metrics were last calculated';

-- Add indexes for engagement-based queries
CREATE INDEX idx_members_engagement_level 
ON members (club_id, engagement_level);

CREATE INDEX idx_members_last_activity 
ON members (club_id, last_activity_at DESC);

CREATE INDEX idx_members_engagement_score 
ON members (club_id, engagement_score DESC);

CREATE INDEX idx_members_engagement_updated 
ON members (engagement_updated_at);

-- Add composite index for segmentation queries
CREATE INDEX idx_members_engagement_composite 
ON members (club_id, engagement_level, last_activity_at, status);

-- Add validation constraints
ALTER TABLE members 
ADD CONSTRAINT chk_members_engagement_score_range 
CHECK (engagement_score >= 0.00 AND engagement_score <= 100.00);

-- Create engagement analytics view
CREATE VIEW member_engagement_analytics AS
SELECT 
    club_id,
    COUNT(*) as total_members,
    SUM(CASE WHEN engagement_level = 'inactive' THEN 1 ELSE 0 END) as inactive_count,
    SUM(CASE WHEN engagement_level = 'low' THEN 1 ELSE 0 END) as low_engagement_count,
    SUM(CASE WHEN engagement_level = 'medium' THEN 1 ELSE 0 END) as medium_engagement_count,
    SUM(CASE WHEN engagement_level = 'high' THEN 1 ELSE 0 END) as high_engagement_count,
    AVG(engagement_score) as avg_engagement_score,
    COUNT(CASE WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_last_30_days,
    COUNT(CASE WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_last_7_days,
    COUNT(CASE WHEN engagement_updated_at IS NULL OR engagement_updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as stale_engagement_data
FROM members 
WHERE status = 'Active'
GROUP BY club_id;

-- Create stored procedure for updating engagement scores
DELIMITER //

CREATE PROCEDURE UpdateMemberEngagementScore(
    IN p_member_id INT,
    IN p_activity_weight DECIMAL(5,2) DEFAULT 0.4,
    IN p_recency_weight DECIMAL(5,2) DEFAULT 0.3,
    IN p_consistency_weight DECIMAL(5,2) DEFAULT 0.3
)
BEGIN
    DECLARE v_activity_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_recency_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_consistency_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_final_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_engagement_level VARCHAR(20) DEFAULT 'medium';
    
    -- Calculate activity score based on member data
    -- (This would be expanded with actual activity tracking)
    SELECT 
        CASE 
            WHEN last_activity_at IS NULL THEN 0.00
            WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 100.00
            WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 75.00
            WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 50.00
            WHEN last_activity_at > DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 25.00
            ELSE 0.00
        END INTO v_recency_score
    FROM members 
    WHERE id = p_member_id;
    
    -- For now, set activity and consistency scores to moderate defaults
    -- These would be calculated based on actual member activity data
    SET v_activity_score = 60.00;
    SET v_consistency_score = 50.00;
    
    -- Calculate final weighted score
    SET v_final_score = (
        (v_activity_score * p_activity_weight) + 
        (v_recency_score * p_recency_weight) + 
        (v_consistency_score * p_consistency_weight)
    );
    
    -- Determine engagement level based on score
    SET v_engagement_level = CASE 
        WHEN v_final_score >= 80.00 THEN 'high'
        WHEN v_final_score >= 60.00 THEN 'medium'
        WHEN v_final_score >= 20.00 THEN 'low'
        ELSE 'inactive'
    END;
    
    -- Update member engagement data
    UPDATE members 
    SET 
        engagement_score = v_final_score,
        engagement_level = v_engagement_level,
        engagement_updated_at = CURRENT_TIMESTAMP
    WHERE id = p_member_id;
    
END//

DELIMITER ;

-- Create stored procedure for bulk engagement updates
DELIMITER //

CREATE PROCEDURE UpdateClubMemberEngagement(
    IN p_club_id INT,
    IN p_batch_size INT DEFAULT 100
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_member_id INT;
    DECLARE v_batch_count INT DEFAULT 0;
    
    -- Cursor for members needing engagement updates
    DECLARE member_cursor CURSOR FOR 
        SELECT id 
        FROM members 
        WHERE club_id = p_club_id 
          AND status = 'Active'
          AND (engagement_updated_at IS NULL 
               OR engagement_updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
        ORDER BY id
        LIMIT p_batch_size;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN member_cursor;
    
    update_loop: LOOP
        FETCH member_cursor INTO v_member_id;
        
        IF done THEN
            LEAVE update_loop;
        END IF;
        
        CALL UpdateMemberEngagementScore(v_member_id);
        SET v_batch_count = v_batch_count + 1;
    END LOOP;
    
    CLOSE member_cursor;
    
    SELECT v_batch_count as members_updated;
    
END//

DELIMITER ;

-- Create event to automatically update engagement scores
-- Note: This would be enabled based on server configuration
/*
CREATE EVENT ev_update_member_engagement
ON SCHEDULE EVERY 6 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Update engagement for all clubs (in production, this might be batched)
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_club_id INT;
    
    DECLARE club_cursor CURSOR FOR 
        SELECT DISTINCT club_id FROM members WHERE status = 'Active';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN club_cursor;
    
    club_loop: LOOP
        FETCH club_cursor INTO v_club_id;
        
        IF done THEN
            LEAVE club_loop;
        END IF;
        
        CALL UpdateClubMemberEngagement(v_club_id, 50);
    END LOOP;
    
    CLOSE club_cursor;
END;
*/

-- Add trigger to update last_activity_at when relevant member data changes
DELIMITER //

CREATE TRIGGER tr_members_activity_update
BEFORE UPDATE ON members
FOR EACH ROW
BEGIN
    -- Update last_activity_at if certain fields changed (indicating member activity)
    IF (OLD.email != NEW.email 
        OR OLD.phone_number != NEW.phone_number 
        OR OLD.address != NEW.address
        OR OLD.has_sms_consent != NEW.has_sms_consent) THEN
        SET NEW.last_activity_at = CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;