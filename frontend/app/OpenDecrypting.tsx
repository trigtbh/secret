import * as React from 'react';
import { View, Platform, Keyboard, Pressable, Animated } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { globalFileData } from './FileSelect';
import { BASE_URL, API_BASE_URL } from '~/lib/constants';
import { Ionicons } from '@expo/vector-icons';

// Hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to base64 safely
    let binaryString = '';
    for (let i = 0; i < hashArray.length; i++) {
        binaryString += String.fromCharCode(hashArray[i]);
    }
    return btoa(binaryString);
}

// Encrypt all files in parallel
async function encryptAllFiles(files: any[], password: string) {
    const encryptionPromises = files.map(async (file) => ({
        name: file.name,
        type: file.type,
        encryptedData: await encrypt(file.buffer, password),
        originalSize: file.length
    }));
    
    return await Promise.all(encryptionPromises);
}

// Create the complete payload for upload
async function createUploadPayload(password: string) {
    // 1. Encrypt all files
    const encryptedFiles = await encryptAllFiles(globalFileData.files, password);
    
    // 2. Hash password
    const passwordHash = await hashPassword(password);
    
    // 3. Create complete payload
    const payload = {
        files: encryptedFiles,
        passwordHash: passwordHash,
        settings: {
            expiration: globalFileData.expiration,
            viewLimit: globalFileData.viewLimit,
            title: globalFileData.title,
            description: globalFileData.description,
            selectedColors: globalFileData.selectedColors
        },
        metadata: {
            totalFiles: encryptedFiles.length,
            uploadTime: new Date().toISOString(),
            totalOriginalSize: globalFileData.totalBytes
        }
    };
    
    return payload;
}

// Upload the payload to your endpoint
async function uploadSecret(payload: any): Promise<string> {
    try {
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.ID; // Return whatever identifier your API provides
        
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function decrypt(encryptedData: string, password: string): Promise<Uint8Array> {
    // Convert base64 back to Uint8Array (safe for large files)
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
    }
    
    // Extract IV (first 12 bytes) and encrypted data (rest)
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Derive key from password (same as encryption)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password.padEnd(32, '0').slice(0, 32)), // Same 32-byte key
        { name: 'AES-GCM' },
        false,
        ['decrypt'] // Note: 'decrypt' permission
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    );
    
    return new Uint8Array(decrypted);
}

// Example AES-GCM encryption
async function encrypt(data: Uint8Array, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password.padEnd(32, '0').slice(0, 32)), // 32 bytes for AES-256
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV for GCM
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    
    // Combine IV + encrypted data and convert to base64 (safe for large files)
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 safely for large files
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
        binaryString += String.fromCharCode(combined[i]);
    }
    return btoa(binaryString);
}

// Main upload process function
async function performUpload(): Promise<string> {
    try {
        // Create the complete payload (encrypt files, hash password, include settings)
        const payload = await createUploadPayload(globalFileData.password);
        
        // Upload to your endpoint
        const secretId = await uploadSecret(payload);
        
        return secretId;
    } catch (error) {
        console.error('Upload process failed:', error);
        throw error;
    }
}



interface OpenDecryptingProps {
    secret: any;
    password?: string;
    onComplete?: (secret: any) => void;
}

export default function OpenDecrypting({ secret, password, onComplete }: OpenDecryptingProps) {
    const { isDarkColorScheme } = useColorScheme();
    const [decryptState, setDecryptState] = React.useState<'idle' | 'decrypting' | 'complete' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const [decryptedFiles, setDecryptedFiles] = React.useState<any[]>([]);

    React.useEffect(() => {
        let cancelled = false;
        async function doDecrypt() {
            setDecryptState('decrypting');
            try {
                // Add a 30 second delay before starting decryption
                await new Promise(res => setTimeout(res, 3000));
                if (cancelled) return;
                if (secret && secret.files && Array.isArray(secret.files)) {
                    if (!password) throw new Error('Missing password for decryption');
                    const results = [];
                    for (let i = 0; i < secret.files.length; i++) {
                        const file = secret.files[i];
                        const decrypted = await decrypt(file.encryptedData, password);
                        results.push({ ...file, decryptedData: decrypted });
                    }
                    if (cancelled) return;
                    setDecryptedFiles(results);
                    // Save decrypted data back into secret.files
                    for (let i = 0; i < secret.files.length; i++) {
                        secret.files[i].decryptedData = results[i].decryptedData;
                    }
                } else {
                    throw new Error('No files to decrypt');
                }
                if (cancelled) return;
                setDecryptState('complete');
                onComplete?.(secret);
            } catch (e) {
                setErrorMessage(e instanceof Error ? e.message : 'Decryption failed');
                setDecryptState('error');
            }
        }
        doDecrypt();
        return () => { cancelled = true; };
    }, [secret, password]);

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' }
          };


    // Only show 'decrypting' spinner and text, unless error
    const getLoadingText = () => {
        if (decryptState === 'error') return 'Decryption failed';
        return 'Decrypting your files...';
    };

    const getSubText = () => {
        if (decryptState === 'error') return errorMessage;
        return `Unlocking and decrypting ${secret?.files?.length || 0} file${secret?.files?.length === 1 ? '' : 's'}...`;
    };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="flex-1 px-6 pb-6">
                <View className="flex-1 rounded-lg border border-border bg-card p-6 items-center justify-center">
                    {/* Loading spinner or status icon */}
                    {decryptState === 'error' ? (
                        <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center">
                            <Ionicons name="close" size={24} color="white" />
                        </View>
                    ) : (
                        <View className="w-12 h-12 rounded-full border-4 border-muted-foreground/20 border-t-blue-500 animate-spin" />
                    )}
                    {/* Main status text */}
                    <Text className="text-lg font-semibold text-foreground text-center mt-4">
                        {getLoadingText()}
                    </Text>
                    {/* Sub status text */}
                    <Text className="text-sm text-muted-foreground text-center mt-2">
                        {getSubText()}
                    </Text>
                    {/* Progress indicator */}
                    {decryptState !== 'error' && (
                        <View className="w-full max-w-xs bg-muted rounded-full h-2 mt-4">
                            <View className="h-2 rounded-full transition-all duration-300 w-1/2 bg-blue-500" />
                        </View>
                    )}
                </View>
            </View>
        </WrapperComponent>
    );
}
