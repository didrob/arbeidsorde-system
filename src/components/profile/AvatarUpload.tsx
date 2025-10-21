import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, X } from 'lucide-react';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';

interface AvatarUploadProps {
  profile: UserProfile;
  onUploadComplete?: (avatarUrl: string) => void;
}

export function AvatarUpload({ profile, onUploadComplete }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { uploadAvatar, updating } = useUserProfile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vennligst velg en bildefil');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bildet må være mindre enn 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    const result = await uploadAvatar(file);
    if (result.success && result.avatar_url) {
      onUploadComplete?.(result.avatar_url);
      setPreviewUrl(null);
    }
  };

  const handleClearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || profile.avatar_url;
  const initials = profile.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile.user_id.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={displayUrl || undefined} alt="Profilbilde" />
          <AvatarFallback className="text-lg">
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        
        {previewUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleClearPreview}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={updating}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {updating ? 'Laster opp...' : 'Endre profilbilde'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG eller GIF. Maks 5MB.
        </p>
      </div>
    </div>
  );
}