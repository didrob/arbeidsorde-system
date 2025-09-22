import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttachmentUploadProps {
  workOrderId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
}

export function AttachmentUpload({ workOrderId, onUploadComplete }: AttachmentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, description?: string) => {
    const uploadId = Math.random().toString(36).substring(7);
    
    setUploadingFiles(prev => [...prev, { file, progress: 0, id: uploadId }]);

    try {
      // Create file path: workOrderId/timestamp_filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${workOrderId}/${fileName}`;

      // Upload file to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('work-order-attachments')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // Update progress to 100% after successful upload
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadId 
            ? { ...f, progress: 100 }
            : f
        )
      );

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-order-attachments')
        .getPublicUrl(filePath);

      // Save attachment record to database
      const { error: dbError } = await supabase
        .from('work_order_attachments')
        .insert({
          work_order_id: workOrderId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          description: description || null
        });

      if (dbError) throw dbError;

      toast.success(`${file.name} lastet opp`);
      onUploadComplete();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Kunne ikke laste opp ${file.name}: ${error.message}`);
    } finally {
      setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} er for stor (maks 10MB)`);
        return;
      }
      
      uploadFile(file, description);
    });
    
    setDescription('');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskrivelse av bildet/filen..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Ta bilde
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline" 
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Last opp fil
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Upload progress */}
        {uploadingFiles.map((uploadingFile) => (
          <div key={uploadingFile.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getFileIcon(uploadingFile.file.type)}
                <span className="truncate">{uploadingFile.file.name}</span>
              </div>
              <span>{Math.round(uploadingFile.progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadingFile.progress}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}