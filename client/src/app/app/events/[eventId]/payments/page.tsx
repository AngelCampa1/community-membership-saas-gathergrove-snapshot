'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EventPaymentManagement } from '@/components/events/EventPaymentManagement';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { eventService } from '@/services/eventService';
import { EventResponse } from '@/types/event';
import { logger } from '@/lib/logger';

export default function EventPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const clubId = Number(params?.clubId) || user?.clubId || 0;
  const eventId = Number(params?.eventId);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clubId && eventId) {
      fetchEvent();
    }
  }, [clubId, eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(clubId, eventId);
      setEvent(data);
    } catch (error) {
      logger.error('events', 'Error fetching event for payments page', { error, clubId, eventId });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/app/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center p-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">
            {event?.name || 'Event'} - Payment Management
          </h1>
          <p className="text-muted-foreground">
            View and manage event payments, issue refunds, and record manual payments
          </p>
        </div>
      </div>

      {/* Payment Management Component */}
      <EventPaymentManagement />
    </div>
  );
}

