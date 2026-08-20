-- Migration: Create bulk_operations table
-- Description: Track bulk operations on members for monitoring and audit purposes
-- Author: Hive Mind Collective Intelligence
-- Date: 2024-01-01

CREATE TABLE bulk_operations (
    id VARCHAR(255) PRIMARY KEY COMMENT 'Unique operation ID (UUID)',
    club_id INT NOT NULL,
    operation_type ENUM(
        'delete',
        'update', 
        'tag',
        'custom_fields',
        'export'
    ) NOT NULL,
    status ENUM(
        'pending',
        'in_progress',
        'completed',
        'completed_with_errors',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    total_members INT NOT NULL,
    processed_members INT NOT NULL DEFAULT 0,
    successful_operations INT NOT NULL DEFAULT 0,
    failed_operations INT NOT NULL DEFAULT 0,
    error_details JSON NULL COMMENT 'Array of error objects with member_id and error message',
    operation_data JSON NULL COMMENT 'Operation-specific data (updates, tag IDs, etc.)',
    initiated_by INT NOT NULL COMMENT 'User ID who started the operation',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_bulk_operations_club_id (club_id),
    INDEX idx_bulk_operations_status (status),
    INDEX idx_bulk_operations_type (operation_type),
    INDEX idx_bulk_operations_initiated_by (initiated_by),
    INDEX idx_bulk_operations_created_at (created_at DESC),
    INDEX idx_bulk_operations_lookup (club_id, status, operation_type)
) ENGINE=InnoDB COMMENT='Tracking table for bulk member operations';

-- Add validation constraints
ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_total_members_positive 
CHECK (total_members > 0);

ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_processed_non_negative 
CHECK (processed_members >= 0);

ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_successful_non_negative 
CHECK (successful_operations >= 0);

ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_failed_non_negative 
CHECK (failed_operations >= 0);

-- Add validation that processed = successful + failed
ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_math_consistency 
CHECK (processed_members = successful_operations + failed_operations);

-- Add validation for completed operations
ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_completed_logic 
CHECK (
    CASE 
        WHEN status IN ('completed', 'completed_with_errors') 
        THEN processed_members = total_members AND completed_at IS NOT NULL
        ELSE TRUE
    END
);

-- Add validation for started operations
ALTER TABLE bulk_operations 
ADD CONSTRAINT chk_bulk_operations_started_logic 
CHECK (
    CASE 
        WHEN status IN ('in_progress', 'completed', 'completed_with_errors', 'failed', 'cancelled') 
        THEN started_at IS NOT NULL
        ELSE TRUE
    END
);

-- Create generated columns for progress tracking
ALTER TABLE bulk_operations
ADD COLUMN progress_percentage DECIMAL(5,2)
GENERATED ALWAYS AS (
    CASE 
        WHEN total_members = 0 THEN 0
        ELSE ROUND((processed_members / total_members) * 100, 2)
    END
) STORED;

ALTER TABLE bulk_operations
ADD COLUMN estimated_completion_time TIMESTAMP
GENERATED ALWAYS AS (
    CASE 
        WHEN status = 'in_progress' 
             AND processed_members > 0 
             AND started_at IS NOT NULL
        THEN DATE_ADD(
            started_at,
            INTERVAL (
                (TIMESTAMPDIFF(SECOND, started_at, NOW()) * total_members) / processed_members
            ) SECOND
        )
        ELSE NULL
    END
) STORED;

-- Add indexes on generated columns
CREATE INDEX idx_bulk_operations_progress 
ON bulk_operations (club_id, status, progress_percentage);

-- Create view for active operations with progress
CREATE VIEW active_bulk_operations AS
SELECT 
    bo.*,
    CASE 
        WHEN bo.status = 'in_progress' AND bo.started_at IS NOT NULL
        THEN TIMESTAMPDIFF(SECOND, bo.started_at, NOW())
        ELSE NULL
    END AS duration_seconds,
    CASE 
        WHEN bo.status = 'in_progress' 
             AND bo.processed_members > 0 
             AND bo.started_at IS NOT NULL
        THEN ROUND(
            (TIMESTAMPDIFF(SECOND, bo.started_at, NOW()) * 
             (bo.total_members - bo.processed_members)) / bo.processed_members, 0
        )
        ELSE NULL
    END AS estimated_remaining_seconds
FROM bulk_operations bo
WHERE bo.status IN ('pending', 'in_progress');

-- Add triggers for automatic status management
DELIMITER //

-- Trigger to set started_at when status changes to in_progress
CREATE TRIGGER tr_bulk_operations_start
BEFORE UPDATE ON bulk_operations
FOR EACH ROW
BEGIN
    -- Set started_at when moving to in_progress
    IF OLD.status != 'in_progress' AND NEW.status = 'in_progress' THEN
        SET NEW.started_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set completed_at when moving to completed status
    IF OLD.status NOT IN ('completed', 'completed_with_errors', 'failed', 'cancelled')
       AND NEW.status IN ('completed', 'completed_with_errors', 'failed', 'cancelled') THEN
        SET NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

-- Create table for storing operation member details (for large operations)
CREATE TABLE bulk_operation_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operation_id VARCHAR(255) NOT NULL,
    member_id INT NOT NULL,
    status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    processed_at TIMESTAMP NULL,
    
    FOREIGN KEY (operation_id) REFERENCES bulk_operations(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_bulk_operation_members (operation_id, member_id),
    
    INDEX idx_bulk_operation_members_operation (operation_id),
    INDEX idx_bulk_operation_members_status (operation_id, status),
    INDEX idx_bulk_operation_members_member (member_id)
) ENGINE=InnoDB COMMENT='Individual member status within bulk operations';