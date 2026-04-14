/**
 * Image Picker Utility
 * Handles camera and gallery image selection
 */

import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerResult {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
  width?: number;
  height?: number;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Take a photo using camera
 */
export async function takePhoto(options?: {
  allowsEditing?: boolean;
  quality?: number;
}): Promise<ImagePickerResult | null> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      quality: options?.quality ?? 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

/**
 * Pick image from gallery
 */
export async function pickFromGallery(options?: {
  allowsEditing?: boolean;
  quality?: number;
  multiple?: boolean;
}): Promise<ImagePickerResult[]> {
  try {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? false,
      quality: options?.quality ?? 0.8,
      allowsMultipleSelection: options?.multiple ?? false,
    });

    if (!result.canceled && result.assets) {
      return result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        width: asset.width,
        height: asset.height,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error picking from gallery:', error);
    throw error;
  }
}

/**
 * Show image picker options (Camera or Gallery)
 */
export async function showImagePickerOptions(options?: {
  allowsEditing?: boolean;
  quality?: number;
}): Promise<ImagePickerResult | null> {
  return new Promise((resolve) => {
    const Alert = require('react-native').Alert;
    
    Alert.alert(
      'Add Photo',
      'Choose an option:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const result = await takePhoto(options);
              resolve(result);
            } catch (error) {
              resolve(null);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const results = await pickFromGallery(options);
              resolve(results.length > 0 ? results[0] : null);
            } catch (error) {
              resolve(null);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]
    );
  });
}

/**
 * Compress image (reduce file size)
 */
export async function compressImage(
  uri: string,
  quality: number = 0.6
): Promise<string> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: quality,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri;
  }
}
