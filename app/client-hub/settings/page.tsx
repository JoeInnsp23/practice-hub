"use client";

import {
  Bell,
  Building,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ZodError } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
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
import type {
  CompanySettings,
  UserSettings,
} from "@/lib/schemas/settings-schemas";
import {
  companySettingsSchema,
  userSettingsSchema,
} from "@/lib/schemas/settings-schemas";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

export default function SettingsPage() {
  // Fetch tenant, user, and timesheet settings from backend
  const { data: tenant, isLoading: tenantLoading } =
    trpc.settings.getTenant.useQuery();
  const { data: userSettings, isLoading: userLoading } =
    trpc.settings.getUserSettings.useQuery();
  const { data: timesheetSettings, isLoading: timesheetLoading } =
    trpc.settings.getTimesheetSettings.useQuery();

  const utils = trpc.useUtils();

  // Local state for form fields
  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  const [userForm, setUserForm] = useState<Partial<UserSettings>>({});
  const [timesheetForm, setTimesheetForm] = useState({
    minWeeklyHours: 37.5,
    dailyTargetHours: 7.5,
  });
  const [showCompanySaved, setShowCompanySaved] = useState(false);
  const [showUserSaved, setShowUserSaved] = useState(false);
  const [showTimesheetSaved, setShowTimesheetSaved] = useState(false);

  // Initialize form state when data loads
  useEffect(() => {
    if (tenant?.metadata) {
      const metadata = tenant.metadata as Partial<CompanySettings>;
      setCompanyForm(metadata);
    } else {
      // Set defaults if no metadata exists
      setCompanyForm({
        company: {
          name: tenant?.name || "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            postcode: "",
            country: "United Kingdom",
          },
        },
        regional: {
          currency: "GBP",
          dateFormat: "DD/MM/YYYY",
          timezone: "Europe/London",
        },
        fiscal: {
          fiscalYearStart: "04-06",
        },
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (userSettings) {
      setUserForm(userSettings);
    }
  }, [userSettings]);

  useEffect(() => {
    if (timesheetSettings) {
      setTimesheetForm({
        minWeeklyHours: timesheetSettings.minWeeklyHours ?? 37.5,
        dailyTargetHours: timesheetSettings.dailyTargetHours ?? 7.5,
      });
    }
  }, [timesheetSettings]);

  // Update tenant settings mutation
  const updateTenant = trpc.settings.updateTenant.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.settings.getTenant.cancel();

      // Snapshot previous value
      const previousTenant = utils.settings.getTenant.getData();

      // Optimistically update to new value
      if (previousTenant && newData?.metadata) {
        utils.settings.getTenant.setData(undefined, {
          ...previousTenant,
          metadata: newData.metadata,
        });
      }

      // Return context with snapshot
      return { previousTenant };
    },
    onSuccess: () => {
      utils.settings.getTenant.invalidate();
      setShowCompanySaved(true);
      toast.success("Company settings saved successfully");
      setTimeout(() => setShowCompanySaved(false), 2000);
    },
    onError: (error, _newData, context) => {
      // Rollback to previous value on error
      if (context?.previousTenant) {
        utils.settings.getTenant.setData(undefined, context.previousTenant);
      }
      toast.error(error.message || "Failed to save company settings");
    },
  });

  // Update user settings mutation
  const updateUserSettings = trpc.settings.updateUserSettings.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.settings.getUserSettings.cancel();

      // Snapshot previous value
      const previousSettings = utils.settings.getUserSettings.getData();

      // Optimistically update to new value
      if (previousSettings) {
        utils.settings.getUserSettings.setData(undefined, {
          ...previousSettings,
          ...newData,
        });
      }

      // Return context with snapshot
      return { previousSettings };
    },
    onSuccess: () => {
      utils.settings.getUserSettings.invalidate();
      setShowUserSaved(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setShowUserSaved(false), 2000);
    },
    onError: (error, _newData, context) => {
      // Rollback to previous value on error
      if (context?.previousSettings) {
        utils.settings.getUserSettings.setData(
          undefined,
          context.previousSettings,
        );
      }
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Update timesheet settings mutation (Story 6.3)
  const updateTimesheetSettings =
    trpc.settings.updateTimesheetSettings.useMutation({
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await utils.settings.getTimesheetSettings.cancel();

        // Snapshot previous value
        const previousSettings = utils.settings.getTimesheetSettings.getData();

        // Optimistically update to new value
        if (previousSettings) {
          utils.settings.getTimesheetSettings.setData(undefined, {
            ...previousSettings,
            ...newData,
          });
        }

        // Return context with snapshot
        return { previousSettings };
      },
      onSuccess: () => {
        utils.settings.getTimesheetSettings.invalidate();
        setShowTimesheetSaved(true);
        toast.success("Timesheet settings saved successfully");
        setTimeout(() => setShowTimesheetSaved(false), 2000);
      },
      onError: (error, _newData, context) => {
        // Rollback to previous value on error
        if (context?.previousSettings) {
          utils.settings.getTimesheetSettings.setData(
            undefined,
            context.previousSettings,
          );
        }
        toast.error(error.message || "Failed to save timesheet settings");
      },
    });

  const handleSaveCompanySettings = () => {
    // Client-side validation with Zod
    try {
      companySettingsSchema.parse(companyForm);
      updateTenant.mutate({
        metadata: companyForm as CompanySettings,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        toast.error(
          `Validation error: ${firstError.message} (${firstError.path.join(".")})`,
        );
      } else {
        toast.error("Please check all required fields are filled correctly");
      }
    }
  };

  const handleSaveUserSettings = () => {
    // Client-side validation with Zod
    try {
      userSettingsSchema.parse(userForm);
      updateUserSettings.mutate(userForm as UserSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        toast.error(
          `Validation error: ${firstError.message} (${firstError.path.join(".")})`,
        );
      } else {
        toast.error("Please check all required fields are filled correctly");
      }
    }
  };

  const handleSaveTimesheetSettings = () => {
    // Basic validation
    if (
      timesheetForm.minWeeklyHours < 0 ||
      timesheetForm.minWeeklyHours > 168
    ) {
      toast.error("Minimum weekly hours must be between 0 and 168");
      return;
    }
    if (
      timesheetForm.dailyTargetHours < 0 ||
      timesheetForm.dailyTargetHours > 24
    ) {
      toast.error("Daily target hours must be between 0 and 24");
      return;
    }

    updateTimesheetSettings.mutate({
      minWeeklyHours: timesheetForm.minWeeklyHours,
      dailyTargetHours: timesheetForm.dailyTargetHours,
    });
  };

  if (tenantLoading || userLoading || timesheetLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
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
                    value={companyForm.company?.name || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          name: e.target.value,
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyForm.company?.email || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          email: e.target.value,
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input
                    id="companyPhone"
                    value={companyForm.company?.phone || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          phone: e.target.value,
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Street"
                    value={companyForm.company?.address?.street || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      const currentAddress = currentCompany.address || {
                        country: "United Kingdom",
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          address: {
                            ...currentAddress,
                            street: e.target.value,
                          },
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                  <Input
                    placeholder="City"
                    value={companyForm.company?.address?.city || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      const currentAddress = currentCompany.address || {
                        country: "United Kingdom",
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          address: {
                            ...currentAddress,
                            city: e.target.value,
                          },
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                  <Input
                    placeholder="Postcode"
                    value={companyForm.company?.address?.postcode || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      const currentAddress = currentCompany.address || {
                        country: "United Kingdom",
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          address: {
                            ...currentAddress,
                            postcode: e.target.value,
                          },
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                  <Input
                    placeholder="Country"
                    value={companyForm.company?.address?.country || ""}
                    onChange={(e) => {
                      const currentCompany = companyForm.company || {
                        name: "",
                        email: "",
                        address: { country: "United Kingdom" },
                      };
                      const currentAddress = currentCompany.address || {
                        country: "United Kingdom",
                      };
                      setCompanyForm({
                        ...companyForm,
                        company: {
                          ...currentCompany,
                          address: {
                            ...currentAddress,
                            country: e.target.value,
                          },
                        },
                      });
                    }}
                    disabled={updateTenant.isPending}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Regional Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={companyForm.regional?.timezone || "Europe/London"}
                      onValueChange={(value) => {
                        const currentRegional = companyForm.regional || {
                          currency: "GBP",
                          dateFormat: "DD/MM/YYYY",
                          timezone: "Europe/London",
                        };
                        setCompanyForm({
                          ...companyForm,
                          regional: {
                            ...currentRegional,
                            timezone: value,
                          },
                        });
                      }}
                      disabled={updateTenant.isPending}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
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
                      value={companyForm.regional?.dateFormat || "DD/MM/YYYY"}
                      onValueChange={(value) => {
                        const currentRegional = companyForm.regional || {
                          currency: "GBP",
                          dateFormat: "DD/MM/YYYY",
                          timezone: "Europe/London",
                        };
                        setCompanyForm({
                          ...companyForm,
                          regional: {
                            ...currentRegional,
                            dateFormat: value as
                              | "DD/MM/YYYY"
                              | "MM/DD/YYYY"
                              | "YYYY-MM-DD",
                          },
                        });
                      }}
                      disabled={updateTenant.isPending}
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Preview: {(() => {
                        const now = new Date();
                        const day = String(now.getDate()).padStart(2, "0");
                        const month = String(now.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const year = now.getFullYear();
                        const format =
                          companyForm.regional?.dateFormat || "DD/MM/YYYY";

                        if (format === "DD/MM/YYYY")
                          return `${day}/${month}/${year}`;
                        if (format === "MM/DD/YYYY")
                          return `${month}/${day}/${year}`;
                        if (format === "YYYY-MM-DD")
                          return `${year}-${month}-${day}`;
                        return `${day}/${month}/${year}`;
                      })()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={companyForm.regional?.currency || "GBP"}
                      onValueChange={(value) => {
                        const currentRegional = companyForm.regional || {
                          currency: "GBP",
                          dateFormat: "DD/MM/YYYY",
                          timezone: "Europe/London",
                        };
                        setCompanyForm({
                          ...companyForm,
                          regional: {
                            ...currentRegional,
                            currency: value as "GBP" | "USD" | "EUR",
                          },
                        });
                      }}
                      disabled={updateTenant.isPending}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Fiscal Year</h3>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year Start (MM-DD)</Label>
                  <Input
                    id="fiscalYear"
                    placeholder="04-06"
                    value={companyForm.fiscal?.fiscalYearStart || ""}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        fiscal: {
                          ...(companyForm.fiscal || {}),
                          fiscalYearStart: e.target.value,
                        },
                      })
                    }
                    disabled={updateTenant.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: MM-DD (e.g., 04-06 for April 6)
                  </p>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2">
                {showCompanySaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
                <Button
                  onClick={handleSaveCompanySettings}
                  disabled={updateTenant.isPending}
                >
                  {updateTenant.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
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
                    checked={userForm.emailNotifications ?? true}
                    onCheckedChange={(checked) =>
                      setUserForm({
                        ...userForm,
                        emailNotifications: checked,
                      })
                    }
                    disabled={updateUserSettings.isPending}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inAppNotif">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Browser push notifications
                    </p>
                  </div>
                  <Switch
                    id="inAppNotif"
                    checked={userForm.inAppNotifications ?? true}
                    onCheckedChange={(checked) =>
                      setUserForm({
                        ...userForm,
                        inAppNotifications: checked,
                      })
                    }
                    disabled={updateUserSettings.isPending}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-4">
                  Granular Notification Controls
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifTaskAssigned">Task Assigned</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a task is assigned to you
                      </p>
                    </div>
                    <Switch
                      id="notifTaskAssigned"
                      checked={userForm.notifTaskAssigned ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifTaskAssigned: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifTaskMention">
                        Task Mention/Comment
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when you're mentioned in a task
                      </p>
                    </div>
                    <Switch
                      id="notifTaskMention"
                      checked={userForm.notifTaskMention ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifTaskMention: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifTaskReassigned">
                        Task Reassigned
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a task is reassigned to/from you
                      </p>
                    </div>
                    <Switch
                      id="notifTaskReassigned"
                      checked={userForm.notifTaskReassigned ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifTaskReassigned: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifDeadlineApproaching">
                        Deadline Approaching
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a task/compliance deadline is near
                      </p>
                    </div>
                    <Switch
                      id="notifDeadlineApproaching"
                      checked={userForm.notifDeadlineApproaching ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifDeadlineApproaching: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifApprovalNeeded">
                        Approval Required
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when your approval is needed
                      </p>
                    </div>
                    <Switch
                      id="notifApprovalNeeded"
                      checked={userForm.notifApprovalNeeded ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifApprovalNeeded: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifClientMessage">
                        Client Messages
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a client sends you a message
                      </p>
                    </div>
                    <Switch
                      id="notifClientMessage"
                      checked={userForm.notifClientMessage ?? true}
                      onCheckedChange={(checked) =>
                        setUserForm({
                          ...userForm,
                          notifClientMessage: checked,
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="digestEmail">Digest Email</Label>
                    <Select
                      value={userForm.digestEmail || "daily"}
                      onValueChange={(value) =>
                        setUserForm({
                          ...userForm,
                          digestEmail: value as "daily" | "weekly" | "never",
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    >
                      <SelectTrigger id="digestEmail">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={userForm.theme || "system"}
                      onValueChange={(value) =>
                        setUserForm({
                          ...userForm,
                          theme: value as "light" | "dark" | "system",
                        })
                      }
                      disabled={updateUserSettings.isPending}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2">
                {showUserSaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
                <Button
                  onClick={handleSaveUserSettings}
                  disabled={updateUserSettings.isPending}
                >
                  {updateUserSettings.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheet Settings (Story 6.3) */}
        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timesheet Preferences
              </CardTitle>
              <CardDescription>
                Configure your timesheet tracking and validation preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minWeeklyHours">Minimum Weekly Hours</Label>
                  <Input
                    id="minWeeklyHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="168"
                    value={timesheetForm.minWeeklyHours}
                    onChange={(e) =>
                      setTimesheetForm({
                        ...timesheetForm,
                        minWeeklyHours: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={updateTimesheetSettings.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    The minimum number of hours required before you can submit
                    your timesheet for approval (0-168 hours). Default: 37.5
                    hours.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyTargetHours">Daily Target Hours</Label>
                  <Input
                    id="dailyTargetHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={timesheetForm.dailyTargetHours}
                    onChange={(e) =>
                      setTimesheetForm({
                        ...timesheetForm,
                        dailyTargetHours:
                          Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={updateTimesheetSettings.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    The target number of hours for each day. Days with hours
                    below this threshold will be highlighted in orange (0-24
                    hours). Default: 7.5 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Changes will take effect immediately after saving.
                </p>
                <Button
                  onClick={handleSaveTimesheetSettings}
                  disabled={updateTimesheetSettings.isPending}
                >
                  {showTimesheetSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : updateTimesheetSettings.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
