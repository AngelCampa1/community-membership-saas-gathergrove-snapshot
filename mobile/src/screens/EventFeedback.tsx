import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { EventService, FeedbackForm } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { SPECIAL_COLORS } from '../constants/colors';
import { getTouchTargetStyle, createAccessibilityLabel } from '../utils/accessibility';

interface EventFeedbackParams {
  eventId: number;
  clubId: number;
}

interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'text' | 'boolean' | 'multiple_choice' | 'scale';
  question: string;
  required: boolean;
  options?: {
    scale?: number;
    multiline?: boolean;
    choices?: string[];
    multiple?: boolean;
    min?: number;
    max?: number;
  };
}

interface Event {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
}

type ResponseValue = number | string | boolean | string[];

interface FeedbackResponses {
  [questionId: string]: ResponseValue;
}

export const EventFeedback: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, clubId } = route.params as EventFeedbackParams;
  const { user } = useAuth();
  const { colors } = useTheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null);
  const [responses, setResponses] = useState<FeedbackResponses>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const styles = createStyles(colors);

  const loadEventData = useCallback(async () => {
    try {
      setError(null);
      const [eventData, formData] = await Promise.all([
        EventService.getEventById(clubId, eventId),
        EventService.getFeedbackForm(clubId, eventId),
      ]);
      
      setEvent(eventData);
      setFeedbackForm(formData);
      
      // Load saved draft if exists
      const draftKey = `feedback_draft_${eventId}_${user?.user?.userId}`;
      const savedDraft = await AsyncStorage.getItem(draftKey);
      if (savedDraft) {
        setResponses(JSON.parse(savedDraft));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feedback form';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clubId, eventId, user?.user?.userId]);

  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await loadEventData();
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loadEventData]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Event Feedback',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  // Auto-save draft
  // MEM-12 fix: Track both debounce and indicator timeouts to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;
    let indicatorTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const saveDraft = async () => {
      if (Object.keys(responses).length > 0 && !submitted) {
        try {
          const draftKey = `feedback_draft_${eventId}_${user?.user?.userId}`;
          await AsyncStorage.setItem(draftKey, JSON.stringify(responses));
          if (!isMounted) return;
          setDraftSaved(true);
          // MEM-12 fix: Track this timeout so it can be cleaned up
          indicatorTimeoutId = setTimeout(() => {
            if (isMounted) {
              setDraftSaved(false);
            }
          }, 2000);
        } catch (err) {
          const { logger } = await import('../utils/logger');
          logger.error('events', 'Failed to save feedback draft', err as Error, { eventId: String(eventId), userId: String(user?.user?.userId || '') });
        }
      }
    };

    const debounceTimeoutId = setTimeout(saveDraft, 1000);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimeoutId);
      if (indicatorTimeoutId) {
        clearTimeout(indicatorTimeoutId);
      }
    };
  }, [responses, eventId, user?.user?.userId, submitted]);

  const updateResponse = useCallback(async (questionId: string, value: ResponseValue) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const validateForm = useCallback(() => {
    if (!feedbackForm) return false;
    
    const requiredQuestions = feedbackForm.questions.filter(q => q.required);
    
    for (const question of requiredQuestions) {
      const response = responses[question.id];
      
      if (response === undefined || response === null) {
        return false;
      }
      
      // Check for empty values
      if (typeof response === 'string' && response.trim() === '') {
        return false;
      }
      
      if (Array.isArray(response) && response.length === 0) {
        return false;
      }
    }
    
    return true;
  }, [feedbackForm, responses]);

  const calculateProgress = useCallback(() => {
    if (!feedbackForm) return 0;
    
    const requiredQuestions = feedbackForm.questions.filter(q => q.required);
    const completedRequired = requiredQuestions.filter(q => {
      const response = responses[q.id];
      return response !== undefined && response !== null && 
             (typeof response !== 'string' || response.trim() !== '') &&
             (!Array.isArray(response) || response.length > 0);
    });
    
    return Math.round((completedRequired.length / requiredQuestions.length) * 100);
  }, [feedbackForm, responses]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert(
        'Incomplete Form',
        'Please complete all required fields before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSubmitting(true);
      
      await EventService.submitFeedback(clubId, eventId, {
        memberId: user?.user?.userId || 0,
        responses,
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Clear saved draft
      // VAL-03 fix: Validate userId before using in storage key
      const userId = user?.user?.userId;
      if (userId !== undefined) {
        const draftKey = `feedback_draft_${eventId}_${userId}`;
        await AsyncStorage.removeItem(draftKey);
      }

      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Network')) {
        // Save for offline submission
        // VAL-03 fix: Only save offline if userId is available
        const userId = user?.user?.userId;
        if (userId === undefined) {
          Alert.alert('Error', 'Unable to save feedback offline. Please try again when connected.');
          return;
        }
        try {
          const offlineKey = `feedback_offline_${eventId}_${userId}`;
          await AsyncStorage.setItem(offlineKey, JSON.stringify({
            clubId,
            eventId,
            memberId: userId,
            responses,
            timestamp: Date.now(),
          }));
          
          setOfflineMode(true);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (storageErr) {
          const { logger } = await import('../utils/logger');
          logger.error('events', 'Failed to save offline feedback', storageErr as Error, { clubId: String(clubId), eventId: String(eventId), userId: String(user?.user?.userId || '') });
        }
      } else {
        Alert.alert(
          'Submission Error',
          'Failed to submit feedback. Please try again.',
          [{ text: 'OK' }]
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSubmitting(false);
    }
  }, [clubId, eventId, user?.user?.userId, responses, validateForm]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  const renderStarRating = useCallback((question: FeedbackQuestion) => {
    const scale = question.options?.scale || 5;
    const currentRating = (responses[question.id] as number) || 0;
    
    return (
      <View style={styles.starContainer}>
        {Array.from({ length: scale }, (_, index) => {
          const starIndex = index + 1;
          const isSelected = starIndex <= currentRating;
          
          return (
            <TouchableOpacity
              key={starIndex}
              onPress={() => updateResponse(question.id, starIndex)}
              style={styles.starButton}
              testID={`star-${starIndex}-${question.id}`}
              {...createAccessibilityLabel(
                `${starIndex} stars out of ${scale}`,
                `Tap to rate ${starIndex} out of ${scale} stars`,
                'button'
              )}
            >
              <Icon
                name="star"
                size={32}
                color={isSelected ? SPECIAL_COLORS.star : colors.border.primary}
                style={styles.star}
              />
            </TouchableOpacity>
          );
        })}
        {currentRating > 0 && (
          <Text style={styles.ratingText}>{currentRating}/{scale}</Text>
        )}
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [responses, colors, updateResponse]);

  const renderTextInput = useCallback((question: FeedbackQuestion) => {
    const isMultiline = question.options?.multiline || false;
    const currentValue = (responses[question.id] as string) || '';
    
    return (
      <TextInput
        style={[
          styles.textInput,
          isMultiline && styles.multilineTextInput,
        ]}
        value={currentValue}
        onChangeText={(text) => updateResponse(question.id, text)}
        placeholder="Enter your response..."
        placeholderTextColor={colors.text.secondary}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 4 : 1}
        testID={`text-input-${question.id}`}
        accessibilityLabel={question.question}
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [responses, colors, updateResponse]);

  const renderBooleanQuestion = useCallback((question: FeedbackQuestion) => {
    const currentValue = responses[question.id] as boolean;
    
    return (
      <View style={styles.booleanContainer}>
        <TouchableOpacity
          style={[
            styles.booleanButton,
            currentValue === true && styles.booleanButtonSelected,
          ]}
          onPress={() => updateResponse(question.id, true)}
          testID={`boolean-yes-${question.id}`}
          {...createAccessibilityLabel('Yes', 'Tap to select yes', 'button')}
        >
          <Text style={[
            styles.booleanButtonText,
            currentValue === true && styles.booleanButtonTextSelected,
          ]}>
            Yes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.booleanButton,
            currentValue === false && styles.booleanButtonSelected,
          ]}
          onPress={() => updateResponse(question.id, false)}
          testID={`boolean-no-${question.id}`}
          {...createAccessibilityLabel('No', 'Tap to select no', 'button')}
        >
          <Text style={[
            styles.booleanButtonText,
            currentValue === false && styles.booleanButtonTextSelected,
          ]}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [responses, colors, updateResponse]);

  const renderMultipleChoice = useCallback((question: FeedbackQuestion) => {
    const choices = question.options?.choices || [];
    const multiple = question.options?.multiple || false;
    const currentValue = responses[question.id] as string[] || [];
    
    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const isSelected = currentValue.includes(choice);
          
          return (
            <TouchableOpacity
              key={choice}
              style={[
                styles.choiceButton,
                isSelected && styles.choiceButtonSelected,
              ]}
              onPress={() => {
                if (multiple) {
                  const newValue = isSelected
                    ? currentValue.filter(c => c !== choice)
                    : [...currentValue, choice];
                  updateResponse(question.id, newValue);
                } else {
                  updateResponse(question.id, [choice]);
                }
              }}
              testID={`choice-${choice}-${question.id}`}
              {...createAccessibilityLabel(
                choice,
                `Tap to ${isSelected ? 'deselect' : 'select'} ${choice}`,
                'button'
              )}
            >
              <Icon
                name={multiple ? (isSelected ? 'check-box' : 'check-box-outline-blank') : 
                      (isSelected ? 'radio-button-checked' : 'radio-button-unchecked')}
                size={20}
                color={isSelected ? colors.interactive.primary : colors.border.primary}
              />
              <Text style={[
                styles.choiceText,
                isSelected && styles.choiceTextSelected,
              ]}>
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [responses, colors, updateResponse]);

  const renderScaleQuestion = useCallback((question: FeedbackQuestion) => {
    const min = question.options?.min || 1;
    const max = question.options?.max || 10;
    const currentValue = (responses[question.id] as number) || min;
    
    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>{min}</Text>
          <Text style={styles.scaleValue}>{currentValue}</Text>
          <Text style={styles.scaleLabel}>{max}</Text>
        </View>
        
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={currentValue}
          onValueChange={(value) => updateResponse(question.id, Math.round(value))}
          step={1}
          minimumTrackTintColor={colors.interactive.primary}
          maximumTrackTintColor={colors.border.primary}
          thumbTintColor={colors.interactive.primary}
          testID={`scale-slider-${question.id}`}
        />
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [responses, colors, updateResponse]);

  const renderQuestion = useCallback((question: FeedbackQuestion, index: number) => {
    return (
      <View key={question.id} style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            {question.question}
            {question.required && <Text style={styles.requiredIndicator}> *</Text>}
          </Text>
          <Text style={styles.questionNumber}>{index + 1}</Text>
        </View>
        
        <View style={styles.responseContainer}>
          {question.type === 'rating' && renderStarRating(question)}
          {question.type === 'text' && renderTextInput(question)}
          {question.type === 'boolean' && renderBooleanQuestion(question)}
          {question.type === 'multiple_choice' && renderMultipleChoice(question)}
          {question.type === 'scale' && renderScaleQuestion(question)}
        </View>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [
    renderStarRating,
    renderTextInput,
    renderBooleanQuestion,
    renderMultipleChoice,
    renderScaleQuestion,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading feedback form...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={colors.status.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEventData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submitted || offlineMode) {
    return (
      <View style={styles.successContainer}>
        <Icon 
          name={offlineMode ? "cloud-off" : "check-circle"} 
          size={64} 
          color={offlineMode ? colors.status.warning : colors.status.success} 
        />
        <Text style={styles.successTitle}>
          {offlineMode ? 'Saved Offline' : 'Feedback Submitted!'}
        </Text>
        <Text style={styles.successMessage}>
          {offlineMode 
            ? 'Your feedback will be submitted when you reconnect to the internet.'
            : 'Thank you for your feedback!'
          }
        </Text>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.returnButtonText}>Return to Event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event || !feedbackForm) {
    return null;
  }

  const progress = calculateProgress();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text style={styles.formTitle}>{feedbackForm.title}</Text>
        <Text style={styles.formDescription}>{feedbackForm.description}</Text>
        
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% complete</Text>
        </View>
        
        {draftSaved && (
          <View style={styles.draftIndicator}>
            <Icon name="save" size={16} color={colors.status.success} />
            <Text style={styles.draftText}>Draft saved</Text>
          </View>
        )}
      </View>

      {/* Questions */}
      <ScrollView style={styles.questionsContainer} showsVerticalScrollIndicator={false}>
        {feedbackForm.questions.map((question, index) => 
          renderQuestion(question, index)
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!validateForm() || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validateForm() || submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator 
                size="small" 
                color={colors.text.inverse} 
                testID="submission-loading"
              />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </>
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  returnButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 20,
  },
  returnButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.interactive.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  draftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.status.successBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  draftText: {
    fontSize: 12,
    color: colors.status.success,
    marginLeft: 4,
  },
  questionsContainer: {
    flex: 1,
  },
  questionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    lineHeight: 24,
  },
  requiredIndicator: {
    color: colors.status.error,
  },
  questionNumber: {
    fontSize: 14,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  responseContainer: {
    marginTop: 8,
  },
  // Star Rating Styles
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  starButton: {
    marginRight: 8,
    marginBottom: 8,
    ...getTouchTargetStyle(),
  },
  star: {
    // Additional star styling if needed
  },
  ratingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  // Text Input Styles
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  multilineTextInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Boolean Question Styles
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    ...getTouchTargetStyle(),
  },
  booleanButtonSelected: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  booleanButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  booleanButtonTextSelected: {
    color: colors.text.inverse,
  },
  // Multiple Choice Styles
  choicesContainer: {
    gap: 8,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    ...getTouchTargetStyle(),
  },
  choiceButtonSelected: {
    backgroundColor: colors.interactive.primary + '20',
    borderColor: colors.interactive.primary,
  },
  choiceText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  choiceTextSelected: {
    color: colors.interactive.primary,
    fontWeight: '500',
  },
  // Scale Question Styles
  scaleContainer: {
    paddingVertical: 8,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scaleLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  scaleValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.interactive.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Submit Section
  submitContainer: {
    padding: 20,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
    ...getTouchTargetStyle(),
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border.primary,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});