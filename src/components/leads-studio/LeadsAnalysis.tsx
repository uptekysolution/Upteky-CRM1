'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Mail, 
  Phone, 
  Building, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface LeadsAnalysisProps {
  data: string[][];
  sheetKey: string;
  lastSaved?: string;
  hasUnsavedChanges?: boolean;
}

export function LeadsAnalysis({ data, sheetKey, lastSaved, hasUnsavedChanges }: LeadsAnalysisProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalLeads: 0,
        uniqueEmails: 0,
        uniqueDomains: 0,
        uniquePhones: 0,
        uniqueCompanies: 0,
        stageBreakdown: {},
        sourceBreakdown: {},
        ownerBreakdown: {},
        recentLeads: 0,
        conversionRate: 0,
      };
    }

    const headers = data[0] || [];
    const rows = data.slice(1); // Skip header row

    // Find column indices
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
    const companyIndex = headers.findIndex(h => h.toLowerCase().includes('company') || h.toLowerCase().includes('organization'));
    const stageIndex = headers.findIndex(h => h.toLowerCase().includes('stage') || h.toLowerCase().includes('status'));
    const sourceIndex = headers.findIndex(h => h.toLowerCase().includes('source') || h.toLowerCase().includes('origin'));
    const ownerIndex = headers.findIndex(h => h.toLowerCase().includes('owner') || h.toLowerCase().includes('assigned'));
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('created'));

    // Calculate statistics
    const emails = rows.map(row => row[emailIndex] || '').filter(Boolean);
    const phones = rows.map(row => row[phoneIndex] || '').filter(Boolean);
    const companies = rows.map(row => row[companyIndex] || '').filter(Boolean);
    const stages = rows.map(row => row[stageIndex] || '').filter(Boolean);
    const sources = rows.map(row => row[sourceIndex] || '').filter(Boolean);
    const owners = rows.map(row => row[ownerIndex] || '').filter(Boolean);
    const dates = rows.map(row => row[dateIndex] || '').filter(Boolean);

    // Unique counts
    const uniqueEmails = new Set(emails).size;
    const uniqueDomains = new Set(emails.map(email => email.split('@')[1]).filter(Boolean)).size;
    const uniquePhones = new Set(phones).size;
    const uniqueCompanies = new Set(companies).size;

    // Stage breakdown
    const stageBreakdown = stages.reduce((acc, stage) => {
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Source breakdown
    const sourceBreakdown = sources.reduce((acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Owner breakdown
    const ownerBreakdown = owners.reduce((acc, owner) => {
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent leads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLeads = dates.filter(dateStr => {
      try {
        const date = new Date(dateStr);
        return date >= thirtyDaysAgo;
      } catch {
        return false;
      }
    }).length;

    // Conversion rate (assuming stages like 'Converted', 'Won', 'Closed' indicate success)
    const convertedStages = ['converted', 'won', 'closed', 'success', 'completed'];
    const convertedCount = stages.filter(stage => 
      convertedStages.some(converted => stage.toLowerCase().includes(converted))
    ).length;
    const conversionRate = stages.length > 0 ? (convertedCount / stages.length) * 100 : 0;

    return {
      totalLeads: rows.length,
      uniqueEmails,
      uniqueDomains,
      uniquePhones,
      uniqueCompanies,
      stageBreakdown,
      sourceBreakdown,
      ownerBreakdown,
      recentLeads,
      conversionRate,
    };
  }, [data]);

  const getStageColor = (stage: string) => {
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('qualified') || stageLower.includes('prospect')) return 'bg-blue-100 text-blue-800';
    if (stageLower.includes('converted') || stageLower.includes('won')) return 'bg-green-100 text-green-800';
    if (stageLower.includes('lost') || stageLower.includes('rejected')) return 'bg-red-100 text-red-800';
    if (stageLower.includes('contacted') || stageLower.includes('follow-up')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900">Sheet Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Saved</span>
            <span className="text-sm font-medium text-gray-900">
              {lastSaved ? new Date(lastSaved).toLocaleString() : 'Never'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge 
              variant={hasUnsavedChanges ? "destructive" : "secondary"}
              className={hasUnsavedChanges ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
            >
              {hasUnsavedChanges ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unsaved
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Saved
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900">Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.totalLeads}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Unique Emails</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.uniqueEmails}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Unique Companies</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.uniqueCompanies}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Breakdown */}
      {Object.keys(analysis.stageBreakdown).length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900">Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {Object.entries(analysis.stageBreakdown)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <Badge className={getStageColor(stage)}>
                    {stage}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Source Breakdown */}
      {Object.keys(analysis.sourceBreakdown).length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-yellow-50/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900">Top Sources</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {Object.entries(analysis.sourceBreakdown)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate">{source || 'Unknown'}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-indigo-50/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-600">Last 30 Days</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.recentLeads}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-600">Avg. Daily</p>
              <p className="text-lg font-semibold text-gray-900">
                {analysis.recentLeads > 0 ? (analysis.recentLeads / 30).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Double-click cells to edit</p>
            <p>• Use formulas like =SUM(A1:A10)</p>
            <p>• Drag to resize columns/rows</p>
            <p>• Ctrl+C/V for copy/paste</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
