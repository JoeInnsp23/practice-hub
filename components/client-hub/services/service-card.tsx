"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, DollarSign, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceType: "fixed" | "hourly" | "monthly" | "project";
  duration?: string;
  features?: string[];
  tags?: string[];
  isActive: boolean;
}

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const getPriceLabel = () => {
    switch (service.priceType) {
      case "hourly":
        return "per hour";
      case "monthly":
        return "per month";
      case "project":
        return "per project";
      default:
        return "fixed price";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <Badge variant="secondary" className="mt-2">
              {service.category}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(service)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(service)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {service.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold">{formatCurrency(service.price)}</span>
            <span className="text-sm text-gray-500">/ {getPriceLabel()}</span>
          </div>
          {service.duration && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {service.duration}
            </div>
          )}
        </div>

        {service.features && service.features.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Includes:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-2 border-t">
          <Badge
            variant={service.isActive ? "default" : "secondary"}
            className={service.isActive ? "bg-green-100 text-green-800" : ""}
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}