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
    length: number
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

export default function FileSelect({ secret }: OpenFileViewProps) {
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

    // Remove the global var declarations and create displayedFiles from state
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
                <Text className="text-xs text-muted-foreground mt-1">{smallFileSize(file.length)}</Text>
            </View>
            <Pressable 
                className="ml-2 p-1 active:bg-blue-800/15 rounded hover:bg-blue-900/10"
                onPress={() => {
                    const newFileData = fileData.filter((_, i) => i !== index);
                    const newTotalBytes = totalBytes - file.length;
                    const newHasFiles = newFileData.length > 0;
                    
                    setFileData(newFileData);
                    setTotalBytes(newTotalBytes);
                    setHasFiles(newHasFiles);
                    
                    console.log('Removed file, remaining:', newFileData.length);
                }}
            >
                <Ionicons name="close" size={16} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
            </Pressable>
        </Animated.View>
    ));
    
    const handleFileSelect = async () => {
        if (true) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '*/*';
            
            input.onchange = async (event: Event) => {
                const target = event.target as HTMLInputElement;
                const files = target.files;
                if (files && files.length > 0) {
                    const newFiles: Content[] = [];
                    let newBytes = totalBytes;
                    let limitExceeded = false;
                    
                    for (const file of Array.from(files)) {
                        // Check if file with same name already exists
                        const isDuplicate = fileData.some(existingFile => existingFile.name === file.name);
                        
                        if (isDuplicate) {
                            console.log('Skipping duplicate file:', file.name);
                            continue;
                        }
                        
                        const arrayBuffer = await file.arrayBuffer();
                        const byteArray = new Uint8Array(arrayBuffer);
                        
                        newBytes += file.size;
                        
                        if (newBytes > (1024 * 1024 * 1024)) { // 1GB limit
                            alert("Please keep data uploads below 1GB.");
                            limitExceeded = true;
                            break;
                        }
                        
                        newFiles.push({
                            name: file.name,
                            type: "file",
                            buffer: byteArray,
                            length: file.size
                        });
                        
                        console.log('Selected file:', file.name, file.size, file.type);
                    }
                    
                    // Only update state if no limit was exceeded and we have new files
                    if (!limitExceeded && newFiles.length > 0) {
                        setFileData(prevData => [...prevData, ...newFiles]);
                        setTotalBytes(newBytes);
                        setHasFiles(true);
                    }
                }
            };
            
            input.click();
        } else {
            console.log("File selection is not supported on this platform.");
        }
    };

    const handleTextLinkInput = (type: 'link' | 'text') => {
        setInputType(type);
        
        // Animate transition: fade out files/buttons, collapse button container, expand window, fade in text input
        fileContentOpacity.value = withTiming(0, { duration: 400 });
        buttonsOpacity.value = withTiming(0, { duration: 400 });
        buttonsHeight.value = withTiming(0, { duration: 400 });
        
        setTimeout(() => {
            setShowTextInput(true);
            windowHeight.value = withTiming(
                Platform.OS !== 'web' 
                    ? (type === 'link' ? 280 : 300) 
                    : (type === 'link' ? 320 : 360), 
                { duration: 400 }); // Different heights for web vs mobile
            textInputOpacity.value = withTiming(1, { duration: 400 });
        }, 400);
        
        setInputValue('');
        setInputTitle('');
    };

    const handleAddTextLink = () => {
        if (!inputValue.trim() || !inputTitle.trim()) return;
        
        const content = inputValue.trim();
        const title = inputTitle.trim();
        const contentBytes = new TextEncoder().encode(content);
        
        // Check size limit
        const newBytes = totalBytes + contentBytes.length;
        if (newBytes > (1024 * 1024 * 1024)) {
            alert("Please keep data uploads below 1GB.");
            return;
        }
        
        // Check for duplicates
        const isDuplicate = fileData.some(existingFile => existingFile.name === title);
        if (isDuplicate) {
            console.log('Skipping duplicate:', title);
            return;
        }
        
        const newContent: Content = {
            name: title,
            type: inputType,
            buffer: contentBytes,
            length: contentBytes.length
        };
        
        setFileData(prevData => [...prevData, newContent]);
        setTotalBytes(newBytes);
        setHasFiles(true);
        
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
        
        console.log(`Added ${inputType}:`, title, contentBytes.length, 'bytes');
    };

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
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 1: Add Content</Text>
                <Text className="text-sm text-muted-foreground mt-1">Select components to add to your secret.</Text>
            </View>
            
            <View className="flex-1 px-6">
                <Animated.View 
                    style={[windowStyle]} 
                    className="rounded-lg border border-border overflow-hidden relative"
                >
                    {/* File content - always rendered but animated opacity */}
                    <Animated.View style={[fileContentStyle]} className="absolute inset-0">
                        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
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