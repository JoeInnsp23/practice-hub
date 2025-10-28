"use client";

import { Clock, DollarSign, Edit, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/lib/trpc/types";
import { formatCurrency } from "@/lib/utils/format";

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
      case "retainer":
        return "retainer";
      case "project":
        return "per project";
      case "percentage":
        return "percentage";
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
            {service.category && (
              <Badge variant="secondary" className="mt-2">
                {service.category}
              </Badge>
            )}
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
        {service.description && (
          <p className="text-sm text-muted-foreground">{service.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold">
              {service.price
                ? formatCurrency(parseFloat(service.price))
                : "N/A"}
            </span>
            <span className="text-sm text-muted-foreground">
              / {getPriceLabel()}
            </span>
          </div>
          {service.duration && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {service.duration} min
            </div>
          )}
        </div>

        {Array.isArray(service.tags) && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.map((tag: string) => (
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
            className={
              service.isActive
                ? "bg-green-600 dark:bg-green-400/10 dark:bg-green-400/10 text-green-600 dark:text-green-400 dark:text-green-400"
                : ""
            }
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
