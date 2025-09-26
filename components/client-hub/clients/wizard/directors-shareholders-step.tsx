"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WizardFormData } from "../client-wizard-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Users, Briefcase } from "lucide-react";

interface DirectorsShareholdersStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function DirectorsShareholdersStep({ formData, updateFormData }: DirectorsShareholdersStepProps) {
  const [directors, setDirectors] = useState(formData.directors || []);
  const [shareholders, setShareholders] = useState(formData.shareholders || []);

  const addDirector = () => {
    const newDirector = {
      id: Date.now().toString(),
      name: '',
      role: 'Director',
      appointedDate: '',
      email: '',
      phone: '',
    };
    const updated = [...directors, newDirector];
    setDirectors(updated);
    updateFormData({ directors: updated });
  };

  const removeDirector = (id: string) => {
    const updated = directors.filter(d => d.id !== id);
    setDirectors(updated);
    updateFormData({ directors: updated });
  };

  const updateDirector = (id: string, field: string, value: string) => {
    const updated = directors.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    );
    setDirectors(updated);
    updateFormData({ directors: updated });
  };

  const addShareholder = () => {
    const newShareholder = {
      id: Date.now().toString(),
      name: '',
      percentage: 0,
      shareClass: 'Ordinary',
    };
    const updated = [...shareholders, newShareholder];
    setShareholders(updated);
    updateFormData({ shareholders: updated });
  };

  const removeShareholder = (id: string) => {
    const updated = shareholders.filter(s => s.id !== id);
    setShareholders(updated);
    updateFormData({ shareholders: updated });
  };

  const updateShareholder = (id: string, field: string, value: any) => {
    const updated = shareholders.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setShareholders(updated);
    updateFormData({ shareholders: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Directors
            </div>
            <Button size="sm" variant="outline" onClick={addDirector}>
              <Plus className="h-4 w-4 mr-1" />
              Add Director
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {directors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No directors added yet
            </p>
          ) : (
            <div className="space-y-4">
              {directors.map((director) => (
                <div key={director.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={director.name}
                        onChange={(e) => updateDirector(director.id, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input
                        value={director.role}
                        onChange={(e) => updateDirector(director.id, 'role', e.target.value)}
                        placeholder="e.g., Director, Secretary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={director.email || ''}
                        onChange={(e) => updateDirector(director.id, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Appointed Date</Label>
                      <Input
                        type="date"
                        value={director.appointedDate}
                        onChange={(e) => updateDirector(director.id, 'appointedDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => removeDirector(director.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Shareholders
            </div>
            <Button size="sm" variant="outline" onClick={addShareholder}>
              <Plus className="h-4 w-4 mr-1" />
              Add Shareholder
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shareholders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No shareholders added yet
            </p>
          ) : (
            <div className="space-y-4">
              {shareholders.map((shareholder) => (
                <div key={shareholder.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={shareholder.name}
                        onChange={(e) => updateShareholder(shareholder.id, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ownership %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={shareholder.percentage}
                        onChange={(e) => updateShareholder(shareholder.id, 'percentage', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Share Class</Label>
                      <Input
                        value={shareholder.shareClass || ''}
                        onChange={(e) => updateShareholder(shareholder.id, 'shareClass', e.target.value)}
                        placeholder="e.g., Ordinary"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => removeShareholder(shareholder.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}