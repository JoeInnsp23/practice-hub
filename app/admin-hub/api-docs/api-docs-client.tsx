"use client";

import { Check, Copy, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExternalApiDoc } from "@/lib/api-docs/external-apis";
import type { ApiDocumentation } from "@/lib/api-docs/generate-docs";
import type { SchemaDocs } from "@/lib/api-docs/schema-docs";

interface ApiDocsClientProps {
  internalDocs: ApiDocumentation;
  externalApis: ExternalApiDoc[];
  schemaDocs: SchemaDocs;
}

export function ApiDocsClient({
  internalDocs,
  externalApis,
  schemaDocs,
}: ApiDocsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Filter internal API procedures by search query
  const filteredInternalRouters = internalDocs.routers
    .map((router) => ({
      ...router,
      procedures: router.procedures.filter(
        (proc) =>
          proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          router.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proc.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((router) => router.procedures.length > 0);

  // Filter external APIs by search query
  const filteredExternalApis = externalApis.filter(
    (api) =>
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.endpoints.some(
        (endpoint) =>
          endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
  );

  // Filter schema tables by search query
  const filteredSchemaTables = schemaDocs.tables.filter(
    (table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.columns.some((col) =>
        col.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search APIs, endpoints, tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Different API Types */}
      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="internal">
            Internal APIs ({filteredInternalRouters.length})
          </TabsTrigger>
          <TabsTrigger value="external">
            External APIs ({filteredExternalApis.length})
          </TabsTrigger>
          <TabsTrigger value="schema">
            Database Schema ({filteredSchemaTables.length})
          </TabsTrigger>
        </TabsList>

        {/* Internal tRPC APIs */}
        <TabsContent value="internal" className="space-y-4">
          {filteredInternalRouters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No internal APIs found matching "{searchQuery}"
              </CardContent>
            </Card>
          ) : (
            filteredInternalRouters.map((router) => (
              <Card key={router.name}>
                <CardHeader>
                  <CardTitle>{router.name}</CardTitle>
                  {router.description && (
                    <CardDescription>{router.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {router.procedures.map((proc) => (
                    <div
                      key={proc.name}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {router.name}.{proc.name}
                            </code>
                            <Badge variant="outline">{proc.type}</Badge>
                            {proc.requiresAuth && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Auth Required
                              </Badge>
                            )}
                            {proc.requiresAdmin && (
                              <Badge className="bg-red-600 text-white">
                                Admin Only
                              </Badge>
                            )}
                          </div>
                          {proc.description && (
                            <p className="text-sm text-muted-foreground">
                              {proc.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleCopy(
                              `trpc.${router.name}.${proc.name}`,
                              `${router.name}.${proc.name}`,
                            )
                          }
                        >
                          {copiedText === `${router.name}.${proc.name}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {proc.input && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              Input Schema:
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCopy(
                                  proc.input?.schema || "",
                                  `${router.name}.${proc.name}-input`,
                                )
                              }
                            >
                              {copiedText ===
                              `${router.name}.${proc.name}-input` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {proc.input.schema}
                          </pre>
                          {proc.input.example !== undefined && (
                            <>
                              <span className="text-sm font-semibold">
                                Example:
                              </span>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                {JSON.stringify(proc.input.example, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* External APIs */}
        <TabsContent value="external" className="space-y-4">
          {filteredExternalApis.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No external APIs found matching "{searchQuery}"
              </CardContent>
            </Card>
          ) : (
            filteredExternalApis.map((api) => (
              <Card key={api.name}>
                <CardHeader>
                  <CardTitle>{api.name}</CardTitle>
                  <CardDescription>{api.description}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={api.links.officialDocs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Official Docs →
                    </a>
                    {api.links.apiReference && (
                      <a
                        href={api.links.apiReference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        API Reference →
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Base URL:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                        {api.baseUrl}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold">Auth:</span>
                      <span className="ml-2">{api.authentication.type}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {api.endpoints.map((endpoint, idx) => (
                      <div
                        key={`${endpoint.method}-${endpoint.path}`}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={
                                  endpoint.method === "GET"
                                    ? "bg-blue-600 text-white"
                                    : endpoint.method === "POST"
                                      ? "bg-green-600 text-white"
                                      : "bg-primary text-white"
                                }
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono">
                                {endpoint.path}
                              </code>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {endpoint.description}
                            </p>
                            {endpoint.rateLimit && (
                              <p className="text-xs text-primary mt-1">
                                Rate Limit: {endpoint.rateLimit}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleCopy(
                                `${api.baseUrl}${endpoint.path}`,
                                `${api.name}-${idx}`,
                              )
                            }
                          >
                            {copiedText === `${api.name}-${idx}` ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {endpoint.responseExample && (
                          <div className="space-y-2">
                            <span className="text-sm font-semibold">
                              Response Example:
                            </span>
                            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                              {endpoint.responseExample}
                            </pre>
                          </div>
                        )}

                        {endpoint.documentation && (
                          <a
                            href={endpoint.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline inline-block"
                          >
                            View full documentation →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Database Schema */}
        <TabsContent value="schema" className="space-y-4">
          {filteredSchemaTables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No database tables found matching "{searchQuery}"
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSchemaTables.map((table) => (
                <Card key={table.name}>
                  <CardHeader>
                    <CardTitle>{table.name}</CardTitle>
                    {table.description && (
                      <CardDescription>{table.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Column</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-center p-2">Nullable</th>
                            <th className="text-center p-2">Primary Key</th>
                            <th className="text-left p-2">Foreign Key</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-b">
                              <td className="p-2 font-mono text-xs">
                                {col.name}
                              </td>
                              <td className="p-2 text-xs">{col.type}</td>
                              <td className="p-2 text-center">
                                {col.nullable ? "✓" : "✗"}
                              </td>
                              <td className="p-2 text-center">
                                {col.primaryKey ? "✓" : "✗"}
                              </td>
                              <td className="p-2 text-xs">
                                {col.foreignKey
                                  ? `${col.foreignKey.table}.${col.foreignKey.column}`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
