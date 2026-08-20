'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { MessageSquare, Star, BarChart3, Send, Eye, Download, Users, TrendingUp, RefreshCw, Plus, X } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'scale' | 'nps';
  question: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
}

interface FeedbackSurvey {
  id: string;
  eventId: number;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  isActive: boolean;
  language: string;
  responseCount: number;
  avgRating: number;
  completionRate: number;
  createdAt: string;
  expiresAt?: string;
}

interface FeedbackResponse {
  id: string;
  surveyId: string;
  memberId?: number;
  memberName?: string;
  responses: Record<string, any>;
  completedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FeedbackAnalytics {
  totalResponses: number;
  completionRate: number;
  avgCompletionTime: number;
  satisfactionScore: number;
  npsScore: number;
  responsesByDay: Array<{ date: string; count: number }>;
  questionAnalytics: Record<string, {
    type: string;
    responseCount: number;
    avgValue?: number;
    distribution: Record<string, number>;
  }>;
}

interface EventFeedbackCollectorProps {
  eventId: number;
  clubId: number;
  memberId?: number;
  isAdmin?: boolean;
  className?: string;
}

const QUESTION_TYPES = [
  { value: 'rating', label: 'Star Rating', icon: Star },
  { value: 'text', label: 'Short Text', icon: MessageSquare },
  { value: 'textarea', label: 'Long Text', icon: MessageSquare },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: Users },
  { value: 'checkbox', label: 'Checkboxes', icon: Users },
  { value: 'scale', label: 'Scale (1-10)', icon: BarChart3 },
  { value: 'nps', label: 'NPS Score', icon: TrendingUp },
] as const;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

const DEFAULT_SURVEY_TEMPLATES = [
  {
    name: 'Post-Event Satisfaction',
    description: 'General satisfaction survey for events',
    questions: [
      {
        id: '1',
        type: 'rating' as const,
        question: 'How would you rate this event overall?',
        required: true,
      },
      {
        id: '2',
        type: 'textarea' as const,
        question: 'What did you like most about the event?',
        required: false,
        placeholder: 'Please share what you enjoyed...',
      },
      {
        id: '3',
        type: 'textarea' as const,
        question: 'How can we improve future events?',
        required: false,
        placeholder: 'Your suggestions...',
      },
      {
        id: '4',
        type: 'nps' as const,
        question: 'How likely are you to recommend our events to a friend?',
        required: true,
        minValue: 0,
        maxValue: 10,
      },
    ],
  },
  {
    name: 'Speaker Evaluation',
    description: 'Evaluate speakers and presentations',
    questions: [
      {
        id: '1',
        type: 'rating' as const,
        question: 'How would you rate the speaker\'s presentation?',
        required: true,
      },
      {
        id: '2',
        type: 'multiple_choice' as const,
        question: 'Which aspect was most valuable?',
        required: true,
        options: ['Content Quality', 'Delivery Style', 'Visual Aids', 'Q&A Session'],
      },
      {
        id: '3',
        type: 'scale' as const,
        question: 'How relevant was the content to your interests?',
        required: true,
        minValue: 1,
        maxValue: 10,
      },
    ],
  },
];

export function EventFeedbackCollector({ eventId, clubId, className }: EventFeedbackCollectorProps) {
  const [surveys, setSurveys] = useState<FeedbackSurvey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<FeedbackSurvey | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('surveys');
  const [newSurvey, setNewSurvey] = useState<Partial<FeedbackSurvey>>({});
  const [newQuestion, setNewQuestion] = useState<Partial<FeedbackQuestion>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const toast = useToast();

  const loadSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const surveyData = await eventService.getFeedbackSurveys(clubId, eventId);
      setSurveys(surveyData as unknown as FeedbackSurvey[]);
    } catch (err) {
      logger.error('events', 'Failed to load feedback surveys', { error: err, clubId, eventId });
      setError('Failed to load feedback surveys. Please try again.');
      toast.error('Failed to load feedback surveys');
    } finally {
      setLoading(false);
    }
  }, [clubId, eventId, toast]);

  const loadSurveyResponses = useCallback(async (surveyId: string) => {
    try {
      const responseData = await eventService.getFeedbackResponses(clubId, eventId, surveyId);
      setResponses(responseData as unknown as FeedbackResponse[]);
    } catch (err) {
      logger.error('events', 'Failed to load survey responses', { error: err, clubId, eventId, surveyId });
      toast.error('Failed to load survey responses');
    }
  }, [clubId, eventId, toast]);

  const loadAnalytics = useCallback(async (surveyId: string) => {
    try {
      const analyticsData = await eventService.getFeedbackAnalytics(clubId, eventId, surveyId);
      setAnalytics(analyticsData as unknown as FeedbackAnalytics);
    } catch (err) {
      logger.error('analytics', 'Failed to load feedback analytics', { error: err, clubId, eventId, surveyId });
      toast.error('Failed to load analytics data');
    }
  }, [clubId, eventId, toast]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const createSurvey = async () => {
    if (!newSurvey.title || !newSurvey.questions?.length) {
      toast.error('Please provide a title and at least one question');
      return;
    }

    try {
      setCreating(true);
      const survey = await eventService.createFeedbackSurvey(clubId, eventId, {
        ...newSurvey,
        language: selectedLanguage,
      } as any);
      
      setSurveys(prev => [survey as unknown as FeedbackSurvey, ...prev]);
      setNewSurvey({});
      setActiveTab('surveys');

      toast.success('Feedback survey created successfully');
    } catch (err) {
      logger.error('events', 'Failed to create feedback survey', { error: err, clubId, eventId, title: newSurvey.title, language: selectedLanguage });
      toast.error('Failed to create survey. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleSurveyStatus = async (survey: FeedbackSurvey) => {
    try {
      const updatedSurvey = await eventService.updateFeedbackSurvey(clubId, eventId, survey.id, {
        isActive: !survey.isActive,
      } as any);
      
      setSurveys(prev => prev.map(s => s.id === survey.id ? updatedSurvey as unknown as FeedbackSurvey : s));

      toast.success(`Survey is now ${survey.isActive ? 'inactive' : 'active'}`);
    } catch (err) {
      logger.error('events', 'Failed to update feedback survey status', { error: err, clubId, eventId, surveyId: survey.id, newStatus: !survey.isActive });
      toast.error('Failed to update survey status');
    }
  };

  const _deleteSurvey = async (survey: FeedbackSurvey) => {
    try {
      await eventService.deleteFeedbackSurvey(clubId, eventId, survey.id);
      setSurveys(prev => prev.filter(s => s.id !== survey.id));
      toast.success('Feedback survey deleted successfully');
    } catch (err) {
      logger.error('events', 'Failed to delete feedback survey', { error: err, clubId, eventId, surveyId: survey.id, surveyTitle: survey.title });
      toast.error('Failed to delete survey');
    }
  };

  const exportResponses = async (survey: FeedbackSurvey, format: 'csv' | 'xlsx' | 'json' = 'csv') => {
    try {
      const blob = await eventService.exportFeedbackData(clubId, eventId, survey.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-${survey.title.replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Feedback responses exported as ${format.toUpperCase()}`);
    } catch (err) {
      logger.error('events', 'Failed to export feedback responses', { error: err, clubId, eventId, surveyId: survey.id, format });
      toast.error('Failed to export feedback responses');
    }
  };

  const addQuestion = () => {
    if (!newQuestion.type || !newQuestion.question) {
      toast.error('Please provide question type and text');
      return;
    }

    const question: FeedbackQuestion = {
      id: Date.now().toString(),
      type: newQuestion.type as any,
      question: newQuestion.question,
      required: newQuestion.required || false,
      options: newQuestion.options,
      minValue: newQuestion.minValue,
      maxValue: newQuestion.maxValue,
      placeholder: newQuestion.placeholder,
    };

    setNewSurvey(prev => ({
      ...prev,
      questions: [...(prev.questions || []), question],
    }));
    
    setNewQuestion({});
  };

  const removeQuestion = (questionId: string) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionId) || [],
    }));
  };

  const applyTemplate = (template: typeof DEFAULT_SURVEY_TEMPLATES[0]) => {
    setNewSurvey({
      title: template.name,
      description: template.description,
      questions: template.questions.map(q => ({ ...q, id: Date.now().toString() + Math.random() })),
      isActive: true,
      language: selectedLanguage,
    });
  };

  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderQuestionInput = () => {
    switch (newQuestion.type) {
      case 'multiple_choice':
      case 'checkbox':
        return (
          <div>
            <Label>Options (one per line)</Label>
            <Textarea
              placeholder="Option 1\nOption 2\nOption 3"
              value={newQuestion.options?.join('\n') || ''}
              onChange={(e) => setNewQuestion(prev => ({
                ...prev,
                options: e.target.value.split('\n').filter(opt => opt.trim()),
              }))}
            />
          </div>
        );
      case 'scale':
      case 'nps':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Value</Label>
              <Input
                type="number"
                value={newQuestion.minValue || (newQuestion.type === 'nps' ? 0 : 1)}
                onChange={(e) => setNewQuestion(prev => ({
                  ...prev,
                  minValue: parseInt(e.target.value),
                }))}
              />
            </div>
            <div>
              <Label>Max Value</Label>
              <Input
                type="number"
                value={newQuestion.maxValue || (newQuestion.type === 'nps' ? 10 : 10)}
                onChange={(e) => setNewQuestion(prev => ({
                  ...prev,
                  maxValue: parseInt(e.target.value),
                }))}
              />
            </div>
          </div>
        );
      case 'text':
      case 'textarea':
        return (
          <div>
            <Label>Placeholder Text</Label>
            <Input
              placeholder="Enter placeholder text..."
              value={newQuestion.placeholder || ''}
              onChange={(e) => setNewQuestion(prev => ({
                ...prev,
                placeholder: e.target.value,
              }))}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Collector
        </CardTitle>
        <CardDescription>
          Create and manage feedback surveys for your event
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Input
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="survey-search"
                />
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Survey
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSurveys.map(survey => (
                  <Card key={survey.id} className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    !survey.isActive && 'opacity-50'
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{survey.title}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {survey.description}
                          </CardDescription>
                        </div>
                        <Badge variant={survey.isActive ? 'default' : 'secondary'}>
                          {survey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                        <div>Questions: {survey.questions.length}</div>
                        <div>Responses: {survey.responseCount}</div>
                        <div>Rating: {survey.avgRating.toFixed(1)}★</div>
                        <div>Completion: {survey.completionRate}%</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedSurvey(survey);
                            loadSurveyResponses(survey.id);
                            setActiveTab('responses');
                          }}
                          data-testid={`view-responses-${survey.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedSurvey(survey);
                            loadAnalytics(survey.id);
                            setActiveTab('analytics');
                          }}
                          data-testid={`view-analytics-${survey.id}`}
                        >
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => exportResponses(survey)}
                          data-testid={`export-${survey.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={survey.isActive ? 'secondary' : 'default'}
                          onClick={() => toggleSurveyStatus(survey)}
                          data-testid={`toggle-${survey.id}`}
                        >
                          {survey.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredSurveys.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Surveys Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No surveys match your search criteria.' : 'Create your first feedback survey to get started.'}
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Survey
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Survey Details</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="survey-title">Survey Title</Label>
                        <Input
                          id="survey-title"
                          placeholder="Enter survey title..."
                          value={newSurvey.title || ''}
                          onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                          data-testid="survey-title-input"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="survey-description">Description</Label>
                        <Textarea
                          id="survey-description"
                          placeholder="Describe the purpose of this survey..."
                          value={newSurvey.description || ''}
                          onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                          data-testid="survey-description-input"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="survey-language">Language</Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map(lang => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="survey-expires">Expiration Date (Optional)</Label>
                        <Input
                          id="survey-expires"
                          type="datetime-local"
                          value={newSurvey.expiresAt || ''}
                          onChange={(e) => setNewSurvey(prev => ({ ...prev, expiresAt: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Add Question</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select 
                          value={newQuestion.type || ''} 
                          onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPES.map(type => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="question-text">Question Text</Label>
                        <Input
                          id="question-text"
                          placeholder="Enter your question..."
                          value={newQuestion.question || ''}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                          data-testid="question-text-input"
                        />
                      </div>
                      
                      {renderQuestionInput()}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required-question"
                          checked={newQuestion.required || false}
                          onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, required: !!checked }))}
                        />
                        <Label htmlFor="required-question">Required question</Label>
                      </div>
                      
                      <Button onClick={addQuestion} data-testid="add-question-button">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Preview & Questions</h3>
                    <Card>
                      <CardHeader>
                        <CardTitle>{newSurvey.title || 'Survey Title'}</CardTitle>
                        <CardDescription>{newSurvey.description || 'Survey description will appear here'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {newSurvey.questions?.length ? (
                          <div className="space-y-4">
                            {newSurvey.questions.map((question, index) => (
                              <div key={question.id} className="p-3 border border-border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {index + 1}. {question.question}
                                      {question.required && <span className="text-destructive ml-1">*</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Type: {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeQuestion(question.id)}
                                    data-testid={`remove-question-${question.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {question.options && (
                                  <div className="text-xs text-muted-foreground">
                                    Options: {question.options.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No questions added yet. Add your first question to get started.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Templates</h3>
                    <div className="space-y-2">
                      {DEFAULT_SURVEY_TEMPLATES.map((template, index) => (
                        <Card key={template.name || `template-${index}`} className="cursor-pointer hover:bg-muted/50" onClick={() => applyTemplate(template)}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.questions.length} questions
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewSurvey({});
                    setNewQuestion({});
                    setActiveTab('surveys');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createSurvey} 
                  disabled={creating || !newSurvey.title || !newSurvey.questions?.length}
                  data-testid="create-survey-button"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Create Survey
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="mt-6">
            {selectedSurvey ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedSurvey.title}</h3>
                    <p className="text-muted-foreground">{responses.length} responses</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => exportResponses(selectedSurvey, 'csv')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button onClick={() => exportResponses(selectedSurvey, 'xlsx')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {responses.map((response, index) => (
                    <Card key={response.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Response #{index + 1}
                            {response.memberName && ` - ${response.memberName}`}
                          </CardTitle>
                          <span className="text-sm text-muted-foreground">
                            {new Date(response.completedAt).toLocaleString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="space-y-3">
                          {selectedSurvey.questions.map(question => {
                            const answer = response.responses[question.id];
                            if (answer === undefined || answer === null) return null;
                            
                            return (
                              <div key={question.id} className="text-sm">
                                <p className="font-medium mb-1">{question.question}</p>
                                <div className="text-muted-foreground">
                                  {question.type === 'rating' && (
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                          key={i}
                                          className={cn(
                                            'h-4 w-4',
                                            i < answer ? 'text-warning fill-current' : 'text-muted'
                                          )}
                                        />
                                      ))}
                                      <span className="ml-2">({answer}/5)</span>
                                    </div>
                                  )}
                                  {question.type === 'scale' && (
                                    <span>{answer}/{question.maxValue || 10}</span>
                                  )}
                                  {question.type === 'nps' && (
                                    <span>NPS Score: {answer}</span>
                                  )}
                                  {(question.type === 'text' || question.type === 'textarea') && (
                                    <span>{answer}</span>
                                  )}
                                  {question.type === 'multiple_choice' && (
                                    <span>{answer}</span>
                                  )}
                                  {question.type === 'checkbox' && (
                                    <span>{Array.isArray(answer) ? answer.join(', ') : answer}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {responses.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Responses Yet</h3>
                    <p className="text-muted-foreground">
                      Responses will appear here once people start filling out the survey.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Survey</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a survey from the surveys tab to view its responses.
                </p>
                <Button onClick={() => setActiveTab('surveys')}>
                  View Surveys
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {selectedSurvey && analytics ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedSurvey.title}</h3>
                    <p className="text-muted-foreground">Analytics Overview</p>
                  </div>
                  <Button onClick={() => loadAnalytics(selectedSurvey.id)} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Responses</p>
                          <p className="text-2xl font-bold">{analytics.totalResponses}</p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                        </div>
                        <Progress value={analytics.completionRate} className="h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                          <p className="text-2xl font-bold">{analytics.satisfactionScore.toFixed(1)}</p>
                        </div>
                        <Star className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">NPS Score</p>
                          <p className="text-2xl font-bold">{analytics.npsScore}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Question Analytics</CardTitle>
                    <CardDescription>Response breakdown by question</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {selectedSurvey.questions.map(question => {
                        const questionStats = analytics.questionAnalytics[question.id];
                        if (!questionStats) return null;
                        
                        return (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{question.question}</h4>
                              <Badge variant="outline">
                                {questionStats.responseCount} responses
                              </Badge>
                            </div>
                            
                            {question.type === 'rating' && questionStats.avgValue && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-muted-foreground">Average:</span>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          'h-4 w-4',
                                          i < questionStats.avgValue! ? 'text-warning fill-current' : 'text-muted'
                                        )}
                                      />
                                    ))}
                                    <span className="ml-2">({questionStats.avgValue.toFixed(1)}/5)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {(question.type === 'scale' || question.type === 'nps') && questionStats.avgValue && (
                              <div>
                                <span className="text-sm text-muted-foreground">Average: </span>
                                <span className="font-medium">
                                  {questionStats.avgValue.toFixed(1)}/{question.maxValue || 10}
                                </span>
                              </div>
                            )}
                            
                            {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
                              <div className="space-y-2">
                                {Object.entries(questionStats.distribution).map(([option, count]) => (
                                  <div key={option} className="flex items-center justify-between">
                                    <span className="text-sm">{option}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary transition-all"
                                          style={{ 
                                            width: `${(count / questionStats.responseCount) * 100}%` 
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm text-muted-foreground min-w-12">
                                        {count} ({Math.round((count / questionStats.responseCount) * 100)}%)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <Separator />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedSurvey 
                    ? 'Analytics will be available once the survey receives responses.' 
                    : 'Select a survey from the surveys tab to view analytics.'}
                </p>
                {!selectedSurvey && (
                  <Button onClick={() => setActiveTab('surveys')}>
                    View Surveys
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
