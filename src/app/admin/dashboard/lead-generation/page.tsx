
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { HiringLeadImport } from '@/components/hiring/HiringLeadImport';
import { MeetingScheduler } from '@/components/hiring/MeetingScheduler';
import { JobApplicationManager } from '@/components/hiring/JobApplicationManager';
import { HiringAnalytics } from '@/components/hiring/HiringAnalytics';

export default function LeadGenerationPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('import');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-800 to-blue-600 rounded-full"></div>
                    <h1 className="text-4xl font-light tracking-wide text-gray-900">Hiring & Lead Management</h1>
                </div>
                <p className="text-gray-600 font-light ml-4">
                    Comprehensive hiring pipeline management with Excel import, meeting scheduling, and job application tracking.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Leads</p>
                                <p className="text-2xl font-semibold text-gray-900">1,247</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Scheduled Meetings</p>
                                <p className="text-2xl font-semibold text-gray-900">89</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Job Applications</p>
                                <p className="text-2xl font-semibold text-gray-900">456</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 rounded-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-semibold text-gray-900">23.4%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <TabsTrigger 
                        value="import" 
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                    >
                        <Upload className="h-4 w-4" />
                        Excel Import
                    </TabsTrigger>
                    <TabsTrigger 
                        value="meetings" 
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                    >
                        <Calendar className="h-4 w-4" />
                        Meetings
                    </TabsTrigger>
                    <TabsTrigger 
                        value="applications" 
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                    >
                        <FileText className="h-4 w-4" />
                        Applications
                    </TabsTrigger>
                    <TabsTrigger 
                        value="leads" 
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                    >
                        <Users className="h-4 w-4" />
                        Lead Management
                    </TabsTrigger>
                    <TabsTrigger 
                        value="analytics" 
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Excel Import Tab */}
                <TabsContent value="import" className="space-y-6">
                    <HiringLeadImport />
                </TabsContent>

                {/* Meetings Tab */}
                <TabsContent value="meetings" className="space-y-6">
                    <MeetingScheduler />
                </TabsContent>

                {/* Applications Tab */}
                <TabsContent value="applications" className="space-y-6">
                    <JobApplicationManager />
                </TabsContent>

                {/* Lead Management Tab */}
                <TabsContent value="leads" className="space-y-6">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-gray-700 to-gray-500 rounded-full"></div>
                                <CardTitle className="text-xl font-light text-gray-900">Lead Management</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Embeddable Web Form</h3>
                                    <p className="text-muted-foreground mb-4">
                                       Generate and embed an HTML form on your website or landing pages to automatically capture leads into the CRM.
                                    </p>
                                    <Card className="bg-muted/50">
                                        <CardHeader>
                                            <CardTitle className="text-base">Form Builder</CardTitle>
                                            <CardDescription className="text-xs">Select the fields to include in your form.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="name" defaultChecked disabled className="rounded" />
                                                <Label htmlFor="name">Full Name (Required)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="email" defaultChecked disabled className="rounded" />
                                                <Label htmlFor="email">Email (Required)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="company" className="rounded" />
                                                <Label htmlFor="company">Company</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="phone" className="rounded" />
                                                <Label htmlFor="phone">Phone Number</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="message" className="rounded" />
                                                <Label htmlFor="message">Message</Label>
                                            </div>
                                            <Button 
                                                onClick={() => {
        const code = `<form action="/api/leads" method="POST">
  <div>
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  <button type="submit">Submit</button>
</form>`;
        navigator.clipboard.writeText(code);
        toast({
            title: "Code Copied!",
            description: "The HTML form code has been copied to your clipboard.",
        });
                                                }}
                                                className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white border-0 rounded-lg"
                                            >
                                                Generate & Copy Code
                                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2">Manual Lead Entry</h3>
                    <p className="text-muted-foreground mb-4">
                        Have a lead from a call or event? Add them directly into the CRM pipeline using this form.
                    </p>
                                    <Button className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white border-0 rounded-lg">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create New Lead
                                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    <HiringAnalytics />
                </TabsContent>
            </Tabs>
    </div>
  );
}
