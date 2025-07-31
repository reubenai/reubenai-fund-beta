import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Vote, Users, Plus, Clock } from 'lucide-react';
import { useFund } from '@/contexts/FundContext'; // Updated import

export default function IC() {
  const { selectedFund } = useFund();
  const [activeTab, setActiveTab] = useState('pipeline');

  if (!selectedFund) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Committee</h1>
          <p className="text-muted-foreground">Manage IC meetings, memos, and decisions</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Please select a fund to access Investment Committee features</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Committee</h1>
        <p className="text-muted-foreground">
          Manage IC meetings, memos, and decisions for {selectedFund.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Deal Pipeline
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            IC Sessions
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Voting & Decisions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Deal Pipeline</h2>
              <p className="text-muted-foreground">
                Deals ready for IC review and memo generation
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Memo
            </Button>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      CleanTech Solutions
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Promising
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Renewable energy technology for industrial applications
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                    <div className="text-2xl font-bold">72</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">Deal Size:</span> $2.5M
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Valuation:</span> $15M
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Stage:</span> Series A
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Memo Pending</Badge>
                    <Button variant="outline" size="sm">
                      Generate IC Memo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No additional deals ready for IC review
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
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
              <h2 className="text-2xl font-semibold">IC Sessions</h2>
              <p className="text-muted-foreground">
                Schedule and manage Investment Committee meetings
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Q1 2024 IC Meeting #3
                      <Badge>Scheduled</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      March 15, 2024 at 2:00 PM EST
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">5 participants</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Agenda</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">CleanTech Solutions Review</div>
                          <div className="text-sm text-muted-foreground">Series A Investment Decision</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">30 mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Edit Session
                    </Button>
                    <Button size="sm">
                      Join Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No upcoming IC sessions scheduled
                  </p>
                  <Button variant="outline" className="mt-4">
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
              <h2 className="text-2xl font-semibold">Voting & Decisions</h2>
              <p className="text-muted-foreground">
                Track voting progress and investment decisions
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Vote
            </Button>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>CleanTech Solutions Investment Decision</CardTitle>
                    <CardDescription>
                      $2.5M Series A Investment - Voting deadline: March 20, 2024
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Active Voting</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">3</div>
                      <div className="text-sm text-muted-foreground">Approve</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <div className="text-sm text-muted-foreground">Reject</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">1</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No active voting sessions
                  </p>
                  <Button variant="outline" className="mt-4">
                    Create Voting Decision
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}