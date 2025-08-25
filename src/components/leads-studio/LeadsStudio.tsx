'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Save, 
  Download, 
  BarChart3, 
  Users, 
  Mail, 
  Phone,
  Building,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { LeadsAnalysis } from './LeadsAnalysis';
import { SetupGuide } from './SetupGuide';

// Dynamically import Luckysheet to avoid SSR issues
const Luckysheet = dynamic(() => import('./LuckysheetWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading spreadsheet...</p>
      </div>
    </div>
  ),
});

interface SheetData {
  [key: string]: string[][];
}

interface SheetMetadata {
  [key: string]: {
    title?: string;
    lastModified?: string;
    sheets?: any[];
  };
}

const SHEET_TABS = [
  { key: 'chatbot', label: 'Chatbot Leads', icon: Users },
  { key: 'voicebot', label: 'Voicebot Leads', icon: Phone },
  { key: 'career', label: 'Career Page', icon: Building },
  { key: 'footer', label: 'Footer', icon: Mail },
  { key: 'contact', label: 'Contact Page', icon: Calendar },
];

export function LeadsStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chatbot');
  const [sheetData, setSheetData] = useState<SheetData>({});
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});
  const [hasConfigError, setHasConfigError] = useState(false);
  
  const spreadsheetRefs = useRef<Record<string, any>>({});

  // Load data for a specific sheet
  const loadSheetData = useCallback(async (sheetKey: string) => {
    if (sheetData[sheetKey]) return; // Already loaded

    setIsLoading(prev => ({ ...prev, [sheetKey]: true }));
    
    try {
      const response = await fetch(`/api/leads-sheets?sheetKey=${sheetKey}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to load ${sheetKey} data`);
      }
      
      const result = await response.json();
      
      setSheetData(prev => ({
        ...prev,
        [sheetKey]: result.data
      }));
      
      setSheetMetadata(prev => ({
        ...prev,
        [sheetKey]: result.metadata
      }));
      
      setLastSaved(prev => ({
        ...prev,
        [sheetKey]: result.lastUpdated
      }));
      
      // Clear config error if we successfully loaded data
      setHasConfigError(false);
      
    } catch (error) {
      console.error(`Error loading ${sheetKey} data:`, error);
      
      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('Google service account credentials not configured')) {
        setHasConfigError(true);
        toast({
          variant: 'destructive',
          title: 'Configuration Required',
          description: 'Google Sheets integration not configured. Please check the setup guide.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to load ${sheetKey} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      
      // Set default data for UI testing
      setSheetData(prev => ({
        ...prev,
        [sheetKey]: [['Name', 'Email', 'Phone', 'Source', 'Stage', 'Owner', 'Created At']]
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [sheetKey]: false }));
    }
  }, [sheetData, toast]);

  // Save data for a specific sheet
  const saveSheetData = useCallback(async (sheetKey: string) => {
    const spreadsheetRef = spreadsheetRefs.current[sheetKey];
    if (!spreadsheetRef) return;

    setIsSaving(prev => ({ ...prev, [sheetKey]: true }));
    
    try {
      // Get current data from spreadsheet
      const currentData = spreadsheetRef.getSheetData();
      
      const response = await fetch(`/api/leads-sheets?sheetKey=${sheetKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: currentData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }
      
      const result = await response.json();
      
      setSheetData(prev => ({
        ...prev,
        [sheetKey]: currentData
      }));
      
      setHasUnsavedChanges(prev => ({
        ...prev,
        [sheetKey]: false
      }));
      
      setLastSaved(prev => ({
        ...prev,
        [sheetKey]: result.savedAt
      }));
      
      toast({
        title: 'Success',
        description: `${sheetKey} data saved successfully!`,
      });
      
    } catch (error) {
      console.error(`Error saving ${sheetKey} data:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save ${sheetKey} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [sheetKey]: false }));
    }
  }, [toast]);

  // Refresh data for a specific sheet
  const refreshSheetData = useCallback(async (sheetKey: string) => {
    // Clear local data and reload
    setSheetData(prev => {
      const newData = { ...prev };
      delete newData[sheetKey];
      return newData;
    });
    
    setHasUnsavedChanges(prev => ({
      ...prev,
      [sheetKey]: false
    }));
    
    await loadSheetData(sheetKey);
  }, [loadSheetData]);

  // Export data as CSV
  const exportCSV = useCallback((sheetKey: string) => {
    const spreadsheetRef = spreadsheetRefs.current[sheetKey];
    if (!spreadsheetRef) return;

    const data = spreadsheetRef.getSheetData();
    if (!data || data.length === 0) return;

    // Convert to CSV
    const csvContent = data
      .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${sheetKey}-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    loadSheetData(value);
  }, [loadSheetData]);

  // Handle data change in spreadsheet
  const handleDataChange = useCallback((sheetKey: string) => {
    setHasUnsavedChanges(prev => ({
      ...prev,
      [sheetKey]: true
    }));
  }, []);

  // Load initial data
  useEffect(() => {
    loadSheetData(activeTab);
  }, [activeTab, loadSheetData]);

  // Store spreadsheet reference
  const setSpreadsheetRef = useCallback((sheetKey: string, ref: any) => {
    spreadsheetRefs.current[sheetKey] = ref;
  }, []);

  // If there's a configuration error, show the setup guide
  if (hasConfigError) {
    return <SetupGuide />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-800 to-blue-600 rounded-full"></div>
          <h1 className="text-4xl font-light tracking-wide text-gray-900">Leads Generation</h1>
        </div>
        <p className="text-gray-600 font-light ml-4">
          Manage and analyze leads from multiple sources with real-time Google Sheets integration.
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
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.values(sheetData).reduce((total, data) => total + (data?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sources</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.keys(sheetData).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {lastSaved[activeTab] ? new Date(lastSaved[activeTab]).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unsaved Changes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hasUnsavedChanges[activeTab] ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Spreadsheet Section */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-gray-700 to-gray-500 rounded-full"></div>
                  <CardTitle className="text-xl font-light text-gray-900">Lead Data</CardTitle>
                  {hasUnsavedChanges[activeTab] && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshSheetData(activeTab)}
                    disabled={isLoading[activeTab]}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading[activeTab] ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportCSV(activeTab)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  
                  <Button
                    onClick={() => saveSheetData(activeTab)}
                    disabled={isSaving[activeTab] || !hasUnsavedChanges[activeTab]}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving[activeTab] ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {SHEET_TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200"
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {SHEET_TABS.map((tab) => (
                  <TabsContent key={tab.key} value={tab.key} className="mt-6">
                    {isLoading[tab.key] ? (
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading {tab.label}...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[600px] border rounded-lg overflow-hidden">
                        <Luckysheet
                          data={sheetData[tab.key] || [['Name', 'Email', 'Phone', 'Source', 'Stage', 'Owner', 'Created At']]}
                          sheetKey={tab.key}
                          onDataChange={(data) => handleDataChange(tab.key)}
                          setRef={(ref) => setSpreadsheetRef(tab.key, ref)}
                        />
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Sidebar */}
        <div className="lg:col-span-1">
          <LeadsAnalysis 
            data={sheetData[activeTab] || []}
            sheetKey={activeTab}
            lastSaved={lastSaved[activeTab]}
            hasUnsavedChanges={hasUnsavedChanges[activeTab]}
          />
        </div>
      </div>
    </div>
  );
}
