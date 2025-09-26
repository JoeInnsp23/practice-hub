"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardFormData } from "../client-wizard-modal";

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientCode">Client Code</Label>
          <Input
            id="clientCode"
            value={formData.clientCode || ''}
            onChange={(e) => updateFormData({ clientCode: e.target.value })}
            placeholder="e.g., CLI001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Client Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter client name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Client Type *</Label>
          <Select value={formData.type} onValueChange={(value) => updateFormData({ type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Limited Company</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="trust">Trust</SelectItem>
              <SelectItem value="charity">Charity</SelectItem>
              <SelectItem value="sole_trader">Sole Trader</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountManager">Account Manager</Label>
        <Select value={formData.accountManager || ''} onValueChange={(value) => updateFormData({ accountManager: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select account manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="john_smith">John Smith</SelectItem>
            <SelectItem value="jane_wilson">Jane Wilson</SelectItem>
            <SelectItem value="bob_johnson">Bob Johnson</SelectItem>
            <SelectItem value="alice_brown">Alice Brown</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}