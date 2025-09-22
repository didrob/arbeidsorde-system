import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Image, File, Download, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  description?: string;
  created_at: string;
}

interface AttachmentViewerProps {
  workOrderId: string;
}

export function AttachmentViewer({ workOrderId }: AttachmentViewerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [workOrderId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_attachments')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('Kunne ikke hente vedlegg');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Kunne ikke laste ned fil');
    }
  };

  const isImageFile = (fileType: string) => fileType.startsWith('image/');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vedlegg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Laster vedlegg...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vedlegg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Ingen vedlegg lagt til ennå
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vedlegg ({attachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(attachment.created_at).toLocaleDateString('nb-NO')}</span>
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {isImageFile(attachment.file_type) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingAttachment(attachment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image viewer dialog */}
      <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingAttachment?.file_name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewingAttachment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {viewingAttachment && isImageFile(viewingAttachment.file_type) && (
            <div className="flex justify-center">
              <img
                src={viewingAttachment.file_url}
                alt={viewingAttachment.file_name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          )}
          {viewingAttachment?.description && (
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground">
                <strong>Beskrivelse:</strong> {viewingAttachment.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}