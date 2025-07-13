import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
}  from '~/components/ui/card';
import {Pressable, View, Platform, ScrollView} from 'react-native';
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
let globalFileData: {
    files: Content[];
    totalBytes: number;
    hasFiles: boolean;
} = {
    files: [],
    totalBytes: 0,
    hasFiles: false
};


function smallFileSize(size: number): string {
    if (size < 1024) return size + ' B';
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    else return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileSelect() {
    const { isDarkColorScheme } = useColorScheme();
    const [hasFiles, setHasFiles] = React.useState(false);
    const [fileData, setFileData] = React.useState<Content[]>([]); // Add state for file data
    const [totalBytes, setTotalBytes] = React.useState(0); // Add state for bytes

    // Load data from global variable on component mount
    React.useEffect(() => {
        loadFileData();
    }, []);

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
        if (typeof window !== 'undefined') {
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
                hasFiles
            };
            console.log('Saved file data:', globalFileData.files.length, 'files');
        } catch (error) {
            console.error('Error saving file data:', error);
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
                hasFiles: false
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
                return <Ionicons name="document-text" size={20} color={iconColor} />;
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
                className="ml-2 p-1 active:bg-muted rounded"
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
                        const arrayBuffer = await file.arrayBuffer();
                        const byteArray = new Uint8Array(arrayBuffer);
                        
                        newBytes += file.size;
                        
                        if (newBytes > (1024 * 1024)) { // 1MB limit
                            alert("Please keep data uploads below 1MB.");
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

    return (
        <View className="flex-1 justify-between">
            <View className="flex-1 px-6">
                <ScrollView className="max-h-48 rounded-lg border border-border flex-1" showsVerticalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
                    {!hasFiles && (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-base italic text-center" style={{opacity: 0.5}}>
                                Use the buttons below to add files.
                            </Text>
                        </View>
                    )}
                    {displayedFiles}
                </ScrollView>
            </View>

            {/* 3-button section - positioned at bottom */}
            <View className="px-4 pb-4">
                <View className="flex-row rounded-xl overflow-hidden border border-border">
                    <Pressable 
                        className="flex-1 bg-card active:bg-muted p-3 items-center justify-center"
                        onPress={handleFileSelect}
                        >
                        <Ionicons name="folder" size={24} color={isDarkColorScheme ? "#e5e7eb" : "#374151"} />
                        <Text className="text-sm text-center text-foreground mt-1">Files</Text>
                    </Pressable>

                    <View className="w-px bg-border" />

                    <Pressable 
                        className="flex-1 bg-card active:bg-muted p-3 items-center justify-center"
                        onPress={() => console.log('Links pressed')}>
                        <Ionicons name="link" size={24} color={isDarkColorScheme ? "#e5e7eb" : "#374151"} />
                        <Text className="text-sm text-center text-foreground mt-1">Links</Text>
                    </Pressable>

                    <View className="w-px bg-border" />

                    <Pressable 
                        className="flex-1 bg-card active:bg-muted p-3 items-center justify-center"
                        onPress={() => console.log('Text pressed')}>
                        <Ionicons name="document-text" size={24} color={isDarkColorScheme ? "#e5e7eb" : "#374151"} />
                        <Text className="text-sm text-center text-foreground mt-1">Text</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}