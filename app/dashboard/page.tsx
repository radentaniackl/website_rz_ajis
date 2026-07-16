import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, BookOpen, FileCheck2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default async function DashboardPage() {
  const session = await auth();

  // Placeholder statistics - will be replaced with real data once database is connected
  const statistics = {
    totalAnak: 0,
    totalSesi: 0,
    totalHafalan: 0,
    totalEvaluasi: 0,
  };
  
  const recentActivity = {
    recentSesi: [] as any[],
    recentHafalan: [] as any[],
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description={`Selamat datang, ${session?.user?.username || 'Admin'}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anak</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAnak}</div>
            <p className="text-xs text-muted-foreground">
              Anak yang terdaftar di wilayah
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesi</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSesi}</div>
            <p className="text-xs text-muted-foreground">
              Sesi pembinaan bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hafalan</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalHafalan}</div>
            <p className="text-xs text-muted-foreground">
              Setoran hafalan baru
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluasi</CardTitle>
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalEvaluasi}</div>
            <p className="text-xs text-muted-foreground">
              Evaluasi anak semester ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sesi Terbaru</CardTitle>
            <CardDescription>Sesi pembinaan yang baru saja diinput</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.recentSesi.length === 0 ? (
              <EmptyState 
                title="Belum ada data sesi" 
                description="Anda belum menambahkan data sesi pembinaan apapun."
              />
            ) : (
              <div className="space-y-4">
                {recentActivity.recentSesi.map((sesi) => (
                  <div key={sesi.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{sesi.judul || 'Sesi Pembinaan'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sesi.tanggalSesi).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hafalan Terbaru</CardTitle>
            <CardDescription>Hafalan anak yang baru disetorkan</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.recentHafalan.length === 0 ? (
              <EmptyState 
                title="Belum ada data hafalan" 
                description="Belum ada anak yang menyetorkan hafalan."
              />
            ) : (
              <div className="space-y-4">
                {recentActivity.recentHafalan.map((hafalan) => (
                  <div key={hafalan.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{hafalan.surat || 'Surat Hafalan'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(hafalan.tanggalSetor).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
