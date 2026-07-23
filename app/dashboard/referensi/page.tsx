"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Database } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTabs } from "@/hooks/use-tabs";
import { useRouter } from "next/navigation";

export default function ReferensiPage() {
  const { addTab } = useTabs();
  const router = useRouter();

  const handleNavigate = (path: string, label: string, iconName: string) => {
    addTab({ path, label, iconName });
    router.push(path);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Referensi" 
        description="Data referensi geografis dan master data"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Propinsi
            </CardTitle>
            <CardDescription>
              Kelola data propinsi di Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleNavigate("/dashboard/referensi/propinsi", "Propinsi", "Map")}
            >
              Kelola Propinsi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Kabupaten
            </CardTitle>
            <CardDescription>
              Kelola data kabupaten/kota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleNavigate("/dashboard/referensi/kabupaten", "Kabupaten", "Map")}
            >
              Kelola Kabupaten
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Kecamatan
            </CardTitle>
            <CardDescription>
              Kelola data kecamatan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleNavigate("/dashboard/referensi/kecamatan", "Kecamatan", "Map")}
            >
              Kelola Kecamatan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Desa
            </CardTitle>
            <CardDescription>
              Kelola data desa/kelurahan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleNavigate("/dashboard/referensi/desa", "Desa", "Map")}
            >
              Kelola Desa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
