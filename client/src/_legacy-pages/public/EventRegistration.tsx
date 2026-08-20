import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { PublicEventResponse } from '@/types/event';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';

interface RegistrationFormData {
  name: string;
  email: string;
  isMember: boolean;
}

const EventRegistration: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<PublicEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    isMember: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!token) {
        setError('Invalid link - no event token provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const eventData = await eventService.getPublicEventByToken(token);
        setEvent(eventData);
        setError(null);
      } catch (err: any) {
        logger.error('events', 'Error loading public event by token', { error: err, token });

        // Handle different error types
        if (err.message?.toLowerCase().includes('expired')) {
          setError('This payment link has expired. Please contact the event organizer for a new link.');
        } else if (err.message?.toLowerCase().includes('not found')) {
          setError('Event not found. The link may be invalid or the event may have been cancelled.');
        } else {
          setError('Something went wrong loading this event. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [token]);

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePrice = (): number => {
    if (event?.isFree) return 0;
    return formData.isMember ? (event?.memberPrice || 0) : (event?.nonMemberPrice || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // TODO: Integrate with payment processing
    // This will be implemented when payment provider integration is ready

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            data-testid="loading-spinner"
          />
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const eventDate = new Date(event.eventDateTime);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');

  return (
    <div
      className="min-h-screen bg-muted/50 py-8 px-4"
      data-testid="event-registration-container"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{event.name}</CardTitle>
            <CardDescription className="text-base mt-2">
              {event.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              <span>{event.location}</span>
            </div>

            <Separator className="my-4" />

            {/* Pricing Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </div>
              {event.isFree ? (
                <p className="text-lg font-bold text-success">Free Event</p>
              ) : (
                <div className="space-y-1 ml-7">
                  {event.memberPrice !== null && event.memberPrice !== undefined && (
                    <p className="text-foreground">
                      Member: <span className="font-semibold">${event.memberPrice.toFixed(2)}</span>
                    </p>
                  )}
                  {event.nonMemberPrice !== null && event.nonMemberPrice !== undefined && (
                    <p className="text-foreground">
                      Non-Member: <span className="font-semibold">${event.nonMemberPrice.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Register for this Event</CardTitle>
            <CardDescription>
              Please fill out your information to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="john.doe@example.com"
                />
              </div>

              {/* Member Status */}
              {!event.isFree && event.memberPrice !== event.nonMemberPrice && (
                <div className="space-y-2">
                  <Label>Are you a member? *</Label>
                  <RadioGroup
                    value={formData.isMember ? 'member' : 'non-member'}
                    onValueChange={(value) => handleInputChange('isMember', value === 'member')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="member" id="member" />
                      <Label htmlFor="member" className="font-normal">
                        Yes, I am a member (${event.memberPrice?.toFixed(2)})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-member" id="non-member" />
                      <Label htmlFor="non-member" className="font-normal">
                        No, I am not a member (${event.nonMemberPrice?.toFixed(2)})
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Separator className="my-4" />

              {/* Payment Summary */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registration Type:</span>
                  <span className="font-semibold">
                    {event.isFree ? 'Free' : formData.isMember ? 'Member' : 'Non-Member'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">
                    {event.isFree ? 'Free' : `$${calculatePrice().toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Payment Integration Placeholder */}
              {!event.isFree && (
                <div className="space-y-2">
                  <Label>Payment</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center"
                    data-testid="stripe-payment-element"
                  >
                    <p className="text-muted-foreground">
                      Payment integration will be displayed here
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : event.isFree ? 'Register' : 'Pay and Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventRegistration;