import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { Upload, Camera, X } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string | null;
  className?: string;
  isEditing?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUploaded, 
  currentImageUrl, 
  className = '',
  isEditing = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update preview when currentImageUrl changes (from props)
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);
  const { toast } = useToast();

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL for immediate display
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setPreviewUrl(preview);
      // Immediately update the avatar with the preview
      onImageUploaded(preview);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    console.log('🚀 Starting image upload...');
    console.log('📁 Selected file:', selectedFile);
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Clear the selected file and preview immediately when upload starts
    setSelectedFile(null);
    setPreviewUrl(null);

    try {
      console.log('🔐 Getting auth token...');
      const formData = new FormData();
      formData.append('image', selectedFile);
      console.log('📦 FormData created with file');

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('🌐 Making upload request to backend...');
      const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📡 Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful!",
        description: "Your profile image has been updated",
      });

      // Call the callback with the final Firebase Storage URL
      onImageUploaded(result.data.imageUrl);
      
      // Reset the component
      setSelectedFile(null);
      setPreviewUrl(result.data.imageUrl);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onImageUploaded, toast]);

  // Handle remove image
  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Call callback with empty string to remove image
    onImageUploaded('');
  }, [onImageUploaded]);

  // Handle click to select file
  const handleClickToSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* No preview image display - the avatar in Profile page will show the image */}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="space-y-2 w-full sm:w-auto">
        {!selectedFile && isEditing && (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto text-xs sm:text-sm"
            onClick={handleClickToSelect}
            disabled={isUploading}
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Select Photo
          </Button>
        )}
        
        {selectedFile && !isUploading && (
          <Button
            onClick={handleUpload}
            className="w-full sm:w-auto text-xs sm:text-sm bg-gradient-gaming hover:shadow-neon-purple transition-all duration-300"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Upload Image
          </Button>
        )}

        {isUploading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
