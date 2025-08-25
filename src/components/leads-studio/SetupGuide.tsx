'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function SetupGuide() {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const setupSteps = [
    {
      step: 1,
      title: "Create Google Service Account",
      description: "Set up authentication for Google Sheets API",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to Google Cloud
        </Button>
      )
    },
    {
      step: 2,
      title: "Enable Google Sheets API",
      description: "Enable the API in your Google Cloud project",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('https://console.cloud.google.com/apis/library/sheets.googleapis.com', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Enable API
        </Button>
      )
    },
    {
      step: 3,
      title: "Create Service Account & Download Key",
      description: "Generate credentials for server-side access",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('https://console.cloud.google.com/iam-admin/serviceaccounts', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Create Service Account
        </Button>
      )
    },
    {
      step: 4,
      title: "Create 5 Google Sheets",
      description: "One for each lead source (Chatbot, Voicebot, Career, Footer, Contact)",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('https://sheets.google.com', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Create Sheets
        </Button>
      )
    },
    {
      step: 5,
      title: "Share Sheets with Service Account",
      description: "Give editor access to your service account email",
      action: (
        <div className="text-sm text-gray-600">
          Add service account email as editor
        </div>
      )
    }
  ];

  const envVars = [
    'GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com',
    'GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"',
    'LEADS_SHEET_CHATBOT_ID=your-chatbot-sheet-id',
    'LEADS_SHEET_VOICEBOT_ID=your-voicebot-sheet-id',
    'LEADS_SHEET_CAREER_ID=your-career-sheet-id',
    'LEADS_SHEET_FOOTER_ID=your-footer-sheet-id',
    'LEADS_SHEET_CONTACT_ID=your-contact-sheet-id'
  ];

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-orange-50/30 rounded-xl border-l-4 border-l-yellow-400">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Google Sheets Integration Not Configured
              </h3>
              <p className="text-yellow-700 mb-4">
                The Leads Studio requires Google Sheets API configuration to function. 
                Follow the setup steps below to get started.
              </p>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Settings className="h-3 w-3 mr-1" />
                Configuration Required
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-light text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Setup Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-600">{item.step}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                {item.action}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-light text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Add these variables to your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <div className="space-y-2">
            {envVars.map((envVar, index) => (
              <div key={index} className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  {envVar}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(envVar, index)}
                  className="flex-shrink-0"
                >
                  {copiedStep === index ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-light text-gray-900">Useful Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Cloud Console
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://developers.google.com/sheets/api', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Sheets API Docs
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://mengshukeji.github.io/LuckysheetDocs/', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Luckysheet Documentation
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://sheets.google.com', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Sheets
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-light text-gray-900">Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            After setting up the environment variables, test your configuration:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <code className="text-sm">
              npm run test:sheets
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
