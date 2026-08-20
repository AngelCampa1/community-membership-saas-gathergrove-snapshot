import { ArrowLeft, AlertTriangle, Shield, Phone, FileText, Users, Clock, CheckCircle, Bell, MessageSquare, Calendar, MapPin } from"lucide-react";
import Link from"next/link";
import { Header } from"@/components/shared/Header";
import { Footer } from"@/components/shared/Footer";
import { KeyTakeaways } from"@/components/seo/KeyTakeaways";
import { ArticleHeader } from"@/components/seo/ArticleHeader";
import { ResourceArticleJsonLd } from"@/components/seo/ResourceArticleJsonLd";
import { QuickAnswer } from"@/components/seo/QuickAnswer";
import { DefinitionBox } from"@/components/seo/DefinitionBox";
import { getResourceBySlug } from"@/lib/data/resources";
import { ResourceArticleFooter } from"@/components/seo/ResourceArticleFooter";

export default function CrisisManagementPage() {
  const resource = getResourceBySlug('crisis-management-and-emergency-planning')!;
  return (
    <div className="min-h-screen">
      <ResourceArticleJsonLd resource={resource} />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/resources" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
        </div>

        <ArticleHeader
          category="Crisis Management"
          dateModified={resource.dateModified}
          title="Crisis Management and Emergency Planning"
          description="Prepare your club to handle emergencies, conflicts, and unexpected challenges with confidence. Build resilient systems that protect members and ensure continuity during difficult times."
          readTime={resource.readTime}
        />

        <KeyTakeaways takeaways={["Every organization needs a documented crisis response plan before a crisis occurs","A clear communication chain ensures the right people are notified within minutes","Regular crisis drills and tabletop exercises reveal gaps before real emergencies expose them","Post-crisis review and documentation turn difficult experiences into organizational improvements",
        ]} />

        <QuickAnswer
          question="How should a club prepare for emergencies?"
          answer="Make a crisis plan before you need it. Cover event safety, urgent push alerts, phone trees, insurance, 3-6 months of reserves, backup leaders, and data backups. Review the plan each year."
        />

        <QuickAnswer
          question="How do you handle conflict within a club?"
          answer="Handle club conflicts with a documented conflict resolution process: acknowledge the issue promptly, gather perspectives from all parties privately, mediate with a neutral board member or committee, propose fair solutions based on bylaws and precedent, and follow up to ensure resolution. Have a code of conduct that members agree to upon joining."
        />

        <DefinitionBox
          term="Crisis Management Plan"
          definition="A documented strategy that outlines procedures for responding to emergencies, conflicts, and unexpected challenges within an organization. For clubs, this typically covers member safety protocols, communication procedures, financial contingencies, leadership succession, and reputation management strategies."
        />

        {/* Quick Navigation */}
        <div className="bg-muted/50 rounded-lg p-6 mb-12">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Navigation
          </h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#fundamentals" className="text-primary hover:text-primary/80 transition-colors">
              • Crisis Management Fundamentals
            </a>
            <a href="#risk-assessment" className="text-primary hover:text-primary/80 transition-colors">
              • Risk Assessment and Prevention
            </a>
            <a href="#emergency-planning" className="text-primary hover:text-primary/80 transition-colors">
              • Emergency Response Planning
            </a>
            <a href="#communication" className="text-primary hover:text-primary/80 transition-colors">
              • Crisis Communication Strategies
            </a>
            <a href="#conflict-resolution" className="text-primary hover:text-primary/80 transition-colors">
              • Conflict Resolution Protocols
            </a>
            <a href="#business-continuity" className="text-primary hover:text-primary/80 transition-colors">
              • Business Continuity Planning
            </a>
            <a href="#recovery" className="text-primary hover:text-primary/80 transition-colors">
              • Recovery and Learning
            </a>
            <a href="#implementation" className="text-primary hover:text-primary/80 transition-colors">
              • Implementation Guide
            </a>
          </div>
        </div>

        <article className="prose prose-lg  max-w-none">
          {/* Crisis Management Fundamentals */}
          <section id="fundamentals" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Crisis Management Fundamentals
            </h2>
            
            <p className="text-lg mb-6">
              Every club, regardless of size or activity, faces potential crises. From member conflicts and financial 
              emergencies to natural disasters and public relations challenges, having robust crisis management systems 
              protects your organization and demonstrates leadership maturity.
            </p>

            <div className="bg-destructive/5  border-l-4 border-destructive p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-destructive">
                The Crisis Management Mindset
              </h3>
              <p className="text-destructive/80  mb-4">
                Effective crisis management isn't about expecting the worst - it's about building resilient systems
                that enable rapid, confident response when challenges arise. The goal is to minimize impact, protect 
                stakeholders, and emerge stronger from difficulties.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-destructive  mb-2">Preparation</h4>
                  <p className="text-sm text-destructive/80">
                    Identify risks, create response plans, and establish communication protocols before crises occur
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-destructive  mb-2">Response</h4>
                  <p className="text-sm text-destructive/80">
                    Execute established plans quickly and effectively while adapting to specific circumstances
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h4 className="font-semibold text-destructive  mb-2">Recovery</h4>
                  <p className="text-sm text-destructive/80">
                    Learn from experiences, strengthen systems, and rebuild stronger organizational resilience
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Types of Club Crises</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-warning" />
                  Internal Crises
                </h4>
                <p className="mb-4">
                  Challenges that originate within the club organization, often involving relationships, 
                  governance, or resource management issues.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Leadership Conflicts</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Board disputes and power struggles</li>
                      <li>• Officer misconduct or ethics violations</li>
                      <li>• Succession planning failures</li>
                      <li>• Decision-making gridlock</li>
                    </ul>
                  </div>
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Member Issues</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Harassment or discrimination complaints</li>
                      <li>• Safety incidents or injuries</li>
                      <li>• Financial disputes or fraud</li>
                      <li>• Behavioral problems or violations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  External Crises
                </h4>
                <p className="mb-4">
                  Events outside the club's direct control that significantly impact operations, safety, 
                  or reputation. These require rapid response and adaptation.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Emergency Situations</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Natural disasters and severe weather</li>
                      <li>• Medical emergencies during events</li>
                      <li>• Facility damage or closures</li>
                      <li>• Security threats or incidents</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">External Pressures</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Negative publicity or social media attacks</li>
                      <li>• Legal challenges or regulatory changes</li>
                      <li>• Economic downturns affecting membership</li>
                      <li>• Community relations problems</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Operational Crises
                </h4>
                <p className="mb-4">
                  Breakdowns in systems, processes, or resources that threaten the club's ability to 
                  function effectively or serve members.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">System Failures</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Technology outages and data loss</li>
                      <li>• Payment processing failures</li>
                      <li>• Communication system breakdowns</li>
                      <li>• Key volunteer departures</li>
                    </ul>
                  </div>
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Resource Constraints</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Sudden financial shortfalls</li>
                      <li>• Venue loss or unavailability</li>
                      <li>• Equipment failure or theft</li>
                      <li>• Insurance or liability issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Risk Assessment and Prevention */}
          <section id="risk-assessment" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Risk Assessment and Prevention
            </h2>
            
            <p className="text-lg mb-6">
              Proactive risk management identifies potential threats before they become crises. A systematic 
              approach to risk assessment enables clubs to implement preventive measures and reduce the 
              likelihood and impact of various challenges.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Comprehensive Risk Assessment Process</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Risk Identification</h4>
                  <p className="mb-4">
                    Systematically identify potential risks across all areas of club operations. Involve multiple 
                    perspectives to ensure comprehensive coverage of potential threats.
                  </p>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Risk Identification Methods:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Leadership team brainstorming sessions</li>
                      <li>• Member surveys about safety and concerns</li>
                      <li>• Historical incident analysis</li>
                      <li>• Industry best practice research</li>
                      <li>• External expert consultation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Risk Analysis and Prioritization</h4>
                  <p className="mb-4">
                    Evaluate each identified risk based on likelihood and potential impact. This analysis 
                    helps prioritize prevention efforts and resource allocation.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-semibold mb-3">Risk Assessment Matrix</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Impact →<br/>Likelihood ↓</th>
                            <th className="text-center p-2 bg-success/10">Low</th>
                            <th className="text-center p-2 bg-warning/10">Medium</th>
                            <th className="text-center p-2 bg-destructive/10">High</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">High</td>
                            <td className="text-center p-2 bg-warning/10">Medium</td>
                            <td className="text-center p-2 bg-destructive/10">High</td>
                            <td className="text-center p-2 bg-destructive/10">Critical</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Medium</td>
                            <td className="text-center p-2 bg-success/10">Low</td>
                            <td className="text-center p-2 bg-warning/10">Medium</td>
                            <td className="text-center p-2 bg-destructive/10">High</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Low</td>
                            <td className="text-center p-2 bg-success/10">Low</td>
                            <td className="text-center p-2 bg-success/10">Low</td>
                            <td className="text-center p-2 bg-warning/10">Medium</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Prevention Strategy Development</h4>
                  <p className="mb-4">
                    Create specific prevention strategies for high-priority risks. Focus on practical measures 
                    that can be implemented within your club's resources and capabilities.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-success/5  p-4 rounded-lg">
                      <h5 className="font-semibold text-success  mb-2">Policy Prevention</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Clear codes of conduct and behavior standards</li>
                        <li>• Conflict of interest policies</li>
                        <li>• Safety protocols and procedures</li>
                        <li>• Financial controls and oversight</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5  p-4 rounded-lg">
                      <h5 className="font-semibold text-primary  mb-2">System Prevention</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Regular maintenance and inspection schedules</li>
                        <li>• Backup systems for critical functions</li>
                        <li>• Training programs for leaders and volunteers</li>
                        <li>• Communication redundancies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4 mt-8">Common Prevention Strategies</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Leadership and Governance
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Establish clear role definitions and decision-making authority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Implement term limits and succession planning processes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Create anonymous reporting mechanisms for concerns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Regular leadership training on conflict resolution</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Safety and Security
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Comprehensive insurance coverage and regular reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>First aid training for key volunteers and leaders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Emergency contact systems and communication protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Regular facility and equipment safety inspections</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Emergency Response Planning */}
          <section id="emergency-planning" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Emergency Response Planning
            </h2>
            
            <p className="text-lg mb-6">
              When prevention fails, effective emergency response plans enable quick, coordinated action that 
              minimizes harm and confusion. Well-designed plans provide clear guidance while maintaining 
              flexibility for specific circumstances.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Emergency Response Framework</h3>
            
            <div className="bg-destructive/5  rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold mb-4">The CALM Response Model</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-lg text-center">
                  <h5 className="font-semibold text-destructive  mb-2">C - Contain</h5>
                  <p className="text-sm">Stop the immediate threat and prevent escalation</p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <h5 className="font-semibold text-destructive  mb-2">A - Assess</h5>
                  <p className="text-sm">Evaluate the situation and resource needs</p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <h5 className="font-semibold text-destructive  mb-2">L - Lead</h5>
                  <p className="text-sm">Execute response plan with clear leadership</p>
                </div>
                <div className="bg-background p-4 rounded-lg text-center">
                  <h5 className="font-semibold text-destructive  mb-2">M - Monitor</h5>
                  <p className="text-sm">Track progress and adjust response as needed</p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Essential Emergency Plans</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Medical Emergency Response Plan
                </h4>
                <p className="mb-4">
                  Clear procedures for handling medical emergencies during club activities ensure rapid, 
                  appropriate response while maintaining member safety and legal compliance.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Immediate Response Protocol</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Ensure scene safety for responders and others</li>
                      <li>Call 911 immediately for serious injuries/illness</li>
                      <li>Provide first aid within trained capabilities</li>
                      <li>Notify club leadership and emergency contacts</li>
                      <li>Document incident details thoroughly</li>
                    </ol>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Preparation Requirements</h5>
                    <ul className="text-sm space-y-1">
                      <li>• First aid/CPR certified leaders at all events</li>
                      <li>• Stocked first aid kits in accessible locations</li>
                      <li>• Emergency contact database with medical info</li>
                      <li>• Clear communication plan for families</li>
                      <li>• Relationship with local emergency services</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-warning" />
                  Facility Emergency Procedures
                </h4>
                <p className="mb-4">
                  Weather emergencies, power outages, and facility damage require specific response procedures 
                  that prioritize member safety while protecting club assets.
                </p>
                <div className="space-y-4">
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Severe Weather Response</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">Tornado/Severe Storm</h6>
                        <ul className="space-y-1">
                          <li>• Move to designated safe areas immediately</li>
                          <li>• Account for all members present</li>
                          <li>• Monitor weather alerts continuously</li>
                          <li>• Communicate with families about status</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium mb-1">Flooding/Water Damage</h6>
                        <ul className="space-y-1">
                          <li>• Evacuate to higher ground safely</li>
                          <li>• Shut off utilities if safe to do so</li>
                          <li>• Document damage for insurance</li>
                          <li>• Arrange alternative meeting spaces</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Fire Emergency Protocol</h5>
                    <div className="text-sm space-y-2">
                      <p><strong>Immediate Actions:</strong> Activate fire alarm, call 911, begin orderly evacuation</p>
                      <p><strong>Evacuation Process:</strong> Use nearest safe exit, proceed to designated assembly area, take attendance</p>
                      <p><strong>Post-Emergency:</strong> Cooperate with fire officials, secure scene, communicate with members</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Security Incident Response
                </h4>
                <p className="mb-4">
                  Security threats, disruptive behavior, and safety concerns require measured responses that 
                  protect members while de-escalating potentially dangerous situations.
                </p>
                <div className="bg-primary/5  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Security Response Escalation</h5>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <span className="bg-success text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                      <div>
                        <h6 className="font-medium">Verbal De-escalation</h6>
                        <p>Calm communication, active listening, attempt to resolve peacefully</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="bg-warning text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                      <div>
                        <h6 className="font-medium">Administrative Intervention</h6>
                        <p>Involve club leadership, implement club policies, document incident</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <h6 className="font-medium">External Authority</h6>
                        <p>Contact law enforcement, facility security, or emergency services</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warning/5  border-l-4 border-warning p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-warning">
                <Bell className="w-5 h-5" />
                GatherGrove Emergency Communication Tools
              </h4>
              <p className="text-warning/80  mb-4">
                GatherGrove's emergency communication system enables instant alerts to all members, emergency 
                contact notifications, and status updates during crisis situations. Pre-configured message 
                templates ensure consistent, professional communication when time is critical.
              </p>
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-warning/30 bg-background hover:bg-warning/10 text-warning    h-9 px-3">
                Explore Emergency Features
              </Link>
            </div>
          </section>

          {/* Crisis Communication Strategies */}
          <section id="communication" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Crisis Communication Strategies
            </h2>
            
            <p className="text-lg mb-6">
              Effective crisis communication maintains trust, prevents misinformation, and demonstrates 
              leadership competence during challenging times. Strategic communication can actually strengthen 
              member relationships and organizational reputation when handled professionally.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Crisis Communication Principles</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Transparency and Honesty
                </h4>
                <p className="mb-4 text-sm">
                  Share accurate information promptly, acknowledge uncertainty when appropriate, and avoid 
                  speculation or promises you cannot keep.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Communicate facts as soon as they're verified</li>
                  <li>• Acknowledge what you don't yet know</li>
                  <li>• Correct misinformation quickly and clearly</li>
                  <li>• Provide regular updates even if no new information</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Speed and Consistency
                </h4>
                <p className="mb-4 text-sm">
                  Rapid response prevents information vacuums that fill with rumors. Consistent messaging 
                  across all channels maintains credibility and clarity.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Aim for initial response within 2 hours</li>
                  <li>• Use the same key messages across all platforms</li>
                  <li>• Designate single spokesperson for media</li>
                  <li>• Monitor and respond to member questions</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Communication Channel Strategy</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3">Multi-Channel Communication Plan</h4>
                <p className="mb-4">
                  Different channels serve different purposes and audiences during crisis communication. 
                  Use multiple channels strategically to ensure comprehensive reach and appropriate messaging.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-primary  mb-2">Immediate Notification</h5>
                    <ul className="text-sm space-y-1">
                        <li>• Push alerts for urgent safety issues</li>
                      <li>• Emergency phone tree for critical updates</li>
                      <li>• Push notifications through club app</li>
                      <li>• Direct calls for serious incidents</li>
                    </ul>
                  </div>
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Detailed Updates</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Email newsletters with comprehensive info</li>
                      <li>• Website crisis communication page</li>
                      <li>• Member portal announcements</li>
                      <li>• Video messages from leadership</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">External Relations</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Social media official statements</li>
                      <li>• Press releases for media</li>
                      <li>• Community stakeholder outreach</li>
                      <li>• Legal/regulatory notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3">Message Templates and Protocols</h4>
                <p className="mb-4">
                  Pre-written message templates ensure consistent, professional communication during high-stress 
                  situations when clear thinking may be compromised.
                </p>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Initial Crisis Notification Template</h5>
                    <div className="text-sm bg-background p-3 rounded border">
                      <p className="mb-2"><strong>Subject:</strong> Important Update: [Brief Description of Situation]</p>
                      <p className="mb-2"><strong>Dear [Club Name] Members,</strong></p>
                      <p className="mb-2">We want to inform you immediately about [specific situation]. The safety and well-being of our members is our top priority.</p>
                      <p className="mb-2"><strong>What happened:</strong> [Brief, factual description]</p>
                      <p className="mb-2"><strong>Current status:</strong> [What's being done now]</p>
                      <p className="mb-2"><strong>Next steps:</strong> [What will happen next]</p>
                      <p className="mb-2">We will provide updates as more information becomes available. If you have immediate questions or concerns, please contact [emergency contact].</p>
                      <p><strong>[Leadership signature]</strong></p>
                    </div>
                  </div>
                  
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Crisis Resolution Update Template</h5>
                    <div className="text-sm bg-background p-3 rounded border">
                      <p className="mb-2"><strong>Subject:</strong> Resolution Update: [Situation Description]</p>
                      <p className="mb-2">Thank you for your patience during [situation]. We are pleased to report that [resolution status].</p>
                      <p className="mb-2"><strong>Actions taken:</strong> [Summary of response measures]</p>
                      <p className="mb-2"><strong>Lessons learned:</strong> [Key improvements being implemented]</p>
                      <p className="mb-2"><strong>Looking forward:</strong> [How club is strengthening resilience]</p>
                      <p>We appreciate your continued support and trust in our leadership during this challenging time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Conflict Resolution Protocols */}
          <section id="conflict-resolution" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Conflict Resolution Protocols
            </h2>
            
            <p className="text-lg mb-6">
              Internal conflicts, while challenging, provide opportunities to strengthen relationships and 
              improve organizational processes. Systematic conflict resolution protects all parties while 
              maintaining club cohesion and member satisfaction.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Conflict Resolution Framework</h3>
            
            <div className="bg-primary/5  rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold mb-4">The BRIDGE Conflict Resolution Model</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">B - Build Rapport</h5>
                  <p className="text-sm">Establish trust and create safe communication environment</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">R - Reveal Issues</h5>
                  <p className="text-sm">Allow all parties to express concerns and perspectives</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">I - Identify Interests</h5>
                  <p className="text-sm">Discover underlying needs and motivations behind positions</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">D - Develop Options</h5>
                  <p className="text-sm">Brainstorm creative solutions that address all interests</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">G - Generate Agreement</h5>
                  <p className="text-sm">Negotiate mutually acceptable resolution with clear terms</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold text-primary  mb-1">E - Ensure Follow-up</h5>
                  <p className="text-sm">Monitor implementation and relationship restoration</p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Escalation and Resolution Procedures</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-success" />
                  Level 1: Direct Resolution
                </h4>
                <p className="mb-4">
                  Encourage parties to resolve conflicts directly when possible. Many issues can be resolved 
                  through improved communication and mutual understanding.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">When to Use Direct Resolution</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Misunderstandings or communication breakdowns</li>
                      <li>• Personality conflicts without policy violations</li>
                      <li>• Disagreements about club direction or priorities</li>
                      <li>• Resource allocation or scheduling conflicts</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Direct Resolution Support</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Provide conflict resolution training to members</li>
                      <li>• Offer neutral meeting spaces and facilitation</li>
                      <li>• Share communication guides and best practices</li>
                      <li>• Follow up to ensure lasting resolution</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-warning" />
                  Level 2: Mediated Resolution
                </h4>
                <p className="mb-4">
                  When direct resolution fails or conflicts involve policy violations, neutral mediation 
                  helps parties find mutually acceptable solutions with professional guidance.
                </p>
                <div className="space-y-4">
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Mediation Process</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Neutral mediator meets with each party separately</li>
                      <li>Joint session to establish ground rules and goals</li>
                      <li>Structured discussion of issues and interests</li>
                      <li>Collaborative problem-solving and option development</li>
                      <li>Written agreement with implementation timeline</li>
                      <li>Follow-up meetings to monitor progress</li>
                    </ol>
                  </div>
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Mediator Selection Criteria</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Neutral party with no stake in the outcome</li>
                      <li>• Experience in conflict resolution or mediation</li>
                      <li>• Respect and trust from all involved parties</li>
                      <li>• Understanding of club culture and dynamics</li>
                      <li>• Commitment to confidentiality and fairness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Level 3: Formal Resolution
                </h4>
                <p className="mb-4">
                  Serious violations, legal issues, or failed mediation require formal procedures with 
                  clear documentation, due process, and potential disciplinary actions.
                </p>
                <div className="bg-destructive/5  p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Formal Resolution Triggers</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-1">
                      <li>• Harassment or discrimination allegations</li>
                      <li>• Financial misconduct or fraud</li>
                      <li>• Safety violations or dangerous behavior</li>
                      <li>• Repeated policy violations after warnings</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Ethics violations by leadership</li>
                      <li>• Legal issues or potential liability</li>
                      <li>• Threats or intimidation of members</li>
                      <li>• Failure to comply with mediated agreements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Business Continuity Planning */}
          <section id="business-continuity" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Business Continuity Planning
            </h2>
            
            <p className="text-lg mb-6">
              Business continuity ensures your club can maintain essential functions during and after 
              crisis situations. Effective planning enables rapid recovery while protecting member 
              relationships and organizational assets.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Continuity Planning Elements</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Essential Functions Analysis
                </h4>
                <p className="mb-4">
                  Identify which club functions are absolutely essential for member safety, legal compliance, 
                  and organizational survival during crisis periods.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-destructive/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-destructive  mb-2">Critical (Must Continue)</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Member safety and emergency response</li>
                      <li>• Financial operations and obligations</li>
                      <li>• Legal compliance and reporting</li>
                      <li>• Insurance and liability management</li>
                    </ul>
                  </div>
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Important (Resume ASAP)</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Member communication and updates</li>
                      <li>• Core programming and activities</li>
                      <li>• Volunteer coordination</li>
                      <li>• Vendor and partner relationships</li>
                    </ul>
                  </div>
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-success  mb-2">Optional (When Capacity Allows)</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Special events and celebrations</li>
                      <li>• New member recruitment</li>
                      <li>• Facility improvements</li>
                      <li>• Long-term strategic planning</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Succession and Backup Planning
                </h4>
                <p className="mb-4">
                  Ensure critical roles can be filled immediately if key volunteers become unavailable 
                  during crisis situations or extended emergencies.
                </p>
                <div className="space-y-4">
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Key Role Succession Matrix</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Primary Role</th>
                            <th className="text-left p-2">Emergency Backup</th>
                            <th className="text-left p-2">Secondary Backup</th>
                            <th className="text-left p-2">Critical Functions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">President</td>
                            <td className="p-2">Vice President</td>
                            <td className="p-2">Past President</td>
                            <td className="p-2">External communication, board decisions</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Treasurer</td>
                            <td className="p-2">Assistant Treasurer</td>
                            <td className="p-2">Board Member</td>
                            <td className="p-2">Financial obligations, banking access</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Secretary</td>
                            <td className="p-2">Communications Chair</td>
                            <td className="p-2">Board Member</td>
                            <td className="p-2">Member communication, documentation</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Backup Preparation Requirements</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Cross-training on essential procedures and systems</li>
                      <li>• Access to critical accounts and information</li>
                      <li>• Regular updates on ongoing issues and priorities</li>
                      <li>• Clear authorization for emergency decision-making</li>
                      <li>• Contact information for key stakeholders</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Resource and Asset Protection
                </h4>
                <p className="mb-4">
                  Protect critical club assets and ensure access to essential resources during 
                  disruption periods. This includes both physical and digital assets.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-secondary  mb-2">Digital Asset Protection</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Regular data backups to secure cloud storage</li>
                      <li>• Multiple administrator access to critical systems</li>
                      <li>• Documentation of passwords and access procedures</li>
                      <li>• Alternative communication platform accounts</li>
                      <li>• Financial account access procedures</li>
                    </ul>
                  </div>
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold text-warning  mb-2">Physical Asset Security</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Secure storage for important documents</li>
                      <li>• Equipment inventory and insurance documentation</li>
                      <li>• Alternative venue arrangements and contacts</li>
                      <li>• Emergency supply kits and resources</li>
                      <li>• Key distribution and access control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recovery and Learning */}
          <section id="recovery" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Recovery and Learning
            </h2>
            
            <p className="text-lg mb-6">
              Post-crisis recovery provides opportunities to rebuild stronger systems, restore relationships, 
              and capture valuable lessons for future resilience. Systematic recovery planning ensures 
              long-term organizational strength.
            </p>

            <h3 className="text-2xl font-semibold mb-6">Recovery Planning Framework</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-success" />
                  Immediate Recovery (0-30 days)
                </h4>
                <p className="mb-4">
                  Focus on stabilizing operations, addressing immediate needs, and beginning the healing 
                  process for affected stakeholders.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-success/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Operational Stabilization</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Restore essential club functions</li>
                      <li>• Address safety and security concerns</li>
                      <li>• Communicate current status to members</li>
                      <li>• Secure temporary resources if needed</li>
                      <li>• Begin damage assessment process</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Stakeholder Support</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Provide counseling or support resources</li>
                      <li>• Address member concerns and questions</li>
                      <li>• Maintain regular communication updates</li>
                      <li>• Show appreciation for volunteer efforts</li>
                      <li>• Plan member appreciation activities</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Medium-term Recovery (1-6 months)
                </h4>
                <p className="mb-4">
                  Rebuild damaged systems, strengthen organizational resilience, and implement 
                  improvements based on crisis experience.
                </p>
                <div className="space-y-4">
                  <div className="bg-warning/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">System Rebuilding Priorities</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Complete damage assessment and insurance claims</li>
                      <li>Restore full operational capabilities</li>
                      <li>Rebuild member confidence and participation</li>
                      <li>Strengthen identified system weaknesses</li>
                      <li>Update policies and procedures based on lessons learned</li>
                      <li>Retrain volunteers on improved processes</li>
                    </ol>
                  </div>
                  
                  <div className="bg-secondary/5  p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Relationship Restoration</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Conduct member satisfaction surveys and feedback sessions</li>
                      <li>• Host community-building events and activities</li>
                      <li>• Recognize and thank crisis response volunteers</li>
                      <li>• Rebuild external partnerships and vendor relationships</li>
                      <li>• Strengthen board cohesion and leadership effectiveness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  Long-term Strengthening (6+ months)
                </h4>
                <p className="mb-4">
                  Build enhanced resilience, create institutional knowledge, and establish systems 
                  that prevent similar crises or enable better response.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">Resilience Building Initiatives</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-2">
                      <li>• Develop comprehensive crisis management manual</li>
                      <li>• Create leadership development and succession programs</li>
                      <li>• Build financial reserves and emergency funds</li>
                      <li>• Establish partnerships with other organizations</li>
                      <li>• Implement regular crisis preparedness training</li>
                    </ul>
                    <ul className="space-y-2">
                      <li>• Document institutional knowledge and procedures</li>
                      <li>• Create redundant systems for critical functions</li>
                      <li>• Develop member communication expertise</li>
                      <li>• Build relationships with professional crisis resources</li>
                      <li>• Regular review and update of all crisis plans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4 mt-8">After-Action Review Process</h3>
            
            <div className="border rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-3">Systematic Learning Framework</h4>
              <p className="mb-4">
                Conduct thorough analysis of crisis response to capture lessons learned and improve 
                future preparedness. This process strengthens organizational learning and resilience.
              </p>
              <div className="space-y-4">
                <div className="bg-primary/5  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Key Review Questions</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium mb-1">Response Effectiveness</h6>
                      <ul className="space-y-1">
                        <li>• What worked well in our crisis response?</li>
                        <li>• Where did our plans break down or prove inadequate?</li>
                        <li>• How effective was our communication?</li>
                        <li>• Did our leadership structure function properly?</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium mb-1">Future Improvements</h6>
                      <ul className="space-y-1">
                        <li>• What additional resources or training do we need?</li>
                        <li>• How can we strengthen our prevention efforts?</li>
                        <li>• What policies or procedures need updating?</li>
                        <li>• How can we build better stakeholder relationships?</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-success/5  p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Documentation and Knowledge Sharing</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Create detailed timeline and response documentation</li>
                    <li>• Record lessons learned and improvement recommendations</li>
                    <li>• Update crisis management plans and procedures</li>
                    <li>• Share insights with other clubs and organizations</li>
                    <li>• Build institutional memory for future leaders</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Implementation Guide */}
          <section id="implementation" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              Implementation Guide
            </h2>
            
            <p className="text-lg mb-6">
              Build comprehensive crisis management capabilities through this systematic implementation 
              approach. Each phase develops essential capabilities while building organizational 
              confidence and resilience.
            </p>

            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                  Assessment and Planning Phase (Months 1-2)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Evaluate current preparedness and develop comprehensive crisis management framework
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Risk Assessment and Analysis</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Conduct comprehensive risk identification workshop
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create risk assessment matrix and prioritization
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Review current insurance coverage and policies
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Analyze historical incidents and near-misses
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Framework Development</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Establish crisis management team and roles
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Create communication protocols and contact lists
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Develop basic emergency response procedures
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Design conflict resolution processes
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                  System Development Phase (Months 3-4)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Create detailed response plans and establish operational capabilities
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Plan Creation</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Write comprehensive emergency response plans
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Develop crisis communication templates and protocols
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create business continuity procedures
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Establish succession planning documentation
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Resource Preparation</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Assemble emergency supply kits and resources
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Set up backup communication systems
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Create secure document storage and backup systems
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        Establish relationships with external crisis resources
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                  Training and Testing Phase (Months 5-6)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Build competency through training and validate plans through testing
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Training Program</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Train crisis management team on procedures
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Provide conflict resolution training to leaders
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Educate members on emergency procedures
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Cross-train backups on critical functions
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Testing and Validation</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Conduct tabletop exercises for various scenarios
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Test communication systems and protocols
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Practice evacuation and emergency procedures
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        Refine plans based on testing outcomes
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                  Maintenance and Improvement Phase (Ongoing)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Maintain readiness through regular review, updates, and continuous improvement
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Regular Maintenance</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Quarterly review and update of all crisis plans
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Annual emergency drills and training refreshers
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Update contact lists and resource inventories
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Monitor and incorporate industry best practices
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Continuous Improvement</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Learn from other organizations' crisis experiences
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Adapt plans for changing club needs and risks
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Build organizational culture of preparedness
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        Share expertise with other clubs and organizations
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-success/5  border-l-4 border-success p-6 mt-8">
              <h4 className="text-xl font-semibold mb-3 flex items-center gap-2 text-success">
                <Shield className="w-5 h-5" />
                Crisis Management Success Indicators
              </h4>
              <p className="text-success/80  mb-4">
                Measure your crisis management maturity with these key indicators:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Preparedness Metrics</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Leadership trained in crisis response</li>
                    <li>• Annual emergency drills completed</li>
                    <li>• Crisis communication tested quarterly</li>
                    <li>• All key roles have trained backups</li>
                  </ul>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Response Effectiveness</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Crisis response activated within 2 hours</li>
                    <li>• Member satisfaction with crisis communication</li>
                    <li>• Successful conflict resolution without escalation</li>
                    <li>• Rapid return to normal operations post-crisis</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <ResourceArticleFooter resource={resource} />
        </article>
      </main>

      <Footer />
    </div>
  );
}
