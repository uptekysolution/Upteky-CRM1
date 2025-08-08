
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LeadGenerationPage() {
    const { toast } = useToast();

    const generateFormCode = () => {
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
    }


  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Lead Generation</CardTitle>
          <CardDescription>Tools and forms to capture new business leads from external sources.</CardDescription>
        </CardHeader>
        <CardContent>
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
                                <Checkbox id="name" defaultChecked disabled />
                                <Label htmlFor="name">Full Name (Required)</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="email" defaultChecked disabled />
                                <Label htmlFor="email">Email (Required)</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="company" />
                                <Label htmlFor="company">Company</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="phone" />
                                <Label htmlFor="phone">Phone Number</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="message" />
                                <Label htmlFor="message">Message</Label>
                            </div>
                            <Button onClick={generateFormCode}>Generate & Copy Code</Button>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-2">Manual Lead Entry</h3>
                    <p className="text-muted-foreground mb-4">
                        Have a lead from a call or event? Add them directly into the CRM pipeline using this form.
                    </p>
                    <Link href="/dashboard/crm/add-lead">
                        <Button>Create New Lead</Button>
                    </Link>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
