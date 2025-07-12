import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
}  from '~/components/ui/card';
import {Pressable, View, Platform} from 'react-native';
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
    type: string,
    buffer: Uint8Array,
    length: number
}


var bytes = 0;
var data:  Content[] = [];


function smallFileSize(size: number): string {
    if (size < 1024) return size + ' B';
    else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    else return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileSelect() {
    const { isDarkColorScheme } = useColorScheme();
    const [hasFiles, setHasFiles] = React.useState(false);

    var displayedFiles = data.map((file, index) => (
        <View key={index} className="flex-row items-center justify-between px-4 py-2 border-b border-border">
            <Text className="text-sm text-foreground">{file.name}</Text>
            <Text className="text-xs text-muted-foreground">{(file.length / 1024).toFixed(1)} KB</Text>
        </View>
    ));
    
    const handleFileSelect = async () => {
        if (Platform.OS === 'web') {
            // Create a hidden file input element
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true; // Allow multiple files
            input.accept = '*/*'; // Accept all file types
            
            input.onchange = async (event: Event) => {
                const target = event.target as HTMLInputElement;
                const files = target.files;
                if (files && files.length > 0) {
                    // Convert FileList to Array and iterate
                    for (const file of Array.from(files)) {
                        const arrayBuffer = await file.arrayBuffer(); // binary data
                        const byteArray = new Uint8Array(arrayBuffer);
                        data.push({
                            name: file.name,
                            type: "file",
                            buffer: byteArray,
                            length: file.size
                        });

                        console.log('Selected file:', file.name, file.size, file.type);
                        bytes += file.size;

                        if (bytes > (1024 * 1024)) {
                            alert("Please keep data uploads below 1MB.");
                            var last: Content | undefined = data.pop();
                            if (last) {
                                bytes -= last.length;
                            }
                        }
                    }
                    
                    displayedFiles = data.map((file, index) => (
                        <View key={index} className="flex-row items-center justify-between px-4 py-2 border-b border-border">
                            
                            
                            
                            
                            <Text className="text-sm text-foreground">{file.name}</Text>
                            <Text className="text-xs text-muted-foreground">{smallFileSize(file.length)}</Text>
                        </View>
                    ));

                    console.log(displayedFiles)
                    
                    // Update state to hide the text
                    setHasFiles(data.length > 0);

                    
                }
            };
            
            input.click(); // Trigger file dialog
        } else {
            console.log("File selection is not supported on this platform.");
        }
    };

    return (
        <View className="flex-1 justify-between">
            <View>
                {!hasFiles && (
                    <Text className="text-base px-6 italic text-center mb-6" style={{opacity: 0.5}}>
                        Use the buttons below to add files.
                    </Text>
                )}

                {displayedFiles}

                {/* Your main content here - file list, etc. */}
                <View className="mx-6 mb-6">
                    {hasFiles && (
                        <Text className="text-center text-foreground">
                            {data.length} file{data.length !== 1 ? 's' : ''} selected
                        </Text>
                    )}
                </View>
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