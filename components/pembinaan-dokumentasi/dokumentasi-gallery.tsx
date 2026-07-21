'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DokumentasiItem {
  id: number;
  nama: string;
  image: string;
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
}

interface DokumentasiGalleryProps {
  items: DokumentasiItem[];
  onEdit?: (item: DokumentasiItem) => void;
  onDelete?: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function DokumentasiGallery({
  items,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: DokumentasiGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setSelectedImage(items[selectedIndex - 1].image);
    }
  };

  const handleNext = () => {
    if (selectedIndex < items.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setSelectedImage(items[selectedIndex + 1].image);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseLightbox();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Belum ada dokumentasi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <Card key={item.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <img
                  src={item.image}
                  alt={item.nama}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => handleImageClick(item.image, index)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleImageClick(item.image, index)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  {canEdit && onEdit && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => onEdit(item)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                  )}
                  {canDelete && onDelete && (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.nama}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={handleCloseLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-4 text-white hover:bg-white/20",
              selectedIndex === 0 && "opacity-50 cursor-not-allowed"
            )}
            onClick={handlePrevious}
            disabled={selectedIndex === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <img
            src={selectedImage}
            alt={items[selectedIndex].nama}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-4 text-white hover:bg-white/20",
              selectedIndex === items.length - 1 && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleNext}
            disabled={selectedIndex === items.length - 1}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {items[selectedIndex].nama}
          </div>
        </div>
      )}
    </>
  );
}
