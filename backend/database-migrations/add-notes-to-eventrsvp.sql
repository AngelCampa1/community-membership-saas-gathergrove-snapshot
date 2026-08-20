-- Migration: Add Notes field to EventRsvp table
-- Created: 2025-09-01
-- Purpose: Add optional Notes field to support event RSVP comments

-- Check if the column doesn't already exist before adding
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('EventRsvps') 
    AND name = 'Notes'
)
BEGIN
    ALTER TABLE EventRsvps
    ADD Notes NVARCHAR(MAX) NULL;
    
    PRINT 'Notes column added to EventRsvps table successfully.';
END
ELSE
BEGIN
    PRINT 'Notes column already exists in EventRsvps table.';
END