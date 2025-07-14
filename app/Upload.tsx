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
        // MOCK API CALL - Remove this when your real API is ready
        console.log('Mock upload - payload size:', JSON.stringify(payload).length, 'characters');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Mock successful response
        const mockResponse = {
            ID: 'mock-' + Math.random().toString(36).substring(2, 15),
            status: 'success'
        };
        
        return mockResponse.ID;
        
        /* REAL API CALL - Uncomment when your backend is ready
        const response = await fetch(`${API_BASE_URL}/upload-secret`, {
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
        return result.ID || result.url; // Return whatever identifier your API provides
        */
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

export default function Upload() {
    const { isDarkColorScheme } = useColorScheme();
    const [uploadState, setUploadState] = React.useState<'idle' | 'encrypting' | 'uploading' | 'complete' | 'error'>('idle');
    const [uploadResult, setUploadResult] = React.useState<string>('');
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const [copyState, setCopyState] = React.useState<'idle' | 'copying' | 'success'>('idle');
    const [linkCopyState, setLinkCopyState] = React.useState<'idle' | 'copying' | 'success'>('idle');
    const rotationAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const linkRotationAnim = React.useRef(new Animated.Value(0)).current;
    const linkFadeAnim = React.useRef(new Animated.Value(1)).current;

    // Start the upload process when component mounts
    React.useEffect(() => {
        startUpload();
    }, []);

    const startUpload = async () => {
        try {
            setUploadState('encrypting');
            
            // Create the complete payload (encrypt files, hash password, include settings)
            const payload = await createUploadPayload(globalFileData.password);
            
            setUploadState('uploading');
            
            // Upload to your endpoint
            const ID = await uploadSecret(payload);
            
            setUploadResult(ID);
            setUploadState('complete');
        } catch (error) {
            console.error('Upload process failed:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
            setUploadState('error');
        }
    };

    const getLoadingText = () => {
        switch (uploadState) {
            case 'encrypting':
                return 'Encrypting your files...';
            case 'uploading':
                return 'Uploading to server...';
            case 'complete':
                return 'Upload complete!';
            case 'error':
                return 'Upload failed';
            default:
                return 'Preparing upload...';
        }
    };

    const getSubText = () => {
        switch (uploadState) {
            case 'encrypting':
                return `Securing ${globalFileData.files.length} file${globalFileData.files.length !== 1 ? 's' : ''}...`;
            case 'uploading':
                return 'Uploading...';
            case 'complete':
                return 'Your secret is ready to share.';
            case 'error':
                return errorMessage;
            default:
                return 'Initializing encryption process...';
        }
    };

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' }
          };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 5: Upload</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                    {uploadState === 'complete' ? 'Your secret has been uploaded successfully.' : 'Uploading data...'}
                </Text>
            </View>
            
            <View className="flex-1 px-6 justify-center">
                <View className="rounded-lg border border-border bg-card p-6 gap-4 items-center">
                    {/* Loading spinner or status icon */}
                    {uploadState === 'encrypting' || uploadState === 'uploading' ? (
                        <View className="w-12 h-12 rounded-full border-4 border-muted-foreground/20 border-t-blue-500 animate-spin" />
                    ) : uploadState === 'complete' ? (
                        <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white text-xl">✓</Text>
                        </View>
                    ) : uploadState === 'error' ? (
                        <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center">
                            <Text className="text-white text-xl">✗</Text>
                        </View>
                    ) : null}
                    
                    {/* Main status text */}
                    <Text className="text-lg font-semibold text-foreground text-center">
                        {getLoadingText()}
                    </Text>
                    
                    {/* Sub status text */}
                    <Text className="text-sm text-muted-foreground text-center">
                        {getSubText()}
                    </Text>
                    
                    {/* Progress indicator */}
                    {(uploadState === 'encrypting' || uploadState === 'uploading') && (
                        <View className="w-full bg-muted rounded-full h-2 mt-2">
                            <View 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    uploadState === 'encrypting' ? 'w-1/2 bg-blue-500' : 'w-full bg-blue-500'
                                }`} 
                            />
                        </View>
                    )}
                    
                    {/* Success message with copy options */}
                    {uploadState === 'complete' && uploadResult && (
                        <View className="mt-4 w-full gap-3">
                            {/* ID with inline copy button */}
                            <View className="flex-row items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                                    ID: <Text className="font-mono text-blue-800 dark:text-blue-200">{uploadResult}</Text>
                                </Text>
                                <Pressable
                                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-2 rounded-md ml-2"
                                    onPress={async () => {
                                        try {
                                            setCopyState('copying');
                                            
                                            // Start rotation and fade animations
                                            Animated.parallel([
                                                Animated.timing(rotationAnim, {
                                                    toValue: 1,
                                                    duration: 400,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.sequence([
                                                    Animated.timing(fadeAnim, {
                                                        toValue: 0,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.timing(fadeAnim, {
                                                        toValue: 1,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    })
                                                ])
                                            ]).start();
                                            
                                            // Wait for half the animation before changing state
                                            setTimeout(() => {
                                                setCopyState('success');
                                            }, 200);
                                            
                                            if (Platform.OS === 'web' && navigator.clipboard) {
                                                await navigator.clipboard.writeText(uploadResult);
                                            }
                                            
                                            console.log('Copied ID to clipboard:', uploadResult);
                                            
                                            // Reset to idle after 2 seconds with fade animation
                                            setTimeout(() => {
                                                // Start fade out and rotation animation back to copy icon
                                                Animated.parallel([
                                                    Animated.timing(rotationAnim, {
                                                        toValue: 2,
                                                        duration: 400,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.sequence([
                                                        Animated.timing(fadeAnim, {
                                                            toValue: 0,
                                                            duration: 200,
                                                            useNativeDriver: true,
                                                        }),
                                                        Animated.timing(fadeAnim, {
                                                            toValue: 1,
                                                            duration: 200,
                                                            useNativeDriver: true,
                                                        })
                                                    ])
                                                ]).start(() => {
                                                    // Reset animations after completion
                                                    rotationAnim.setValue(0);
                                                    fadeAnim.setValue(1);
                                                });
                                                
                                                // Change state back during fade
                                                setTimeout(() => {
                                                    setCopyState('idle');
                                                }, 200);
                                            }, 2000);
                                        } catch (error) {
                                            console.error('Failed to copy ID:', error);
                                            setCopyState('idle');
                                            rotationAnim.setValue(0);
                                            fadeAnim.setValue(1);
                                        }
                                    }}
                                >
                                    <Animated.View
                                        style={{
                                            opacity: fadeAnim,
                                            transform: [{
                                                rotate: rotationAnim.interpolate({
                                                    inputRange: [0, 1, 2],
                                                    outputRange: copyState === 'success' ? ['-180deg', '0deg', '180deg'] : ['0deg', '180deg', '360deg'],
                                                })
                                            }]
                                        }}
                                    >
                                        {copyState === 'success' ? (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        ) : (
                                            <Ionicons name="copy-outline" size={16} color="white" />
                                        )}
                                    </Animated.View>
                                </Pressable>
                            </View>
                            
                            {/* Separator */}
                            <Text className="text-center text-muted-foreground text-sm">or</Text>
                            
                            {/* Copy Link Button */}
                            <Pressable
                                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-3 rounded-lg items-center justify-center flex-row gap-2"
                                onPress={async () => {
                                    try {
                                        setLinkCopyState('copying');
                                        
                                        // Start rotation and fade animations for link icon
                                        Animated.parallel([
                                            Animated.timing(linkRotationAnim, {
                                                toValue: 1,
                                                duration: 400,
                                                useNativeDriver: true,
                                            }),
                                            Animated.sequence([
                                                Animated.timing(linkFadeAnim, {
                                                    toValue: 0,
                                                    duration: 200,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.timing(linkFadeAnim, {
                                                    toValue: 1,
                                                    duration: 200,
                                                    useNativeDriver: true,
                                                })
                                            ])
                                        ]).start();
                                        
                                        // Wait for half the animation before changing state
                                        setTimeout(() => {
                                            setLinkCopyState('success');
                                        }, 200);
                                        
                                        const shareLink = `${BASE_URL}/${uploadResult}`;
                                        if (Platform.OS === 'web' && navigator.clipboard) {
                                            await navigator.clipboard.writeText(shareLink);
                                        }
                                        console.log('Copied link to clipboard:', shareLink);
                                        
                                        // Reset to idle after 2 seconds with fade animation
                                        setTimeout(() => {
                                            // Start fade out and rotation animation back to link icon
                                            Animated.parallel([
                                                Animated.timing(linkRotationAnim, {
                                                    toValue: 2,
                                                    duration: 400,
                                                    useNativeDriver: true,
                                                }),
                                                Animated.sequence([
                                                    Animated.timing(linkFadeAnim, {
                                                        toValue: 0,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    }),
                                                    Animated.timing(linkFadeAnim, {
                                                        toValue: 1,
                                                        duration: 200,
                                                        useNativeDriver: true,
                                                    })
                                                ])
                                            ]).start(() => {
                                                // Reset animations after completion
                                                linkRotationAnim.setValue(0);
                                                linkFadeAnim.setValue(1);
                                            });
                                            
                                            // Change state back during fade
                                            setTimeout(() => {
                                                setLinkCopyState('idle');
                                            }, 200);
                                        }, 2000);
                                    } catch (error) {
                                        console.error('Failed to copy link:', error);
                                        setLinkCopyState('idle');
                                        linkRotationAnim.setValue(0);
                                        linkFadeAnim.setValue(1);
                                    }
                                }}
                            >
                                <Animated.View
                                    style={{
                                        opacity: linkFadeAnim,
                                        transform: [{
                                            rotate: linkRotationAnim.interpolate({
                                                inputRange: [0, 1, 2],
                                                outputRange: linkCopyState === 'success' ? ['-180deg', '0deg', '180deg'] : ['0deg', '180deg', '360deg'],
                                            })
                                        }]
                                    }}
                                >
                                    {linkCopyState === 'success' ? (
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    ) : (
                                        <Ionicons name="link-outline" size={16} color="white" />
                                    )}
                                </Animated.View>
                                <Text className="text-white font-medium">Copy Link</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </WrapperComponent>
    );
}
