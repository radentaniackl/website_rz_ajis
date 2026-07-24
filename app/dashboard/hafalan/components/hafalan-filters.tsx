'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HafalanFiltersProps {
  semesters: { id: number; nama: string }[];
  anakList: { id: number; namaLengkap: string; kodeAnak: string }[];
}

export function HafalanFilters({
  semesters,
  anakList,
}: HafalanFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [semesterId, setSemesterId] = useState(searchParams.get('semesterId') || '');
  const [anakId, setAnakId] = useState(searchParams.get('anakId') || '');

  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    
    router.push(`?${newParams.toString()}`);
  };

  const handleReset = () => {
    setSearch('');
    setSemesterId('');
    setAnakId('');
    updateURL({ search: null, semesterId: null, anakId: null });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateURL({ search: value || null });
  };

  const handleSemesterChange = (value: string) => {
    setSemesterId(value);
    updateURL({ semesterId: value || null });
  };

  const handleAnakChange = (value: string) => {
    setAnakId(value);
    updateURL({ anakId: value || null });
  };

  // Sync local state with URL params
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSemesterId(searchParams.get('semesterId') || '');
    setAnakId(searchParams.get('anakId') || '');
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Cari
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Cari berdasarkan nama anak atau konten hafalan..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="semester">Semester</Label>
          <Select value={semesterId || ''} onValueChange={handleSemesterChange}>
            <SelectTrigger id="semester">
              <SelectValue placeholder="Pilih semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id.toString()}>
                  {semester.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="anak">Anak</Label>
          <Select value={anakId || ''} onValueChange={handleAnakChange}>
            <SelectTrigger id="anak">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              {anakList.map((anak) => (
                <SelectItem key={anak.id} value={anak.id.toString()}>
                  {anak.namaLengkap} ({anak.kodeAnak})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
