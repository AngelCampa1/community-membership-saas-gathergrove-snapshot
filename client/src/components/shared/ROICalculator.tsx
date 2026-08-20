"use client";

import { useState, useEffect } from"react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Slider } from"@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Checkbox } from"@/components/ui/checkbox";
import { motion, AnimatePresence } from"framer-motion";
import { TrendingUp, Clock, DollarSign, Target, Users, ArrowUpRight, BarChart3 } from"lucide-react";
import { getPricingPlan } from"@/lib/pricing";

interface CalculatorInputs {
  memberCount: number;
  adminHours: number;
  currentTools: string[];
  eventCount: number;
  selectedPlan:'grow' |'unlimited';
}

interface CalculatedResults {
  timeSavings: number;
  costSavings: number;
  roiPercentage: number;
  paybackMonths: number;
}

const currentToolOptions = [
  { id:"email", label:"Email platform (MailChimp, Constant Contact)", monthlyCost: 20 },
  { id:"payment", label:"Payment processor fees & tools", monthlyCost: 15 },
  { id:"chat", label:"Chat platform (Slack, Discord Pro)", monthlyCost: 12 },
  { id:"calendar", label:"Event management (Eventbrite, Meetup)", monthlyCost: 25 },
  { id:"survey", label:"Survey/forms tool (SurveyMonkey)", monthlyCost: 8 },
];

const adminHourOptions = [
  { value:"2", label:"2-3 hours per week" },
  { value:"5", label:"4-6 hours per week" },
  { value:"8", label:"7-10 hours per week" },
  { value:"12", label:"10+ hours per week" },
];

export function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    memberCount: 50,
    adminHours: 5,
    currentTools: [],
    eventCount: 2,
    selectedPlan:'grow',
  });

  const [results, setResults] = useState<CalculatedResults>({
    timeSavings: 0,
    costSavings: 0,
    roiPercentage: 0,
    paybackMonths: 0,
  });

  const [showResults, setShowResults] = useState(false);

  // Calculate results whenever inputs change
  useEffect(() => {
    const calculateResults = () => {
      const { memberCount, adminHours, currentTools, eventCount, selectedPlan } = inputs;

      // Time savings calculation based on plan features
      const currentAdminTimeMonthly = adminHours * 4.33; // Convert weekly to monthly
      
      const baselineHours = {
        memberManagement: memberCount * 0.05, // 3 minutes per member/month
        paymentTracking: memberCount * 0.08, // 5 minutes per member/month for manual tracking
        communication: Math.max(4, memberCount * 0.02), // 4 hours minimum, scales with size
        events: eventCount * 1.2, // 1.2 hours per event prep/management
        generalAdmin: currentAdminTimeMonthly * 0.3, // 30% of reported admin time for misc tasks
      };

      // Expand plan has more automation features and no limits
      const isExpand = selectedPlan ==='unlimited';
      const gatherGroveHours = {
        memberManagement: memberCount * (isExpand ? 0.003 : 0.008), // Unlimited admins + advanced profiles
        paymentTracking: memberCount * (isExpand ? 0.001 : 0.003), // Full automation + email
        communication: Math.max(0.5, memberCount * (isExpand ? 0.0005 : 0.002)), // Email automation
        events: eventCount * (isExpand ? 0.1 : 0.2), // Unlimited events + advanced analytics
        generalAdmin: currentAdminTimeMonthly * (isExpand ? 0.02 : 0.05), // Advanced reporting & analytics
      };

      const totalBaselineHours = Object.values(baselineHours).reduce((sum, hours) => sum + hours, 0);
      const totalGatherGroveHours = Object.values(gatherGroveHours).reduce((sum, hours) => sum + hours, 0);
      const timeSavings = Math.max(0, totalBaselineHours - totalGatherGroveHours);

      // Cost savings calculation with plan-specific benefits
      const avgDues = 30; // $30 average monthly dues
      const currentCollectionRate = 0.70; // 70% baseline collection rate
      
      // Expand plan has better collection rates due to unlimited reminders + all channels
      const improvedCollectionRate = isExpand ? 0.95 : 0.90; // 95% vs 90%
      const collectionImprovement = memberCount * avgDues * (improvedCollectionRate - currentCollectionRate);
      
      const eliminatedToolCosts = currentTools.reduce((total, toolId) => {
        const tool = currentToolOptions.find(t => t.id === toolId);
        return total + (tool?.monthlyCost || 0);
      }, 0);

      const timeSavingsValue = timeSavings * 25; // $25/hour value
      const monthlyCostSavings = collectionImprovement + eliminatedToolCosts + timeSavingsValue;

      // Annual calculations
      const annualSavings = monthlyCostSavings * 12;
      const plan = getPricingPlan(selectedPlan);
      const gatherGroveCost = plan.monthlyPrice * 12;
      const netAnnualSavings = annualSavings - gatherGroveCost;
      
      // ROI and payback - both plans are paid
      const roiPercentage = Math.max(0, (netAnnualSavings / gatherGroveCost) * 100);
      
      const paybackMonths = gatherGroveCost > 0 && monthlyCostSavings > 0 ? Math.max(0.1, gatherGroveCost / monthlyCostSavings) : 0;

      setResults({
        timeSavings: Math.round(timeSavings * 10) / 10,
        costSavings: Math.round(annualSavings),
        roiPercentage: Math.round(roiPercentage),
        paybackMonths: Math.round(paybackMonths * 10) / 10,
      });
    };

    calculateResults();
    setShowResults(true);
  }, [inputs]);

  const handleToolToggle = (toolId: string, checked: boolean) => {
    setInputs(prev => ({
      ...prev,
      currentTools: checked 
        ? [...prev.currentTools, toolId]
        : prev.currentTools.filter(id => id !== toolId)
    }));
  };

  return (
    <section id="roi" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold flex items-center justify-center gap-3">
            <DollarSign className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
            Investment Calculator: See How GatherGrove Pays for Itself
            <TrendingUp className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Calculate your club's potential return on investment. Results are estimates based on 
            typical club management improvements and may vary by organization.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Controls */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tell us about your club
              </CardTitle>
              <CardDescription>
                Adjust the settings below to match your current situation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  GatherGrove Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, selectedPlan:'grow' }))}
                    className={`p-3 text-sm rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm ${
                      inputs.selectedPlan ==='grow'
                        ?'border-primary bg-primary/10 text-primary font-medium'
                        :'border-border hover:border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium">Grow</div>
                    <div className="text-xs text-muted-foreground">${getPricingPlan('grow').monthlyPrice}/month</div>
                  </button>
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, selectedPlan:'unlimited' }))}
                    className={`p-3 text-sm rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm ${
                      inputs.selectedPlan ==='unlimited'
                        ?'border-primary bg-primary/10 text-primary font-medium'
                        :'border-border hover:border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium">Expand</div>
                    <div className="text-xs text-muted-foreground">${getPricingPlan('unlimited').monthlyPrice}/month</div>
                  </button>
                </div>
              </div>

              {/* Member Count Slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Number of members: {inputs.memberCount}
                </label>
                <Slider
                  value={[inputs.memberCount]}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, memberCount: value[0] }))}
                  max={500}
                  min={10}
                  step={5}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              {/* Admin Hours */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Time spent on admin tasks
                </label>
                <Select 
                  value={inputs.adminHours.toString()} 
                  onValueChange={(value) => setInputs(prev => ({ ...prev, adminHours: parseInt(value) }))}
                >
                  <SelectTrigger className="cursor-pointer hover:bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {adminHourOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Events per month */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Events per month: {inputs.eventCount}
                </label>
                <Slider
                  value={[inputs.eventCount]}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, eventCount: value[0] }))}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Current Tools */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Tools you currently use
                </label>
                <div className="space-y-2">
                  {currentToolOptions.map(tool => (
                    <div key={tool.id} className="flex items-center space-x-2 hover:bg-muted/50  p-1 rounded transition-colors">
                      <Checkbox
                        id={tool.id}
                        checked={inputs.currentTools.includes(tool.id)}
                        onCheckedChange={(checked) => handleToolToggle(tool.id, checked as boolean)}
                        className="cursor-pointer"
                      />
                      <label htmlFor={tool.id} className="text-sm flex-1 cursor-pointer">
                        {tool.label}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        ${tool.monthlyCost}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your potential savings
              </CardTitle>
              <CardDescription>
                Real-time calculations based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showResults && (
                  <motion.div
                    key={inputs.selectedPlan} // Force re-animation when plan changes
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, staggerChildren: 0.05 }}
                    className="space-y-6"
                  >
                    {/* Time Savings */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-primary/5  rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Clock className="w-8 h-8 text-primary" />
                            <ArrowUpRight className="w-4 h-4 text-success absolute -top-1 -right-1 bg-background rounded-full p-0.5" />
                          </div>
                          <div>
                            <div className="font-medium">Time Investment Return</div>
                            <div className="text-sm text-muted-foreground">Administrative hours reclaimed monthly</div>
                          </div>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type:"spring" }}
                          className="text-2xl font-bold text-primary"
                        >
                          {results.timeSavings}h
                        </motion.div>
                      </div>

                      {/* Time Breakdown */}
                      <div className="border-t border-primary/20  pt-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Member management:</span>
                          <span className="font-medium">~{Math.round(inputs.memberCount * 0.045 * 10) / 10}h saved</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment tracking:</span>
                          <span className="font-medium">~{Math.round(inputs.memberCount * 0.07 * 10) / 10}h saved</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Communication tasks:</span>
                          <span className="font-medium">~{Math.max(3.5, inputs.memberCount * 0.02)}h saved</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Event coordination:</span>
                          <span className="font-medium">~{Math.round(inputs.eventCount * 1.05 * 10) / 10}h saved</span>
                        </div>
                        <div className="border-t border-primary/20  pt-2 flex justify-between font-medium">
                          <span className="text-primary">Value @ $25/hour:</span>
                          <span className="text-primary">${Math.round(results.timeSavings * 25)}/month</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Cost Savings */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between p-4 bg-success/5  rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <DollarSign className="w-8 h-8 text-success" />
                          <TrendingUp className="w-4 h-4 text-success absolute -top-1 -right-1 bg-background rounded-full p-0.5" />
                        </div>
                        <div>
                          <div className="font-medium">Annual Value Creation</div>
                          <div className="text-sm text-muted-foreground">Operational efficiency gains + revenue improvement</div>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type:"spring" }}
                        className="text-2xl font-bold text-success"
                      >
                        ${results.costSavings.toLocaleString()}
                      </motion.div>
                    </motion.div>

                    {/* ROI Percentage */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center justify-between p-4 bg-secondary/5  rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Target className="w-8 h-8 text-secondary" />
                          <BarChart3 className="w-4 h-4 text-success absolute -top-1 -right-1 bg-background rounded-full p-0.5" />
                        </div>
                        <div>
                          <div className="font-medium">
                            Investment ROI
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Return on ${inputs.selectedPlan ==='unlimited' ?'2,400' :'348'} annual investment
                          </div>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type:"spring" }}
                        className="text-2xl font-bold text-secondary flex items-center gap-1"
                      >
                        {results.roiPercentage}%
                        {results.roiPercentage > 100 && <span className="text-success">💸</span>}
                      </motion.div>
                    </motion.div>

                    {/* Payback period for Grow plan */}
                    {results.paybackMonths > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center p-4 bg-gradient-to-r from-warning/5 to-destructive/5   rounded-lg"
                      >
                        <div className="text-sm text-muted-foreground mb-1">Investment Recovery Timeline</div>
                        <div className="text-xl font-bold">
                          {results.paybackMonths} month{results.paybackMonths !== 1 ?'s' :''} to break even
                        </div>
                      </motion.div>
                    )}

                    {/* Tool Consolidation Value */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-r from-warning/5 to-warning/10   rounded-lg p-4 border border-warning/20"
                    >
                      <div className="text-sm font-medium text-warning  mb-3">
                        🔧 Replace Multiple Tools & Services
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Email platform (MailChimp):</span>
                          <span className="font-bold text-destructive">$20-50/mo</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Event management (Eventbrite):</span>
                          <span className="font-bold text-destructive">$25-40/mo</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Member database (Airtable):</span>
                          <span className="font-bold text-destructive">$20-30/mo</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Chat platform (Slack Pro):</span>
                          <span className="font-bold text-destructive">$12-20/mo</span>
                        </div>
                        <div className="border-t border-warning/20  pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-warning  font-medium">Multiple tool costs:</span>
                            <span className="font-bold text-destructive">$75-140/mo</span>
                          </div>
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-success">GatherGrove {inputs.selectedPlan ==='unlimited' ?'Expand' :'Grow'}:</span>
                            <span className="text-success">${inputs.selectedPlan ==='unlimited' ?'200' :'29'}/mo</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Member Satisfaction Benefits */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-secondary/5 to-secondary/10   rounded-lg p-4 border border-secondary/20"
                    >
                      <div className="text-sm font-medium text-secondary  mb-3">
                        🎯 Member Satisfaction & Growth Impact
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center p-2 bg-background/50 rounded">
                          <div className="font-bold text-lg text-secondary">Up to 30%*</div>
                          <div className="text-muted-foreground">retention improvement</div>
                        </div>
                        <div className="text-center p-2 bg-background/50 rounded">
                          <div className="font-bold text-lg text-secondary">20-40%*</div>
                          <div className="text-muted-foreground">growth potential</div>
                        </div>
                        <div className="text-center p-2 bg-background/50 rounded">
                          <div className="font-bold text-lg text-secondary">4.5/5*</div>
                          <div className="text-muted-foreground">user satisfaction</div>
                        </div>
                        <div className="text-center p-2 bg-background/50 rounded">
                          <div className="font-bold text-lg text-secondary">2-3x*</div>
                          <div className="text-muted-foreground">engagement increase</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-center text-secondary">
                        *Results based on user surveys and may vary by club size and engagement levels
                      </div>
                    </motion.div>

                    {/* Call to Action */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="pt-4 space-y-3"
                    >
                      <div className="text-center">
                        <a 
                          href="/register"
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full text-lg"
                        >
                          Start Free Trial
                        </a>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        * Calculations based on {inputs.selectedPlan ==='grow' ?'Grow' :'Expand'} plan features. Individual results may vary.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
