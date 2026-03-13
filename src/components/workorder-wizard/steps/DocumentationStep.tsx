import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizard } from '../WizardContext';
import { FileText, Image, Camera, Upload, X } from 'lucide-react';

export function DocumentationStep() {
  const { formData, dispatch } = useWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const currentFiles = formData.attachments || [];
    const newFiles = Array.from(files);
    
    // Validate file sizes (max 10MB each)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} er for stor (maks 10MB)`);
        return false;
      }
      return true;
    });

    dispatch({
      type: 'UPDATE_DATA',
      payload: { attachments: [...currentFiles, ...validFiles] }
    });
  };

  const removeFile = (index: number) => {
    const updatedFiles = (formData.attachments || []).filter((_, i) => i !== index);
    dispatch({
      type: 'UPDATE_DATA',
      payload: { attachments: updatedFiles }
    });
  };

  React.useEffect(() => {
    // Mark step as completed (optional step)
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: 4 });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Dokumentasjon</h3>
        <p className="text-sm text-muted-foreground">
          Last opp bilder, tegninger eller andre dokumenter relatert til arbeidsordren
        </p>
      </div>

      {/* File upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Last opp filer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              type="button"
            >
              <Camera className="h-4 w-4 mr-2" />
              Ta bilde
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline" 
              className="flex-1"
              type="button"
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
        </CardContent>
      </Card>

      {/* File types info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Image className="w-8 h-8 text-primary-text" />
            <div>
              <h4 className="font-medium">Bilder</h4>
              <p className="text-sm text-muted-foreground">JPG, PNG, WEBP</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-status-complete" />
            <div>
              <h4 className="font-medium">Dokumenter</h4>
              <p className="text-sm text-muted-foreground">PDF, DOC, TXT</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Camera className="w-8 h-8 text-muted-foreground" />
            <div>
              <h4 className="font-medium">Fra kamera</h4>
              <p className="text-sm text-muted-foreground">Ta bilder direkte</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Tips for dokumentasjon</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Last opp bilder av arbeidsstedet før oppstart</li>
            <li>• Inkluder tekniske tegninger eller spesifikasjoner</li>
            <li>• Dokumenter eventuelle skader eller forhold som må tas hensyn til</li>
            <li>• Ta med referanser til tidligere arbeid på samme sted</li>
          </ul>
        </CardContent>
      </Card>

      {/* Current attachments summary */}
      {formData.attachments && formData.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valgte filer ({formData.attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}