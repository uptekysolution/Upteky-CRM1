'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  User, 
  Briefcase, 
  MapPin, 
  DollarSign,
  Calendar,
  Star,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface JobApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  phone?: string;
  jobTitle: string;
  department: string;
  experience: string;
  expectedSalary: string;
  location: string;
  source: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  appliedDate: string;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
  rating?: number;
  skills: string[];
  currentCompany?: string;
  currentPosition?: string;
}

export function JobApplicationManager() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([
    {
      id: '1',
      candidateName: 'Emily Rodriguez',
      candidateEmail: 'emily.rodriguez@email.com',
      phone: '+1 (555) 123-4567',
      jobTitle: 'Senior Frontend Developer',
      department: 'Engineering',
      experience: '5 years',
      expectedSalary: '$85,000 - $95,000',
      location: 'Remote',
      source: 'LinkedIn',
      status: 'shortlisted',
      appliedDate: '2024-01-10',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      currentCompany: 'TechCorp Inc.',
      currentPosition: 'Frontend Developer',
      rating: 4
    },
    {
      id: '2',
      candidateName: 'David Kim',
      candidateEmail: 'david.kim@email.com',
      phone: '+1 (555) 987-6543',
      jobTitle: 'Product Manager',
      department: 'Product',
      experience: '7 years',
      expectedSalary: '$100,000 - $120,000',
      location: 'San Francisco, CA',
      source: 'Company Website',
      status: 'reviewing',
      appliedDate: '2024-01-12',
      skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis'],
      currentCompany: 'StartupXYZ',
      currentPosition: 'Senior Product Manager',
      rating: 5
    }
  ]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdateStatus = (applicationId: string, status: JobApplication['status']) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, status } : app
    ));
    toast({
      title: "Status Updated!",
      description: "Application status has been updated successfully.",
    });
  };

  const handleDeleteApplication = (applicationId: string) => {
    setApplications(prev => prev.filter(app => app.id !== applicationId));
    toast({
      title: "Application Deleted!",
      description: "Application has been removed from the system.",
    });
  };

  const handleRateApplication = (applicationId: string, rating: number) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, rating } : app
    ));
    toast({
      title: "Rating Updated!",
      description: "Application rating has been updated.",
    });
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusStats = () => {
    return {
      new: applications.filter(app => app.status === 'new').length,
      reviewing: applications.filter(app => app.status === 'reviewing').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      interviewed: applications.filter(app => app.status === 'interviewed').length,
      offered: applications.filter(app => app.status === 'offered').length,
      hired: applications.filter(app => app.status === 'hired').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      total: applications.length
    };
  };

  const stats = getStatusStats();

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shortlisted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'interviewed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'offered': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'hired': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-yellow-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.reviewing + stats.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shortlisted</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.shortlisted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hired</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.hired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Management */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-700 to-purple-500 rounded-full"></div>
              <CardTitle className="text-xl font-light text-gray-900">Job Applications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                    {application.rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 cursor-pointer ${
                              star <= application.rating! 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                            onClick={() => handleRateApplication(application.id, star)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{application.candidateName}</h4>
                    <p className="text-sm text-gray-600">{application.candidateEmail}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {application.jobTitle}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {application.location}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {application.expectedSalary}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {application.currentCompany && (
                      <p className="text-xs text-gray-500 mt-1">
                        Currently at {application.currentCompany} as {application.currentPosition}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {application.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {application.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{application.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {application.resumeUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(application.resumeUrl, '_blank')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteApplication(application.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredApplications.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No applications found for the selected criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full"></div>
            <CardTitle className="text-xl font-light text-gray-900">Quick Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Rejection Emails
            </Button>
            <Button 
              variant="outline" 
              className="h-16 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Interviews
            </Button>
            <Button 
              variant="outline" 
              className="h-16 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Applications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
