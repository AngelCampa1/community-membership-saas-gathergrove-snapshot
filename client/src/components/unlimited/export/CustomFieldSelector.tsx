'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Search, CheckSquare, X, Info } from 'lucide-react';

interface CustomFieldSelectorProps {
  availableFields: string[];
  selectedFields: string[];
  onChange: (selectedFields: string[]) => void;
  category: 'member' | 'financial' | 'analytics' | 'event';
  disabled?: boolean;
}

interface FieldGroup {
  name: string;
  fields: FieldInfo[];
  description?: string;
  expanded?: boolean;
}

interface FieldInfo {
  id: string;
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required?: boolean;
  premium?: boolean;
  sampleValue?: string;
}

export function CustomFieldSelector({ 
  availableFields, 
  selectedFields, 
  onChange, 
  category,
  disabled = false 
}: CustomFieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['basic']);

  const getFieldGroups = (): FieldGroup[] => {
    switch (category) {
      case 'member':
        return [
          {
            name: 'basic',
            fields: [
              { id: 'firstName', name: 'First Name', description: 'Member\'s first name', dataType: 'string', required: true, sampleValue: 'John' },
              { id: 'lastName', name: 'Last Name', description: 'Member\'s last name', dataType: 'string', required: true, sampleValue: 'Doe' },
              { id: 'email', name: 'Email', description: 'Primary email address', dataType: 'string', required: true, sampleValue: 'john@example.com' },
              { id: 'phone', name: 'Phone', description: 'Phone number', dataType: 'string', sampleValue: '555-0123' },
              { id: 'membershipType', name: 'Membership Type', description: 'Type of membership', dataType: 'string', sampleValue: 'Premium' },
              { id: 'joinDate', name: 'Join Date', description: 'When the member joined', dataType: 'date', sampleValue: '2023-01-15' }
            ],
            description: 'Core member information'
          },
          {
            name: 'engagement',
            fields: [
              { id: 'engagement', name: 'Engagement Score', description: 'Member engagement rating', dataType: 'number', premium: true, sampleValue: '85.5' },
              { id: 'attendance', name: 'Attendance History', description: 'Event attendance records', dataType: 'object', premium: true, sampleValue: 'Array of events' },
              { id: 'lastActivity', name: 'Last Activity', description: 'Date of last activity', dataType: 'date', sampleValue: '2024-01-10' }
            ],
            description: 'Engagement and activity metrics'
          },
          {
            name: 'custom',
            fields: [
              { id: 'customFields', name: 'Custom Fields', description: 'Club-specific custom fields', dataType: 'object', sampleValue: 'Key-value pairs' },
              { id: 'notes', name: 'Notes', description: 'Admin notes about member', dataType: 'string', sampleValue: 'VIP member' },
              { id: 'tags', name: 'Tags', description: 'Member tags and labels', dataType: 'object', sampleValue: 'Array of tags' }
            ],
            description: 'Customizable member data'
          }
        ];

      case 'financial':
        return [
          {
            name: 'transaction',
            fields: [
              { id: 'amount', name: 'Amount', description: 'Transaction amount', dataType: 'number', required: true, sampleValue: '50.00' },
              { id: 'date', name: 'Date', description: 'Transaction date', dataType: 'date', required: true, sampleValue: '2024-01-15' },
              { id: 'description', name: 'Description', description: 'Transaction description', dataType: 'string', required: true, sampleValue: 'Monthly dues' },
              { id: 'status', name: 'Status', description: 'Payment status', dataType: 'string', sampleValue: 'completed' },
              { id: 'paymentMethod', name: 'Payment Method', description: 'How payment was made', dataType: 'string', sampleValue: 'Credit Card' }
            ],
            description: 'Transaction details'
          },
          {
            name: 'member',
            fields: [
              { id: 'memberDetails', name: 'Member Details', description: 'Associated member information', dataType: 'object', sampleValue: 'Member object' },
              { id: 'eventDetails', name: 'Event Details', description: 'Related event information', dataType: 'object', sampleValue: 'Event object' }
            ],
            description: 'Related member and event data'
          }
        ];

      case 'analytics':
        return [
          {
            name: 'engagement',
            fields: [
              { id: 'engagementScore', name: 'Engagement Scores', description: 'Member engagement metrics', dataType: 'object', premium: true, sampleValue: 'Score arrays' },
              { id: 'eventMetrics', name: 'Event Metrics', description: 'Event performance data', dataType: 'object', sampleValue: 'Metrics object' }
            ],
            description: 'Engagement analytics'
          },
          {
            name: 'growth',
            fields: [
              { id: 'growthData', name: 'Growth Data', description: 'Membership growth trends', dataType: 'object', sampleValue: 'Growth arrays' },
              { id: 'retentionData', name: 'Retention Data', description: 'Member retention analytics', dataType: 'object', premium: true, sampleValue: 'Retention metrics' }
            ],
            description: 'Growth and retention metrics'
          },
          {
            name: 'advanced',
            fields: [
              { id: 'comparisons', name: 'Period Comparisons', description: 'Compare different time periods', dataType: 'object', premium: true, sampleValue: 'Comparison data' },
              { id: 'predictions', name: 'Predictions', description: 'AI-powered predictions', dataType: 'object', premium: true, sampleValue: 'Prediction models' },
              { id: 'segmentation', name: 'Member Segmentation', description: 'Member behavior segments', dataType: 'object', premium: true, sampleValue: 'Segment data' }
            ],
            description: 'Advanced analytics features'
          }
        ];

      case 'event':
        return [
          {
            name: 'basic',
            fields: [
              { id: 'eventName', name: 'Event Name', description: 'Name of the event', dataType: 'string', required: true, sampleValue: 'Monthly Meetup' },
              { id: 'date', name: 'Date', description: 'Event date and time', dataType: 'date', required: true, sampleValue: '2024-01-15T19:00:00Z' },
              { id: 'location', name: 'Location', description: 'Event location', dataType: 'string', sampleValue: 'Community Center' },
              { id: 'description', name: 'Description', description: 'Event description', dataType: 'string', sampleValue: 'Monthly networking event' }
            ],
            description: 'Basic event information'
          },
          {
            name: 'attendance',
            fields: [
              { id: 'rsvpCount', name: 'RSVP Count', description: 'Number of RSVPs', dataType: 'number', sampleValue: '45' },
              { id: 'attendeeCount', name: 'Attendee Count', description: 'Actual attendance', dataType: 'number', sampleValue: '38' },
              { id: 'attendeeList', name: 'Attendee List', description: 'List of attendees', dataType: 'object', sampleValue: 'Array of members' }
            ],
            description: 'Attendance and RSVP data'
          },
          {
            name: 'metrics',
            fields: [
              { id: 'engagementMetrics', name: 'Engagement Metrics', description: 'Event engagement scores', dataType: 'object', premium: true, sampleValue: 'Engagement data' },
              { id: 'feedback', name: 'Feedback', description: 'Event feedback and ratings', dataType: 'object', sampleValue: 'Feedback array' }
            ],
            description: 'Event performance metrics'
          }
        ];

      default:
        return [];
    }
  };

  const fieldGroups = getFieldGroups();
  const _allFields = fieldGroups.flatMap(group => group.fields);

  const filteredGroups = fieldGroups.map(group => ({
    ...group,
    fields: group.fields.filter(field => 
      availableFields.includes(field.id) && 
      (searchTerm === '' || 
       field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       field.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(group => group.fields.length > 0);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleField = (fieldId: string) => {
    if (disabled) return;
    
    if (selectedFields.includes(fieldId)) {
      onChange(selectedFields.filter(id => id !== fieldId));
    } else {
      onChange([...selectedFields, fieldId]);
    }
  };

  const selectAll = () => {
    const availableFieldIds = filteredGroups
      .flatMap(group => group.fields)
      .map(field => field.id);
    onChange(availableFieldIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'bg-primary/20 text-primary';
      case 'number': return 'bg-success/20 text-success';
      case 'date': return 'bg-secondary/20 text-secondary';
      case 'boolean': return 'bg-warning/20 text-warning';
      case 'object': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Field Selection</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={disabled}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={disabled || selectedFields.length === 0}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        <CardDescription>
          Choose which fields to include in your export ({selectedFields.length} selected)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Field Groups */}
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <Collapsible
              key={group.name}
              open={expandedGroups.includes(group.name)}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                  disabled={disabled}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      expandedGroups.includes(group.name) ? 'transform rotate-180' : ''
                    }`} />
                    <span className="font-medium capitalize">{group.name} Fields</span>
                    <Badge variant="secondary">
                      {group.fields.length}
                    </Badge>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2 ml-6 space-y-2">
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {group.description}
                  </p>
                )}
                
                {group.fields.map((field) => (
                  <div
                    key={field.id}
                    className={`flex items-start space-x-3 p-2 rounded border ${
                      selectedFields.includes(field.id) ? 'bg-primary/5 border-primary/20' : 'border-border'
                    } ${disabled ? 'opacity-50' : 'hover:bg-muted/50'}`}
                  >
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      disabled={disabled}
                      className="mt-0.5"
                    />
                    
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={field.id}
                        className={`font-medium flex items-center gap-2 ${disabled ? '' : 'cursor-pointer'}`}
                      >
                        {field.name}
                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        {field.premium && <Badge variant="default" className="text-xs">Premium</Badge>}
                      </Label>
                      
                      <p className="text-sm text-muted-foreground">
                        {field.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getDataTypeColor(field.dataType)}`}>
                          {field.dataType}
                        </Badge>
                        {field.sampleValue && (
                          <span className="text-xs text-muted-foreground">
                            e.g., {field.sampleValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {selectedFields.length === 0 && (
          <div className="text-center p-6 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Select at least one field to enable export</p>
          </div>
        )}

        {disabled && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-md">
            <p className="text-sm text-warning-foreground">
              Field selection is disabled during export processing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}