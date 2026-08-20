"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PAYMENT_PROCESSOR_COPY, PLATFORM_FEE_COPY, formatPricingFaqAnswer } from "@/lib/pricing";

const faqs = [
  {
    question: "What is the best club management software?",
    answer: "GatherGrove helps clubs manage members, dues, events, and messages in one app. It also includes mobile apps for iOS and Android."
  },
  {
    question: "How much does GatherGrove cost?",
    answer: `${formatPricingFaqAnswer()} No setup fees or long-term contracts.`
  },
  {
    question: "What types of organizations can use GatherGrove?",
    answer: "GatherGrove is designed for recreational clubs, professional associations, nonprofits, community groups, alumni associations, hobby clubs, sports leagues, book clubs, running clubs, and any small to medium-sized membership organization that needs to manage members, events, and payments."
  },
  {
    question: "Does GatherGrove replace spreadsheets for club management?",
    answer: "Yes. GatherGrove replaces spreadsheets, payment tools, and email tools. It helps collect dues with Stripe, send email, plan events, track RSVPs, and view reports."
  },
  {
    question: "Is there a mobile app for club members?",
    answer: "Yes, GatherGrove includes native mobile apps for iOS and Android on all paid plans. Members can view events, RSVP, pay dues, access the member directory, use digital membership cards, and receive push notifications directly on their mobile devices."
  },
  {
    question: "How does payment processing work?",
    answer: `GatherGrove integrates with Stripe for secure payment processing. Administrators can set up automated dues collection with customizable payment schedules and reminder emails. Members can pay online via credit card, debit card, or bank transfer. The platform handles PCI compliance and security. ${PLATFORM_FEE_COPY}. ${PAYMENT_PROCESSOR_COPY}.`
  },
  {
    question: "Can I import my existing member data?",
    answer: "Yes, GatherGrove provides data import tools to migrate from spreadsheets or other management systems. You can import member contact information, membership status, payment history, and custom field data via CSV upload."
  },
  {
    question: "What communication features are included?",
    answer: "GatherGrove includes email templates, push notifications, community chat, event invites, RSVP tracking, and payment reminders. Messages are logged for your records."
  },
  {
    question: "Is my club data secure and private?",
    answer: "Yes. All data is encrypted in transit and at rest, hosted on secure cloud infrastructure, and regularly backed up. Members control their privacy settings and choose what information to share. Administrators have granular access controls."
  },
  {
    question: "How long does setup take?",
    answer: "Most organizations are up and running within 5 minutes. The setup process includes creating your organization profile, importing member data (optional), configuring membership types and dues, and inviting members to join."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your GatherGrove subscription at any time with no penalties or cancellation fees. Your data remains accessible for 90 days after cancellation, allowing you to export member information and organization records. You can also cancel during your 30-day free trial at no charge."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Fallback for cases where Framer Motion might not work
  const isOpen = (index: number) => openIndex === index;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Common questions about GatherGrove's membership and event management platform, features, pricing, and implementation. Find detailed answers to help you understand how our solution can benefit your organization.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
    <div key={`faq-${index}-${faq.question.substring(0, 30)}`} className="bg-card rounded-lg border border-border shadow-sm">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-expanded={isOpen(index)}
                  aria-controls={`faq-answer-${index}`}
                  type="button"
                >
                  <h3 className="text-lg font-semibold pr-8" id={`faq-question-${index}`}>{faq.question}</h3>
                  {isOpen(index) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200" />
                  )}
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.04, 0.62, 0.23, 0.98] 
                      }}
                      className="overflow-hidden"
                      style={{ originY: 0 }}
                    >
                      <motion.div
                        className="px-6 pb-4"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        id={`faq-answer-${index}`}
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                        data-ai-answer="true"
                      >
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Contact section */}
  <div className="mt-12 text-center bg-card rounded-lg p-8 border border-border">
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you find the right membership management solution. Get personalized answers about implementing GatherGrove for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
