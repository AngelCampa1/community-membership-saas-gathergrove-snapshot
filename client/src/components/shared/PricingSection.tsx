"use client";

import Link from"next/link";
import { useState } from"react";
import { buttonVariants } from"@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from"@/components/ui/card";
import { cn } from"@/lib/utils";
import { Check, TrendingUp, Shield, Lock, X } from"lucide-react";
import { motion } from"framer-motion";
import { useEffect } from"react";
import { useGoogleAnalytics } from"@/hooks/useGoogleAnalytics";
import { calculatePlanAnnualSavings, getPricingPlan } from"@/lib/pricing";

const seedPlan = getPricingPlan('seed');
const growPlan = getPricingPlan('grow');
const expandPlan = getPricingPlan('unlimited');

const plans = [
  {
    name:"Seed",
    price: seedPlan.monthlyPrice,
    billingCycle:"monthly",
    badge:"",
    description:"Start your club with the basics.",
    memberLimit: seedPlan.memberLimit,
    features: ["Up to 100 members","Up to 2 admin users","1,000 emails/month","Events & Stripe payments","Member directory & profiles","Basic reporting & analytics","5 custom member fields","30-day free trial included",
    ],
    missingFeatures: [],
    popular: false,
    recommended: false,
    highlight: false,
  },
  {
    name:"Seed",
    price: seedPlan.annualPrice,
    billingCycle:"annual",
    badge: `Save ${calculatePlanAnnualSavings(seedPlan)}%`,
    description:"Start your club and save with annual billing.",
    memberLimit: seedPlan.memberLimit,
    savings: calculatePlanAnnualSavings(seedPlan),
    features: ["Up to 100 members","Up to 2 admin users","1,000 emails/month","Events & Stripe payments","Member directory & profiles","Basic reporting & analytics","5 custom member fields","30-day free trial included",
    ],
    missingFeatures: [],
    popular: false,
    recommended: false,
    highlight: false,
  },
  {
    name:"Grow",
    price: growPlan.monthlyPrice,
    billingCycle:"monthly",
    badge:"",
    description:"Give a growing club more room.",
    memberLimit: growPlan.memberLimit,
    features: ["Up to 200 members","Up to 3 admin users","3,000 emails/month","Community chat feature","Mobile app access (iOS & Android)","Push notifications","Digital membership cards","Custom member fields (up to 10)","Member privacy controls","Advanced analytics & reporting","Priority support","No additional payment processing fees","30-day free trial included"
    ],
    missingFeatures: [],
    popular: false,
    recommended: false
  },
  {
    name:"Grow",
    price: growPlan.annualPrice,
    billingCycle:"annual",
    badge: `Save ${calculatePlanAnnualSavings(growPlan)}%`,
    description:"Give a growing club more room and save.",
    memberLimit: growPlan.memberLimit,
    savings: calculatePlanAnnualSavings(growPlan),
    features: ["Up to 200 members","Up to 3 admin users","3,000 emails/month","Community chat feature","Mobile app access (iOS & Android)","Push notifications","Digital membership cards","Custom member fields (up to 10)","Member privacy controls","Advanced analytics & reporting","Priority support","No additional payment processing fees","30-day free trial included"
    ],
    missingFeatures: [],
    popular: false,
    recommended: true
  },
  {
    name:"Expand",
    price: expandPlan.monthlyPrice,
    billingCycle:"monthly",
    badge:"More Room",
    description:"Grow a large club without extra admin limits.",
    memberLimit: expandPlan.memberLimit,
    features: ["Up to 2,000 members","Unlimited admin users","50,000 emails/month","Unlimited events & RSVPs","Unlimited custom member fields","Advanced automation features","Custom integrations & API access","White-label options","Custom reporting & analytics","No additional payment processing fees","30-day free trial included"
    ],
    missingFeatures: [],
    popular: false,
    recommended: false,
    highlight: true
  },
  {
    name:"Expand",
    price: expandPlan.annualPrice,
    billingCycle:"annual",
    badge: `Save ${calculatePlanAnnualSavings(expandPlan)}%`,
    description:"Grow a large club and save with annual billing.",
    memberLimit: expandPlan.memberLimit,
    savings: calculatePlanAnnualSavings(expandPlan),
    enterprise: true,
    features: ["Up to 2,000 members","Unlimited admin users","50,000 emails/month","Unlimited events & RSVPs","Unlimited custom member fields","Advanced automation features","Custom integrations & API access","White-label options","Custom reporting & analytics","No additional payment processing fees","SLA guarantees","Premium support","30-day free trial included"
    ],
    missingFeatures: [],
    popular: false,
    recommended: false,
    highlight: false
  }
];

// Removed competitor fee comparisons - focusing on operational value instead


export function PricingSection() {
  const [memberCount] = useState([100]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const { trackFunnel, trackPricingInteraction } = useGoogleAnalytics();

  const [billingFrequency, setBillingFrequency] = useState<'monthly' |'annual'>('monthly');

  // Filter plans based on selected billing frequency
  const filteredPlans = plans.filter(plan => plan.billingCycle === billingFrequency);

  // Track pricing section view when it mounts
  useEffect(() => {
    trackFunnel('PRICING_VIEW', { section:'pricing' });
  }, [trackFunnel]);

  const calculatePerMemberCost = (planPrice: number, members: number) => {
    if (members === 0 || planPrice === 0) return"0";
    return Math.ceil(planPrice / members).toLocaleString();
  };

  // Removed misleading fee comparison calculations
  // Focus is now on operational efficiency value

  const comparisonRows: { feature: string; seed: string; grow: string; unlimited: string }[] = [
    { feature:"Members", seed:"Up to 100", grow:"Up to 200", unlimited:"Up to 2,000" },
    { feature:"Admin users", seed:"Up to 2", grow:"Up to 3", unlimited:"Unlimited" },
    { feature:"Email/month", seed:"1,000", grow:"3,000", unlimited:"50,000" },
    { feature:"Events & RSVPs", seed:"Included", grow:"Included", unlimited:"Unlimited" },
    { feature:"File storage", seed:"Standard", grow:"Standard", unlimited:"Standard" },
    { feature:"Custom fields", seed:"Up to 5", grow:"Up to 10", unlimited:"Unlimited" },
    { feature:"Community chat", seed:"-", grow:"check", unlimited:"check" },
    { feature:"Mobile app", seed:"-", grow:"check", unlimited:"check" },
    { feature:"Analytics", seed:"Basic", grow:"check", unlimited:"Advanced" },
    { feature:"API access", seed:"-", grow:"x", unlimited:"check" },
    { feature:"White-label", seed:"-", grow:"x", unlimited:"check" },
    { feature:"SLA guarantee", seed:"-", grow:"x", unlimited:"check" },
  ];

  const renderCell = (value: string) => {
    if (value ==="check") return <><Check className="w-4 h-4 text-success mx-auto" aria-hidden="true" /><span className="sr-only">Included</span></>;
    if (value ==="x") return <><X className="w-4 h-4 text-muted-foreground mx-auto" aria-hidden="true" /><span className="sr-only">Not included</span></>;
    return <span>{value}</span>;
  };

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Simple pricing that fits your club
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pick the plan that fits. All plans include a 30-day free trial. Credit card required.
          </p>

          {/* Billing Frequency Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-sm font-medium" id="billing-monthly-label">Pay Monthly</span>
            <button
              role="switch"
              aria-checked={billingFrequency ==='annual'}
              aria-labelledby="billing-monthly-label billing-annual-label"
              className="relative inline-flex items-center justify-between w-16 h-8 bg-muted rounded-full cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => {
                const newFreq = billingFrequency ==='monthly' ?'annual' :'monthly';
                setBillingFrequency(newFreq);
                trackPricingInteraction('billing_frequency_toggle', newFreq);
              }}
              onKeyDown={(e) => {
                if (e.key ==='' || e.key ==='Enter') {
                  e.preventDefault();
                  const newFreq = billingFrequency ==='monthly' ?'annual' :'monthly';
                  setBillingFrequency(newFreq);
                  trackPricingInteraction('billing_frequency_toggle', newFreq);
                }
              }}
            >
              <div
                className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  billingFrequency ==='annual' ?'transform translate-x-8' :''
                }`}
              />
            </button>
            <span className="text-sm font-medium" id="billing-annual-label">Pay Annually</span>
            {billingFrequency ==='annual' && (
              <span className="text-xs bg-success/10  text-success  px-2 py-1 rounded-full">
                Save up to {calculatePlanAnnualSavings(growPlan)}%
              </span>
            )}
          </div>


          <div className="inline-flex items-center gap-6 text-sm font-medium text-primary  bg-primary/10  px-6 py-3 rounded-full">
            <span>✅ No contracts</span>
            <span>✅ Cancel anytime</span>
            <span>✅ Export your data</span>
          </div>
        </div>


        {/* Pricing Tiers */}
        <div className={`grid gap-8 mx-auto mb-12 ${
          filteredPlans.length === 2 ?'md:grid-cols-2 max-w-4xl' :
          filteredPlans.length === 3 ?'lg:grid-cols-3 max-w-6xl' :'lg:grid-cols-4 max-w-7xl'
        }`}>
          {filteredPlans.map((plan, index) => (
            <motion.div
              key={plan.name || `plan-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative"
            >
              <Card className={`relative h-full transition-all duration-300 glass border-border/40 hover:glass-strong hover:border-border/60 ${
                plan.popular
                  ?'ring-2 ring-primary/30 shadow-2xl glass-strong border-primary/40'
                  : plan.highlight
                    ?'border-success/50 shadow-xl glass bg-success/5'
                    :'hover:shadow-xl hover:scale-[1.02]'
              }`}>
                {plan.popular && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type:"spring" }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <span className="bg-gradient-to-r from-success to-success text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⚡ {plan.badge}
                    </span>
                  </motion.div>
                )}

                {plan.recommended && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="bg-success text-white px-3 py-1 rounded-full text-xs font-bold">
                      💰 {plan.badge}
                    </motion.div>
                  </div>
                )}

                {plan.highlight && !plan.popular && !plan.recommended && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type:"spring" }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <span className="bg-gradient-to-r from-secondary to-secondary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ∞ {plan.badge}
                    </span>
                  </motion.div>
                )}

                {plan.enterprise && !plan.popular && !plan.recommended && !plan.highlight && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type:"spring" }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <span className="bg-gradient-to-r from-success to-success text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      💰 {plan.badge}
                    </span>
                  </motion.div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-3">
                    {/* Value Proposition First */}
                    <CardDescription className="text-base font-medium" data-ai-answer="true">
                      {plan.description}
                    </CardDescription>

                    {/* Price with Per-Member Cost */}
                    <div className="space-y-2">
                      <div className="text-5xl font-bold">
                        ${plan.price.toLocaleString()}
                        <span className="text-lg font-normal text-muted-foreground">
                          /{plan.billingCycle ==='annual' ?'year' :'month'}
                        </span>
                      </div>
                      {plan.price > 0 && (
                        <motion.div
                          key={`${memberCount[0]}-${plan.billingCycle}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-sm text-muted-foreground"
                        >
                          {plan.name ==='Expand' ? (
                            <>
                              <span className="font-bold text-primary">
                                Up to {Number(plan.memberLimit).toLocaleString()} members included
                              </span>
                              <div className="text-xs text-secondary font-medium">
                                More room for a large club.
                              </div>
                            </>
                          ) : plan.billingCycle ==='annual' ? (
                            <>
                              Only <span className="font-bold text-primary">
                                ${Math.ceil(plan.price / 12 / memberCount[0]).toLocaleString()}
                              </span> per member/month
                              <div className="text-xs text-success font-medium">
                                💡 Best value with annual billing
                              </div>
                            </>
                          ) : (
                            <>
                              Only <span className="font-bold text-primary">
                                ${calculatePerMemberCost(plan.price, memberCount[0])}
                              </span> per member/month
                              {memberCount[0] >= 100 && (
                                <div className="text-xs text-primary font-medium">
                                  ☕ Less than a cup of coffee per member!
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Value Highlight */}
                  <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10   rounded-lg border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Key Value</div>
                    <div className="text-lg font-bold text-primary">
                      {plan.name ==='Expand' ?'Room to Expand' : plan.name ==='Seed' ?'Launch Your Club' :'Grow Your Club'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {plan.name ==='Expand' ?'2,000 members, more email, and no admin user cap' : plan.name ==='Seed' ?'Core tools for clubs with up to 100 members' :'More tools for clubs with up to 200 members'}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        const next = expandedPlan === plan.name ? null : plan.name;
                        setExpandedPlan(next);
                        trackPricingInteraction('toggle_plan_features', plan.name);
                      }}
                      className="w-full text-left font-medium text-sm flex items-center justify-between hover:text-primary transition-colors"
                    >
                      <span>What's Included ({plan.features.length} features)</span>
                      <motion.div
                        animate={{ rotate: expandedPlan === plan.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.div>
                    </button>

                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedPlan === plan.name ?'auto' : 120,
                        opacity: expandedPlan === plan.name ? 1 : 0.8
                      }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-2">
                        {plan.features.slice(0, expandedPlan === plan.name ? undefined : 4).map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: featureIndex * 0.05 }}
                            className="flex items-start space-x-3 text-sm"
                          >
                            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" data-testid="check-icon" />
                            <span>{feature}</span>
                          </motion.li>
                        ))}
                        {!expandedPlan && plan.features.length > 4 && (
                          <li className="text-sm text-muted-foreground italic">
                            + {plan.features.length - 4} more features...
                          </li>
                        )}
                      </ul>
                    </motion.div>

                    {/* Upgrade Incentive - Show what you get with Grow */}
                    {plan.missingFeatures.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <div className="text-xs font-medium text-muted-foreground mb-2">💡 Upgrade to Grow for:</div>
                        <ul className="space-y-1">
                          {(plan.missingFeatures as string[]).map((missing, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground opacity-75">
                              • {missing.replace('Limited to 50 members','More members').replace('Basic support only','Priority support').replace('Standard platform fees','No additional processing fees').replace('Limited email volume','More email').replace('No mobile app access','Mobile app access')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-6 flex-col space-y-2">
                  <Link
                    href={
                      plan.name ==="Seed" ? `/register?plan=seed&billing=${plan.billingCycle}` :
                      plan.name ==="Grow" ? `/register?plan=grow&billing=${plan.billingCycle}` :
                      `/register?plan=unlimited&billing=${plan.billingCycle}`
                    }
                    className={cn(
                      buttonVariants({
                        variant: plan.popular || plan.highlight || plan.recommended || plan.enterprise ?"default" :"default",
                        size:"lg"
                      }),"w-full transition-all duration-300 min-h-[44px]",
                      plan.popular
                        ?'bg-gradient-to-r from-success to-success hover:from-success hover:to-success/90 text-white shadow-lg hover:shadow-xl'
                        : plan.recommended
                          ?'bg-gradient-to-r from-success to-success hover:from-success hover:to-success/90 text-white shadow-lg hover:shadow-xl'
                        : plan.highlight
                          ?'bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary/90 text-white shadow-lg hover:shadow-xl'
                        : plan.enterprise
                          ?'bg-gradient-to-r from-success to-success hover:from-success hover:to-success/90 text-white shadow-lg hover:shadow-xl'
                          :'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                    )}
                    onClick={() => {
                      trackFunnel('PRICING_INTERACTION', {
                        source:'pricing_section',
                        plan: plan.name.toLowerCase(),
                        billing: plan.billingCycle,
                        action:'upgrade_click'
                      });
                    }}
                    data-testid={`button-${plan.name.toLowerCase()}-${plan.billingCycle}`}
                  >
                    Start Free Trial
                  </Link>
                  <p className="text-xs text-center text-muted-foreground">
                    30-day free trial • Cancel anytime
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" /> Secure checkout
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" /> Powered by Stripe
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Plan Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hidden md:block mb-12"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Compare Plans</h3>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th scope="col" className="text-center py-3 px-4 font-semibold">Seed</th>
                  <th scope="col" className="text-center py-3 px-4 font-semibold">Grow</th>
                  <th scope="col" className="text-center py-3 px-4 font-semibold">Expand</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ?"bg-muted/30" :""}>
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.seed)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.grow)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.unlimited)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Social Proof & Value Messaging */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-12"
        >
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10   rounded-xl border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">3</div>
              <div className="text-sm text-muted-foreground">Simple paid tiers to choose from</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10   rounded-xl border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">5+</div>
              <div className="text-sm text-muted-foreground">Tools consolidated into one platform</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-success/5 to-success/10   rounded-xl border border-success/20">
              <div className="text-3xl font-bold text-success mb-2">30 days</div>
              <div className="text-sm text-muted-foreground">Free trial included with all plans</div>
            </div>
          </div>
        </motion.div>

        {/* Operational Value Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Why Organizations Choose GatherGrove
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              One subscription, no hidden fees - we never take a cut of your payments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10   rounded-xl border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">Less Admin</div>
              <div className="text-sm font-medium mb-1">Automate Repetitive Tasks</div>
              <div className="text-xs text-muted-foreground">Automate member management, communications, and event coordination so you can focus on your community</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10   rounded-xl border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">5+ tools</div>
              <div className="text-sm font-medium mb-1">Replaced & Consolidated</div>
              <div className="text-xs text-muted-foreground">Email platforms, member databases, event management, chat tools, and more - all in one place</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10   rounded-xl border border-secondary/20">
              <div className="text-3xl font-bold text-secondary mb-2">Automated</div>
              <div className="text-sm font-medium mb-1">Dues Collection</div>
              <div className="text-xs text-muted-foreground">Automated reminders and a streamlined payment process keep your dues collection on track</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="max-w-2xl mx-auto p-4 bg-gradient-to-r from-primary/5 to-primary/10   rounded-lg border border-primary/20">
              <div className="text-sm font-medium text-primary  mb-2">
                Simple pricing
              </div>
              <div className="text-xs text-muted-foreground">
                Pay only your subscription fee. We never take a cut of your payments - standard Stripe processing rates apply, and every dollar your members pay goes directly to your organization.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10   rounded-2xl p-8 border border-border">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-2xl font-bold mb-4">Clear pricing promise</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Start your free trial. Keep the plan if it fits your club.
              No hidden fees.
            </p>
            <div className="grid md:grid-cols-4 gap-6 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-primary" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-primary" />
                <span>Export your data</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-primary" />
                <span>No long-term contracts</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
