import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
}  from '~/components/ui/card';
import {Pressable, View, Platform, ScrollView, TextInput, Keyboard} from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutDown,
    FadeInRight,
    FadeOutLeft,
    LayoutAnimationConfig,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';


import { Separator } from '~/components/ui/separator';
import * as React from 'react';
import {Text} from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import {useColorScheme} from '~/lib/useColorScheme';

type Content = {
    name: string,
    type: 'file' | 'link' | 'text', // Use type to track which button was used
    buffer: Uint8Array,
    length: number,
    originalSize: number, // Optional field for original file size
    decryptedData: Uint8Array; // Optional field for decrypted bytes
}

const STORAGE_KEY = 'fileSelectData';

// Global variable to store file data during session (clears on refresh)
export let globalFileData: {
    files: Content[];
    totalBytes: number;
    hasFiles: boolean;
    password: string;
    expiration: number;
    viewLimit?: number;
    title?: string;
    description?: string;
    selectedColors?: {
        background: string;
        foreground: string;
        accent: string;
    };
    uploadResult?: string;
} = {
    files: [],
    totalBytes: 0,
    hasFiles: false,
    password: '',
    expiration: 60 * 60, // Default to 1 hour
    viewLimit: undefined,
    title: '',
    description: '',
    selectedColors: undefined
};


function smallFileSize(size: number): string {
    if (size < 1024) return size + ' B';
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    else return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

// Export the reset function for use by other components
export const resetAllGlobalData = () => {
    globalFileData = {
        files: [],
        totalBytes: 0,
        hasFiles: false,
        password: '',
        expiration: 60 * 60, // Default to 1 hour
        viewLimit: undefined,
        title: '',
        description: '',
        selectedColors: undefined,
        uploadResult: undefined
    };
    console.log('Global data reset to defaults');
};

interface OpenFileViewProps {
    secret?: any;
}

export default function OpenFileView({ secret }: OpenFileViewProps) {
    const { isDarkColorScheme } = useColorScheme();
    const [hasFiles, setHasFiles] = React.useState(false);
    const [fileData, setFileData] = React.useState<Content[]>(secret?.files ?? []); // Use secret.files if provided
    const [totalBytes, setTotalBytes] = React.useState(0); // Add state for bytes
    
    // Text/Link input states
    const [showTextInput, setShowTextInput] = React.useState(false);
    const [inputType, setInputType] = React.useState<'link' | 'text'>('text');
    const [inputValue, setInputValue] = React.useState('');
    const [inputTitle, setInputTitle] = React.useState('');

    // Animation values
    const fileContentOpacity = useSharedValue(1);
    const buttonsOpacity = useSharedValue(1);
    const buttonsHeight = useSharedValue(100); // Increased height for better visibility
    const textInputOpacity = useSharedValue(0);
    const windowHeight = useSharedValue(192); // Default height (max-h-48 = 192px)

    // Load data from global variable on component mount

    React.useEffect(() => {
        if (secret && Array.isArray(secret.files)) {
            setFileData(secret.files);
            setHasFiles(secret.files.length > 0);
            setTotalBytes(secret.files.reduce((sum: number, f: Content) => sum + (f.length || 0), 0));
        } else {
            loadFileData();
        }
    }, [secret]);

    // Save data to global variable whenever fileData changes
    React.useEffect(() => {
        saveFileData();
    }, [fileData, totalBytes]);

    // Add beforeunload event listener to warn about unsaved changes
    React.useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasFiles && fileData.length > 0) {
                event.preventDefault();
                event.returnValue = ''; // Chrome requires returnValue to be set
                return ''; // Some browsers require a return value
            }
        };

        // Only add the event listener in web environment
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [hasFiles, fileData.length]);

    const saveFileData = () => {
        try {
            globalFileData = {
                files: fileData,
                totalBytes,
                hasFiles,
                password: globalFileData.password,
                expiration: globalFileData.expiration,
                viewLimit: globalFileData.viewLimit
            };
            console.log('Saved file data:', globalFileData.files.length, 'files');
        } catch (error) {
            console.error('Error saving file data:', error);
        }
    };

    const resetAllData = () => {
        try {
            // Reset global state to defaults
            globalFileData = {
                files: [],
                totalBytes: 0,
                hasFiles: false,
                password: '',
                expiration: 60 * 60, // Default to 1 hour
                viewLimit: undefined,
                title: '',
                description: '',
                selectedColors: undefined,
                uploadResult: undefined
            };
            
            // Reset local component state
            setFileData([]);
            setTotalBytes(0);
            setHasFiles(false);
            setShowTextInput(false);
            setInputType('text');
            setInputValue('');
            setInputTitle('');
            
            console.log('Reset all data to defaults');
        } catch (error) {
            console.error('Error resetting data:', error);
        }
    };

    const loadFileData = () => {
        try {
            if (globalFileData.files.length > 0) {
                setFileData(globalFileData.files);
                setTotalBytes(globalFileData.totalBytes);
                setHasFiles(globalFileData.hasFiles);
                console.log('Loaded', globalFileData.files.length, 'files from global state');
            }
        } catch (error) {
            console.error('Error loading file data:', error);
        }
    };

    const clearFileData = () => {
        try {
            globalFileData = {
                files: [],
                totalBytes: 0,
                hasFiles: false,
                password: '',
                expiration: 60 * 60,
                viewLimit: undefined
            };
            setFileData([]);
            setTotalBytes(0);
            setHasFiles(false);
            console.log('Cleared all file data');
        } catch (error) {
            console.error('Error clearing file data:', error);
        }
    };

    // Function to get appropriate icon based on type
    const getSourceIcon = (type: 'file' | 'link' | 'text') => {
        const iconColor = isDarkColorScheme ? "#9ca3af" : "#6b7280";
        
        switch (type) {
            case 'file':
                return <Ionicons name="document" size={20} color={iconColor} />;
            case 'link':
                return <Ionicons name="link" size={20} color={iconColor} />;
            case 'text':
                return <Ionicons name="text" size={20} color={iconColor} />;
            default:
                return <Ionicons name="document-attach" size={20} color={iconColor} />;
        }
    };

    // Download handler for web
    function handleDownload(file: Content) {
        if (Platform.OS === 'web') {
            const blob = new Blob([file.decryptedData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else {
            alert('Download is only supported on web.');
        }
    }

    // Open link handler for web
    function handleOpenLink(file: Content) {
        if (Platform.OS === 'web') {
            // The link is stored as a string in the buffer
            const url = new TextDecoder().decode(file.decryptedData);
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('Opening links is only supported on web.');
        }
    }

    const displayedFiles = fileData.map((file, index) => (
        <Animated.View 
            key={index} 
            entering={FadeInRight.delay(index * 50)}
            className={`flex-row items-start px-4 py-3 ${index < fileData.length - 1 ? 'border-b border-border' : ''}`}
        >
            <View className="mr-3 mt-0.5">
                {getSourceIcon(file.type)}
            </View>
            <View className="flex-1">
                <Text className="text-sm text-foreground">{file.name}</Text>
                <Text className="text-xs text-muted-foreground mt-1">{smallFileSize(file.originalSize)}</Text>
            </View>
            {file.type === 'link' ? (
                <Pressable
                    className="ml-2 p-1 active:bg-blue-800/15 rounded hover:bg-blue-900/10"
                    onPress={() => handleOpenLink(file)}
                >
                    <Ionicons name="open-outline" size={18} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                </Pressable>
            ) : (
                <Pressable
                    className="ml-2 p-1 active:bg-blue-800/15 rounded hover:bg-blue-900/10"
                    onPress={() => handleDownload(file)}
                >
                    <Ionicons name="download" size={18} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                </Pressable>
            )}
        </Animated.View>
    ));
    
    
   

    const handleCancelTextLink = () => {
        // Animate back: fade out text input, shrink window, expand button container, fade in files/buttons
        textInputOpacity.value = withTiming(0, { duration: 400 });
        windowHeight.value = withTiming(192, { duration: 400 });
        
        setTimeout(() => {
            setShowTextInput(false);
            fileContentOpacity.value = withTiming(1, { duration: 400 });
            buttonsOpacity.value = withTiming(1, { duration: 400 });
            buttonsHeight.value = withTiming(100, { duration: 400 });
        }, 400);
        
        setInputValue('');
        setInputTitle('');
    };

    // Animated styles
    const fileContentStyle = useAnimatedStyle(() => ({
        opacity: fileContentOpacity.value,
    }));

    const buttonsStyle = useAnimatedStyle(() => ({
        opacity: buttonsOpacity.value,
        height: buttonsHeight.value,
        overflow: 'hidden',
    }));

    const textInputStyle = useAnimatedStyle(() => ({
        opacity: textInputOpacity.value,
    }));

    const windowStyle = useAnimatedStyle(() => ({
        height: windowHeight.value,
    }));

    const WrapperComponent = Platform.OS === 'web' ? View : Pressable;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' },
            onPress: () => Keyboard.dismiss()
          };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="flex-1 px-6 pb-6">{/* pb-6 for card padding consistency */}
                <Animated.View 
                    style={[windowStyle, { flex: 1 }]} 
                    className="flex-1 rounded-lg border border-border overflow-hidden relative"
                >
                    {/* File content - always rendered but animated opacity */}
                    <Animated.View style={[fileContentStyle, { flex: 1 }]} className="flex-1 absolute inset-0">
                        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1, minHeight: '100%' }}>
                            {!hasFiles && (
                                <View className="flex-1 justify-center items-center">
                                    <Text className="text-base italic text-center" style={{opacity: 0.5}}>
                                        Use the buttons below to add files.
                                    </Text>
                                </View>
                            )}
                            {displayedFiles}
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            </View>
        </WrapperComponent>
    )
}