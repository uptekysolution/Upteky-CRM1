'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  FileText,
  Clock,
  DollarSign,
  MapPin,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export function HiringAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data - in real app, this would come from API
  const analyticsData = {
    totalLeads: 1247,
    totalApplications: 456,
    totalMeetings: 89,
    totalHires: 23,
    conversionRate: 23.4,
    avgTimeToHire: 18,
    avgSalary: 85000,
    topSources: [
      { source: 'LinkedIn', count: 234, percentage: 45 },
      { source: 'Company Website', count: 156, percentage: 30 },
      { source: 'Referrals', count: 89, percentage: 17 },
      { source: 'Job Boards', count: 45, percentage: 8 }
    ],
    departmentStats: [
      { department: 'Engineering', applications: 156, hires: 12, avgSalary: 95000 },
      { department: 'Product', applications: 89, hires: 5, avgSalary: 110000 },
      { department: 'Sales', applications: 67, hires: 3, avgSalary: 75000 },
      { department: 'Marketing', applications: 45, hires: 2, avgSalary: 70000 },
      { department: 'HR', applications: 23, hires: 1, avgSalary: 65000 }
    ],
    monthlyTrends: [
      { month: 'Jan', leads: 120, applications: 45, hires: 3 },
      { month: 'Feb', leads: 135, applications: 52, hires: 4 },
      { month: 'Mar', leads: 110, applications: 38, hires: 2 },
      { month: 'Apr', leads: 145, applications: 58, hires: 5 },
      { month: 'May', leads: 160, applications: 62, hires: 6 },
      { month: 'Jun', leads: 140, applications: 55, hires: 4 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalLeads}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalApplications}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+8.3%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.conversionRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+2.1%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Time to Hire</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.avgTimeToHire} days</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">-3.2 days</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Sources */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full"></div>
            <CardTitle className="text-xl font-light text-gray-900">Lead Sources</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {analyticsData.topSources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{source.source}</h4>
                    <p className="text-sm text-gray-600">{source.count} leads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-700 to-purple-500 rounded-full"></div>
            <CardTitle className="text-xl font-light text-gray-900">Department Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Applications</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Hires</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Conversion</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Avg Salary</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.departmentStats.map((dept) => (
                  <tr key={dept.department} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{dept.department}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600">{dept.applications}</td>
                    <td className="text-center py-3 px-4 text-gray-600">{dept.hires}</td>
                    <td className="text-center py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {((dept.hires / dept.applications) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600">
                      ${dept.avgSalary.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-green-700 to-green-500 rounded-full"></div>
              <CardTitle className="text-xl font-light text-gray-900">Monthly Trends</CardTitle>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData.monthlyTrends.slice(-3).map((trend) => (
              <div key={trend.month} className="p-4 bg-white border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{trend.month}</h4>
                  <Badge variant="outline" className="text-xs">
                    {trend.hires} hires
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Leads</span>
                    <span className="font-medium text-gray-900">{trend.leads}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Applications</span>
                    <span className="font-medium text-gray-900">{trend.applications}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Hires</span>
                    <span className="font-medium text-green-600">{trend.hires}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full"></div>
            <CardTitle className="text-xl font-light text-gray-900">Quick Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900">Top Performing Source</h4>
              </div>
              <p className="text-sm text-gray-600">
                LinkedIn continues to be our best lead source, generating 45% of all applications with a 28% conversion rate.
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">Time to Hire</h4>
              </div>
              <p className="text-sm text-gray-600">
                Average time to hire has decreased by 3.2 days this quarter, with Engineering roles being the fastest to fill.
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900">Salary Trends</h4>
              </div>
              <p className="text-sm text-gray-600">
                Average salary for new hires is $85,000, with Product roles commanding the highest salaries at $110,000.
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-orange-600" />
                </div>
                <h4 className="font-medium text-gray-900">Location Insights</h4>
              </div>
              <p className="text-sm text-gray-600">
                65% of applications are for remote positions, with San Francisco and New York being the top on-site locations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
