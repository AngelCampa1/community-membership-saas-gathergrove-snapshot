export function FeatureComparisonMatrix() {
  return (
    <section id="comparison" className="py-20 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Stop Juggling Multiple Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how GatherGrove replaces your scattered toolkit with one comprehensive platform
          </p>
        </div>

        {/* Tool Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Current Setup */}
          <div className="relative">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
              Your Current Setup
            </h3>
            <div className="bg-muted/30 rounded-2xl p-6 min-h-80">
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-sm border-2 border-destructive/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Excel/Sheets</div>
                      <div className="text-xs text-destructive font-bold">$0-10/mo</div>
                    </div>
                    <div className="text-2xl">📊</div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm border-2 border-destructive/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Payment Tools</div>
                      <div className="text-xs text-destructive font-bold">Complex setup</div>
                    </div>
                    <div className="text-2xl">💳</div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm border-2 border-destructive/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">MailChimp</div>
                      <div className="text-xs text-destructive font-bold">$20-50/mo</div>
                    </div>
                    <div className="text-2xl">📧</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-destructive/10 rounded-lg p-3 text-center">
                <div className="text-sm text-destructive-foreground font-medium">Administrative Burden</div>
                <div className="text-2xl font-bold text-destructive">20+ hours/month</div>
              </div>
            </div>
          </div>

          {/* GatherGrove Solution */}
          <div className="relative">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
              With GatherGrove
            </h3>
            <div className="bg-gradient-to-br from-primary/10 to-primary/20   rounded-2xl p-6 min-h-80">
              <div className="h-full bg-card rounded-xl p-6 shadow-lg border-2 border-primary/30 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🎯</div>
                <h4 className="text-xl font-bold text-foreground mb-2">All-in-One Platform</h4>
                <div className="text-sm text-muted-foreground mb-4 text-center">
                  Member management • Payments • Events<br />
                  Communication • Mobile apps • Analytics
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <div className="text-sm text-success  font-medium">Time Efficiency</div>
                  <div className="text-2xl font-bold text-success">5 hours/month</div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-success  text-white rounded-full px-4 py-2 font-bold shadow-lg">
                Save 15+ hours/mo
              </div>
            </div>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-muted/50 border-b p-6">
            <h3 className="text-2xl font-bold text-center text-foreground">
              Feature-by-Feature Comparison
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-left p-4 font-semibold text-foreground">Current Tools</th>
                  <th className="text-left p-4 font-semibold text-foreground">GatherGrove</th>
                  <th className="text-left p-4 font-semibold text-foreground">Benefit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">Member Database</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">✗</span>
                      <span className="text-muted-foreground">Spreadsheets (manual)</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-foreground font-medium">Professional CRM</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success  px-3 py-1 rounded-full text-sm font-medium">
                      10+ hours/month
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">Payment Processing</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">✗</span>
                      <span className="text-muted-foreground">Manual tracking</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-foreground font-medium">Automated collection</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success  px-3 py-1 rounded-full text-sm font-medium">
                      70% better collection
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">Communication</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">✗</span>
                      <span className="text-muted-foreground">Separate tools</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-foreground font-medium">Multi-channel platform</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success  px-3 py-1 rounded-full text-sm font-medium">
                      $40-80/month
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">Event Management</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">✗</span>
                      <span className="text-muted-foreground">Basic posts</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-foreground font-medium">Full RSVP system</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success  px-3 py-1 rounded-full text-sm font-medium">
                      5+ hours/event
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">Mobile Access</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">✗</span>
                      <span className="text-muted-foreground">No dedicated app</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="text-foreground font-medium">Native iOS/Android</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success  px-3 py-1 rounded-full text-sm font-medium">
                      Always accessible
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}