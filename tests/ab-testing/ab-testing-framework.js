/**
 * GatherGrove A/B Testing Framework
 * Marketing validation and feature testing system
 */

const { EventEmitter } = require('events');

class ABTestingFramework extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            analyticsEndpoint: process.env.ANALYTICS_ENDPOINT || '/api/analytics',
            cookieDomain: process.env.COOKIE_DOMAIN || '.gathergrove.com',
            defaultConfidenceLevel: 95,
            minimumSampleSize: 100,
            ...options
        };
        
        this.experiments = new Map();
        this.userAssignments = new Map();
        this.eventTracking = [];
        this.conversionFunnels = new Map();
    }

    /**
     * Create new A/B test experiment
     */
    createExperiment(config) {
        const experiment = {
            id: config.id,
            name: config.name,
            description: config.description,
            hypothesis: config.hypothesis,
            variants: config.variants,
            trafficAllocation: config.trafficAllocation || this.generateEvenSplit(config.variants.length),
            targetMetrics: config.targetMetrics,
            segmentation: config.segmentation || {},
            startDate: config.startDate || new Date(),
            endDate: config.endDate,
            status: 'active',
            minSampleSize: config.minSampleSize || this.options.minimumSampleSize,
            confidenceLevel: config.confidenceLevel || this.options.defaultConfidenceLevel,
            createdAt: new Date(),
            results: {
                participants: 0,
                conversions: {},
                metrics: {},
                statisticalSignificance: null
            }
        };

        // Initialize conversion tracking for each variant
        experiment.variants.forEach(variant => {
            experiment.results.conversions[variant.id] = {
                exposures: 0,
                conversions: 0,
                conversionRate: 0,
                revenue: 0
            };
            experiment.results.metrics[variant.id] = {};
        });

        this.experiments.set(experiment.id, experiment);
        
        console.log(`🧪 Created A/B test: ${experiment.name} (${experiment.id})`);
        this.emit('experimentCreated', experiment);
        
        return experiment;
    }

    /**
     * Assign user to experiment variant
     */
    assignUserToVariant(experimentId, userId, userContext = {}) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'active') {
            return null;
        }

        // Check if user already assigned
        const assignmentKey = `${experimentId}_${userId}`;
        if (this.userAssignments.has(assignmentKey)) {
            return this.userAssignments.get(assignmentKey);
        }

        // Check segmentation criteria
        if (!this.matchesSegmentation(userContext, experiment.segmentation)) {
            return null;
        }

        // Assign variant based on traffic allocation
        const variant = this.selectVariant(userId, experiment);
        
        const assignment = {
            experimentId,
            userId,
            variantId: variant.id,
            assignedAt: new Date(),
            userContext
        };

        this.userAssignments.set(assignmentKey, assignment);
        
        // Track exposure
        experiment.results.conversions[variant.id].exposures++;
        experiment.results.participants++;

        this.emit('userAssigned', assignment);
        
        console.log(`👤 User ${userId} assigned to ${variant.id} in experiment ${experimentId}`);
        
        return assignment;
    }

    /**
     * Track conversion event
     */
    trackConversion(experimentId, userId, eventType, value = 1, metadata = {}) {
        const assignmentKey = `${experimentId}_${userId}`;
        const assignment = this.userAssignments.get(assignmentKey);
        
        if (!assignment) {
            console.warn(`No assignment found for user ${userId} in experiment ${experimentId}`);
            return false;
        }

        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            console.warn(`Experiment ${experimentId} not found`);
            return false;
        }

        const variantId = assignment.variantId;
        const conversionData = experiment.results.conversions[variantId];
        
        // Track conversion
        conversionData.conversions++;
        conversionData.revenue += (typeof value === 'number') ? value : 0;
        conversionData.conversionRate = (conversionData.conversions / conversionData.exposures) * 100;

        // Track event
        const event = {
            experimentId,
            userId,
            variantId,
            eventType,
            value,
            metadata,
            timestamp: new Date()
        };

        this.eventTracking.push(event);
        
        // Update experiment metrics
        if (!experiment.results.metrics[variantId][eventType]) {
            experiment.results.metrics[variantId][eventType] = {
                count: 0,
                totalValue: 0,
                avgValue: 0
            };
        }

        const metric = experiment.results.metrics[variantId][eventType];
        metric.count++;
        metric.totalValue += value;
        metric.avgValue = metric.totalValue / metric.count;

        this.emit('conversionTracked', event);
        
        console.log(`📊 Conversion tracked: ${eventType} for user ${userId} in variant ${variantId}`);
        
        return true;
    }

    /**
     * Marketing Campaign A/B Testing
     */
    createMarketingCampaignTest(config) {
        const marketingExperiment = {
            id: `marketing_${config.campaignId}`,
            name: `Marketing Campaign: ${config.campaignName}`,
            description: config.description,
            hypothesis: config.hypothesis,
            variants: [
                {
                    id: 'control',
                    name: 'Control',
                    config: config.controlVariant
                },
                {
                    id: 'treatment',
                    name: 'Treatment',
                    config: config.treatmentVariant
                }
            ],
            targetMetrics: [
                'click_through_rate',
                'conversion_rate',
                'cost_per_acquisition',
                'return_on_ad_spend'
            ],
            segmentation: config.audience || {},
            ...config
        };

        return this.createExperiment(marketingExperiment);
    }

    /**
     * Feature Rollout Testing
     */
    createFeatureRolloutTest(config) {
        const featureExperiment = {
            id: `feature_${config.featureName}`,
            name: `Feature Rollout: ${config.featureName}`,
            description: config.description,
            hypothesis: config.hypothesis,
            variants: [
                {
                    id: 'feature_off',
                    name: 'Feature Disabled',
                    config: { enabled: false }
                },
                {
                    id: 'feature_on',
                    name: 'Feature Enabled',
                    config: { enabled: true }
                }
            ],
            trafficAllocation: config.rolloutPercentage ? 
                [100 - config.rolloutPercentage, config.rolloutPercentage] : 
                [50, 50],
            targetMetrics: [
                'feature_adoption',
                'user_engagement',
                'session_duration',
                'retention_rate'
            ],
            ...config
        };

        return this.createExperiment(featureExperiment);
    }

    /**
     * Conversion Funnel Testing
     */
    setupConversionFunnel(experimentId, funnelSteps) {
        const funnel = {
            experimentId,
            steps: funnelSteps.map((step, index) => ({
                id: step.id,
                name: step.name,
                order: index,
                required: step.required || false,
                targetEvent: step.targetEvent
            })),
            tracking: new Map()
        };

        this.conversionFunnels.set(experimentId, funnel);
        
        console.log(`🔄 Conversion funnel setup for experiment ${experimentId}`);
        return funnel;
    }

    trackFunnelStep(experimentId, userId, stepId, metadata = {}) {
        const funnel = this.conversionFunnels.get(experimentId);
        if (!funnel) {
            console.warn(`No funnel found for experiment ${experimentId}`);
            return false;
        }

        const assignment = this.userAssignments.get(`${experimentId}_${userId}`);
        if (!assignment) {
            console.warn(`No assignment found for user ${userId} in experiment ${experimentId}`);
            return false;
        }

        const trackingKey = `${userId}_${assignment.variantId}`;
        if (!funnel.tracking.has(trackingKey)) {
            funnel.tracking.set(trackingKey, {
                userId,
                variantId: assignment.variantId,
                stepsCompleted: [],
                currentStep: 0,
                startedAt: new Date(),
                lastActivity: new Date()
            });
        }

        const userProgress = funnel.tracking.get(trackingKey);
        userProgress.stepsCompleted.push({
            stepId,
            completedAt: new Date(),
            metadata
        });
        userProgress.lastActivity = new Date();

        // Find current step index
        const stepIndex = funnel.steps.findIndex(step => step.id === stepId);
        userProgress.currentStep = Math.max(userProgress.currentStep, stepIndex + 1);

        this.emit('funnelStepCompleted', {
            experimentId,
            userId,
            stepId,
            userProgress
        });

        return true;
    }

    /**
     * Statistical Analysis
     */
    calculateStatisticalSignificance(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return null;

        const variants = experiment.variants;
        if (variants.length !== 2) {
            console.warn('Statistical significance calculation currently supports only 2-variant tests');
            return null;
        }

        const [control, treatment] = variants;
        const controlData = experiment.results.conversions[control.id];
        const treatmentData = experiment.results.conversions[treatment.id];

        // Check minimum sample size
        if (controlData.exposures < experiment.minSampleSize || treatmentData.exposures < experiment.minSampleSize) {
            return {
                significant: false,
                reason: 'insufficient_sample_size',
                minSampleSize: experiment.minSampleSize,
                currentSampleSize: {
                    control: controlData.exposures,
                    treatment: treatmentData.exposures
                }
            };
        }

        // Calculate conversion rates
        const p1 = controlData.conversions / controlData.exposures;
        const p2 = treatmentData.conversions / treatmentData.exposures;
        
        // Calculate standard error
        const n1 = controlData.exposures;
        const n2 = treatmentData.exposures;
        const se = Math.sqrt((p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2));
        
        // Calculate z-score
        const zScore = Math.abs(p2 - p1) / se;
        
        // Determine significance (95% confidence level = z > 1.96)
        const isSignificant = zScore > 1.96;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
        
        const result = {
            significant: isSignificant,
            zScore,
            pValue,
            confidenceLevel: experiment.confidenceLevel,
            effect: {
                absolute: p2 - p1,
                relative: ((p2 - p1) / p1) * 100
            },
            winner: p2 > p1 ? treatment.id : control.id,
            improvement: Math.abs(((p2 - p1) / p1) * 100)
        };

        experiment.results.statisticalSignificance = result;
        
        return result;
    }

    normalCDF(x) {
        // Approximation of the normal cumulative distribution function
        return (1.0 + this.erf(x / Math.sqrt(2.0))) / 2.0;
    }

    erf(x) {
        // Approximation of the error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    /**
     * Generate experiment report
     */
    generateExperimentReport(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }

        const significance = this.calculateStatisticalSignificance(experimentId);
        const duration = new Date() - experiment.startDate;
        
        const report = {
            experiment: {
                id: experiment.id,
                name: experiment.name,
                description: experiment.description,
                hypothesis: experiment.hypothesis,
                status: experiment.status,
                duration: Math.round(duration / (1000 * 60 * 60 * 24)) // days
            },
            results: {
                participants: experiment.results.participants,
                conversions: experiment.results.conversions,
                statisticalSignificance: significance,
                recommendation: this.generateRecommendation(experiment, significance)
            },
            funnel: this.generateFunnelAnalysis(experimentId),
            insights: this.generateInsights(experiment),
            timestamp: new Date().toISOString()
        };

        console.log(`📋 Generated report for experiment: ${experiment.name}`);
        
        return report;
    }

    generateRecommendation(experiment, significance) {
        if (!significance) {
            return {
                action: 'continue',
                reason: 'Insufficient data for statistical analysis',
                confidence: 'low'
            };
        }

        if (!significance.significant) {
            return {
                action: 'continue_or_stop',
                reason: 'No statistically significant difference detected',
                confidence: 'medium',
                suggestion: 'Consider running longer or increasing sample size'
            };
        }

        const improvement = significance.improvement;
        
        if (improvement > 10) {
            return {
                action: 'implement_winner',
                reason: `Strong positive effect: ${improvement.toFixed(2)}% improvement`,
                confidence: 'high',
                winner: significance.winner
            };
        } else if (improvement > 5) {
            return {
                action: 'implement_winner',
                reason: `Moderate positive effect: ${improvement.toFixed(2)}% improvement`,
                confidence: 'medium',
                winner: significance.winner
            };
        } else {
            return {
                action: 'continue',
                reason: `Small effect detected: ${improvement.toFixed(2)}% improvement`,
                confidence: 'low',
                suggestion: 'Consider practical significance vs statistical significance'
            };
        }
    }

    generateFunnelAnalysis(experimentId) {
        const funnel = this.conversionFunnels.get(experimentId);
        if (!funnel) return null;

        const analysis = {
            totalUsers: funnel.tracking.size,
            stepAnalysis: {},
            variantComparison: {}
        };

        // Analyze each step
        funnel.steps.forEach(step => {
            analysis.stepAnalysis[step.id] = {
                name: step.name,
                completions: 0,
                dropOffs: 0,
                conversionRate: 0
            };
        });

        // Calculate metrics
        for (const [, userProgress] of funnel.tracking) {
            userProgress.stepsCompleted.forEach(step => {
                if (analysis.stepAnalysis[step.stepId]) {
                    analysis.stepAnalysis[step.stepId].completions++;
                }
            });
        }

        return analysis;
    }

    generateInsights(experiment) {
        const insights = [];
        
        // Check conversion rates
        for (const [variantId, data] of Object.entries(experiment.results.conversions)) {
            if (data.conversionRate < 1) {
                insights.push({
                    type: 'warning',
                    message: `Low conversion rate (${data.conversionRate.toFixed(2)}%) for variant ${variantId}`,
                    impact: 'high'
                });
            }
        }

        // Check sample sizes
        const totalParticipants = experiment.results.participants;
        if (totalParticipants < experiment.minSampleSize * 2) {
            insights.push({
                type: 'info',
                message: `Sample size (${totalParticipants}) below recommended minimum for reliable results`,
                impact: 'medium'
            });
        }

        return insights;
    }

    // Helper methods
    generateEvenSplit(variantCount) {
        const percentage = 100 / variantCount;
        return Array(variantCount).fill(percentage);
    }

    selectVariant(userId, experiment) {
        // Deterministic assignment based on user ID hash
        const hash = this.hashUserId(userId);
        const percentage = hash % 100;
        
        let cumulative = 0;
        for (let i = 0; i < experiment.variants.length; i++) {
            cumulative += experiment.trafficAllocation[i];
            if (percentage < cumulative) {
                return experiment.variants[i];
            }
        }
        
        return experiment.variants[0]; // Fallback
    }

    hashUserId(userId) {
        let hash = 0;
        const str = userId.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    matchesSegmentation(userContext, segmentation) {
        if (!segmentation || Object.keys(segmentation).length === 0) {
            return true; // No segmentation criteria
        }

        for (const [key, value] of Object.entries(segmentation)) {
            if (userContext[key] !== value) {
                return false;
            }
        }

        return true;
    }
}

module.exports = { ABTestingFramework };

// Example usage
if (require.main === module) {
    (async () => {
        const abTester = new ABTestingFramework();
        
        // Create marketing campaign test
        const marketingTest = abTester.createMarketingCampaignTest({
            campaignId: 'landing_page_2024',
            campaignName: 'Landing Page Conversion Optimization',
            description: 'Testing new landing page design for better conversion',
            hypothesis: 'New design with prominent CTA will increase signups by 15%',
            controlVariant: { design: 'current', ctaColor: 'blue' },
            treatmentVariant: { design: 'new', ctaColor: 'orange' },
            audience: { userType: 'new_visitor' }
        });

        // Setup conversion funnel
        abTester.setupConversionFunnel(marketingTest.id, [
            { id: 'landing_view', name: 'Landing Page View', targetEvent: 'page_view' },
            { id: 'signup_click', name: 'Signup Button Click', targetEvent: 'cta_click' },
            { id: 'form_complete', name: 'Registration Form Complete', targetEvent: 'signup' },
            { id: 'email_verify', name: 'Email Verification', targetEvent: 'verify_email' }
        ]);

        // Simulate user interactions
        for (let i = 1; i <= 200; i++) {
            const userId = `user_${i}`;
            const assignment = abTester.assignUserToVariant(marketingTest.id, userId, { userType: 'new_visitor' });
            
            if (assignment) {
                // Simulate landing page view
                abTester.trackFunnelStep(marketingTest.id, userId, 'landing_view');
                
                // Simulate some conversions
                if (Math.random() > 0.7) { // 30% click signup
                    abTester.trackFunnelStep(marketingTest.id, userId, 'signup_click');
                    abTester.trackConversion(marketingTest.id, userId, 'cta_click', 1);
                    
                    if (Math.random() > 0.5) { // 50% of those complete form
                        abTester.trackFunnelStep(marketingTest.id, userId, 'form_complete');
                        abTester.trackConversion(marketingTest.id, userId, 'signup', 1);
                    }
                }
            }
        }

        // Generate report
        const report = abTester.generateExperimentReport(marketingTest.id);
        console.log('🎉 A/B Test Report Generated!');
        console.log(JSON.stringify(report, null, 2));
    })();
}