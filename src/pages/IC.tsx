import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Vote, Users, Plus, Clock } from 'lucide-react';
import { useFund } from '@/contexts/FundContext'; 
import { ICMemoModal } from '@/components/ic/ICMemoModal';

export default function IC() {
  const { selectedFund } = useFund();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showMemoModal, setShowMemoModal] = useState(false);

  if (!selectedFund) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
          <p className="text-sm text-muted-foreground">Manage IC meetings, memos, and decisions</p>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Please select a fund to access Investment Committee features</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
        <p className="text-sm text-muted-foreground">
          Manage IC meetings, memos, and decisions for {selectedFund.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
          <TabsTrigger value="pipeline" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            Deal Pipeline
          </TabsTrigger>
          <TabsTrigger value="sessions" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            IC Sessions
          </TabsTrigger>
          <TabsTrigger value="voting" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Vote className="h-4 w-4 mr-2" />
            Voting & Decisions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Deal Pipeline</h2>
              <p className="text-sm text-muted-foreground">
                Deals ready for IC review and memo generation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-foreground">CleanTech Solutions</h3>
                      <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        Promising
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Renewable energy technology for industrial applications
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span><span className="font-medium text-foreground">Deal Size:</span> $2.5M</span>
                      <span><span className="font-medium text-foreground">Valuation:</span> $15M</span>
                      <span><span className="font-medium text-foreground">Stage:</span> Series A</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">AI Score</div>
                      <div className="text-xl font-semibold text-foreground">72</div>
                    </div>
                    <Button 
                      onClick={() => setShowMemoModal(true)}
                      className="h-9 px-4 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Memo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-dashed border-border">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No additional deals ready for IC review
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deals will appear here when they reach the "Decision" stage
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">IC Sessions</h2>
              <p className="text-sm text-muted-foreground">
                Schedule and manage Investment Committee meetings
              </p>
            </div>
            <Button className="h-9 px-4 text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-foreground">Q1 2024 IC Meeting #3</h3>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      March 15, 2024 at 2:00 PM EST
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>5 participants</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Agenda</h4>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-foreground">CleanTech Solutions Review</div>
                          <div className="text-xs text-muted-foreground">Series A Investment Decision</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>30 mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Edit Session
                    </Button>
                    <Button size="sm" className="h-8 px-3 text-xs">
                      Join Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-dashed border-border">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming IC sessions scheduled
                  </p>
                  <Button variant="outline" className="mt-4 h-9 px-4 text-sm">
                    Schedule Your First Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voting" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Voting & Decisions</h2>
              <p className="text-sm text-muted-foreground">
                Track voting progress and investment decisions
              </p>
            </div>
            <Button className="h-9 px-4 text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Vote
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-medium text-foreground">CleanTech Solutions Investment Decision</h3>
                    <p className="text-sm text-muted-foreground">
                      $2.5M Series A Investment - Voting deadline: March 20, 2024
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">Active Voting</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50/50 rounded-lg">
                      <div className="text-xl font-semibold text-green-600">3</div>
                      <div className="text-xs text-muted-foreground">Approve</div>
                    </div>
                    <div className="text-center p-4 bg-red-50/50 rounded-lg">
                      <div className="text-xl font-semibold text-red-600">1</div>
                      <div className="text-xs text-muted-foreground">Reject</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-xl font-semibold text-muted-foreground">1</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-dashed border-border">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Vote className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No active voting sessions
                  </p>
                  <Button variant="outline" className="mt-4 h-9 px-4 text-sm">
                    Create Voting Decision
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ICMemoModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        fundId={selectedFund.id}
      />
    </div>
  );
}