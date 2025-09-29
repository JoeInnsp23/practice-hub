"use client";

import {
  AlertCircle,
  Bell,
  Building,
  Download,
  FileText,
  Globe,
  Mail,
  Save,
  Settings,
  Shield,
  Upload,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General
    companyName: "ABC Accounting Practice",
    companyEmail: "info@abcaccounting.com",
    companyPhone: "+44 20 1234 5678",
    companyAddress: "123 Business St, London, UK",
    companyWebsite: "https://abcaccounting.com",
    companyLogo: "",
    timezone: "Europe/London",
    dateFormat: "DD/MM/YYYY",
    currency: "GBP",
    fiscalYearEnd: "31/03",

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: "instant",
    reminderDays: "7",

    // Security
    twoFactorAuth: true,
    sessionTimeout: "30",
    passwordExpiry: "90",
    minPasswordLength: "8",
    requireComplexPassword: true,

    // Integrations
    xeroEnabled: false,
    quickbooksEnabled: false,
    sageEnabled: false,
    stripeEnabled: true,
    slackEnabled: true,
    teamsEnabled: false,

    // Email Templates
    emailSignature: "Best regards,\nABC Accounting Team",
    welcomeEmailTemplate:
      "Welcome to ABC Accounting! We're excited to have you as our client.",
    invoiceEmailTemplate: "Please find attached your invoice for this month.",
    reminderEmailTemplate:
      "This is a friendly reminder about your upcoming deadline.",
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "settings-backup.json";
    link.click();
    toast.success("Settings exported successfully");
  };

  const handleImportSettings = () => {
    toast.success("Import settings functionality");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your practice management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportSettings}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings({ ...settings, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, companyEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, companyPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    value={settings.companyWebsite}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyWebsite: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) =>
                    setSettings({ ...settings, companyAddress: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Regional Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) =>
                        setSettings({ ...settings, timezone: value })
                      }
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">
                          London (GMT)
                        </SelectItem>
                        <SelectItem value="Europe/Dublin">
                          Dublin (GMT)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          New York (EST)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Los Angeles (PST)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={(value) =>
                        setSettings({ ...settings, dateFormat: value })
                      }
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) =>
                        setSettings({ ...settings, currency: value })
                      }
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("General")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotif">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotif">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="smsNotif"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smsNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotif">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Browser push notifications
                    </p>
                  </div>
                  <Switch
                    id="pushNotif"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, pushNotifications: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notifFreq">Notification Frequency</Label>
                    <Select
                      value={settings.notificationFrequency}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          notificationFrequency: value,
                        })
                      }
                    >
                      <SelectTrigger id="notifFreq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">
                      Reminder Days Before Due
                    </Label>
                    <Select
                      value={settings.reminderDays}
                      onValueChange={(value) =>
                        setSettings({ ...settings, reminderDays: value })
                      }
                    >
                      <SelectTrigger id="reminderDays">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Notifications")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, twoFactorAuth: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Session & Password Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sessionTimeout: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">
                      Password Expiry (days)
                    </Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.passwordExpiry}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          passwordExpiry: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minPassword">Min Password Length</Label>
                    <Input
                      id="minPassword"
                      type="number"
                      value={settings.minPasswordLength}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          minPasswordLength: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complexPassword">
                      Complex Password Required
                    </Label>
                    <Switch
                      id="complexPassword"
                      checked={settings.requireComplexPassword}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          requireComplexPassword: checked,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Security Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Last security audit: 15 days ago
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Run Security Audit
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Security")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>
                Connect with external services and applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Accounting Software */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Accounting Software
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="xero">Xero</Label>
                      <Switch
                        id="xero"
                        checked={settings.xeroEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, xeroEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quickbooks">QuickBooks</Label>
                      <Switch
                        id="quickbooks"
                        checked={settings.quickbooksEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            quickbooksEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sage">Sage</Label>
                      <Switch
                        id="sage"
                        checked={settings.sageEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, sageEnabled: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Communication Tools */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Communication</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack">Slack</Label>
                      <Switch
                        id="slack"
                        checked={settings.slackEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, slackEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="teams">Microsoft Teams</Label>
                      <Switch
                        id="teams"
                        checked={settings.teamsEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, teamsEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stripe">Stripe Payments</Label>
                      <Switch
                        id="stripe"
                        checked={settings.stripeEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, stripeEnabled: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Integrations")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Customize your email communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailSig">Email Signature</Label>
                <Textarea
                  id="emailSig"
                  value={settings.emailSignature}
                  onChange={(e) =>
                    setSettings({ ...settings, emailSignature: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeEmail">Welcome Email Template</Label>
                <Textarea
                  id="welcomeEmail"
                  value={settings.welcomeEmailTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      welcomeEmailTemplate: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Invoice Email Template</Label>
                <Textarea
                  id="invoiceEmail"
                  value={settings.invoiceEmailTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceEmailTemplate: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderEmail">Reminder Email Template</Label>
                <Textarea
                  id="reminderEmail"
                  value={settings.reminderEmailTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reminderEmailTemplate: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Templates
                </Button>
                <Button onClick={() => handleSave("Email Templates")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
