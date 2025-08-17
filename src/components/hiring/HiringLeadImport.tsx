'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportedData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  experience?: string;
  source?: string;
  notes?: string;
  type: 'meeting' | 'application' | 'lead';
  status: 'pending' | 'processed' | 'error';
  meetingDate?: string;
  meetingTime?: string;
  jobTitle?: string;
  salary?: string;
  location?: string;
}

export function HiringLeadImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<ImportedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'application' | 'lead'>('all');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await readExcelFile(file);
      const processedData = processExcelData(data);
      setImportedData(processedData);
      
      toast({
        title: "File Imported Successfully!",
        description: `Processed ${processedData.length} records from the Excel file.`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Import Error",
        description: "Failed to process the Excel file. Please check the format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelData = (data: any[]): ImportedData[] => {
    return data.map((row, index) => {
      // Determine the type based on column names and data
      let type: 'meeting' | 'application' | 'lead' = 'lead';
      let meetingDate, meetingTime, jobTitle, salary, location;

      if (row['Meeting Date'] || row['meeting_date'] || row['Interview Date']) {
        type = 'meeting';
        meetingDate = row['Meeting Date'] || row['meeting_date'] || row['Interview Date'];
        meetingTime = row['Meeting Time'] || row['meeting_time'] || row['Interview Time'];
      } else if (row['Job Title'] || row['job_title'] || row['Position Applied'] || row['Experience']) {
        type = 'application';
        jobTitle = row['Job Title'] || row['job_title'] || row['Position Applied'];
        salary = row['Expected Salary'] || row['salary'] || row['Salary Range'];
        location = row['Location'] || row['Preferred Location'] || row['location'];
      }

      return {
        id: `import-${index}`,
        name: row['Name'] || row['Full Name'] || row['name'] || row['full_name'] || 'Unknown',
        email: row['Email'] || row['email'] || '',
        phone: row['Phone'] || row['Phone Number'] || row['phone'] || row['phone_number'],
        company: row['Company'] || row['Current Company'] || row['company'],
        position: row['Position'] || row['Current Position'] || row['position'],
        experience: row['Experience'] || row['Years of Experience'] || row['experience'],
        source: row['Source'] || row['Lead Source'] || row['source'],
        notes: row['Notes'] || row['Comments'] || row['notes'],
        type,
        status: 'pending',
        meetingDate,
        meetingTime,
        jobTitle,
        salary,
        location
      };
    });
  };

  const handleProcessData = async () => {
    setIsProcessing(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedData = importedData.map(item => ({
        ...item,
        status: 'processed' as const
      }));
      
      setImportedData(updatedData);
      
      toast({
        title: "Data Processed Successfully!",
        description: `Successfully processed ${updatedData.length} records.`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setImportedData(prev => prev.filter(item => item.id !== id));
  };

  const filteredData = importedData.filter(item => 
    filterType === 'all' || item.type === filterType
  );

  const getTypeStats = () => {
    const stats = {
      meeting: importedData.filter(item => item.type === 'meeting').length,
      application: importedData.filter(item => item.type === 'application').length,
      lead: importedData.filter(item => item.type === 'lead').length,
      total: importedData.length
    };
    return stats;
  };

  const stats = getTypeStats();

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full"></div>
            <CardTitle className="text-xl font-light text-gray-900">Excel Import & Processing</CardTitle>
          </div>
          <CardDescription>
            Upload Excel files containing leads, job applications, or meeting schedules. The system will automatically categorize and process the data.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
            <p className="text-gray-600 mb-4">
              Supported formats: .xlsx, .xls, .csv<br />
              The system will automatically detect and categorize: meetings, job applications, and general leads
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Choose File'}
            </Button>
          </div>

          {/* Sample Template Download */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Need a template?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download our Excel template with the correct column headers for optimal data processing.
            </p>
            <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Statistics */}
      {importedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
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
                  <p className="text-sm text-gray-600">Meetings</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.meeting}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.application}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">General Leads</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.lead}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Preview and Processing */}
      {importedData.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to-r from-gray-700 to-gray-500 rounded-full"></div>
                <CardTitle className="text-xl font-light text-gray-900">Data Preview & Processing</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="meeting">Meetings</option>
                  <option value="application">Applications</option>
                  <option value="lead">Leads</option>
                </select>
                <Button 
                  onClick={handleProcessData}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white border-0 rounded-lg"
                >
                  {isProcessing ? 'Processing...' : 'Process All Data'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'meeting' && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Calendar className="h-3 w-3 mr-1" />
                          Meeting
                        </Badge>
                      )}
                      {item.type === 'application' && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <FileSpreadsheet className="h-3 w-3 mr-1" />
                          Application
                        </Badge>
                      )}
                      {item.type === 'lead' && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Users className="h-3 w-3 mr-1" />
                          Lead
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.email}</p>
                      {item.company && (
                        <p className="text-xs text-gray-500">{item.company}</p>
                      )}
                      {item.meetingDate && (
                        <p className="text-xs text-green-600">Meeting: {item.meetingDate} {item.meetingTime}</p>
                      )}
                      {item.jobTitle && (
                        <p className="text-xs text-purple-600">Position: {item.jobTitle}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.status === 'processed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
