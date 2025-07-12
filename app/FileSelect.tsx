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

export default function FileSelect() {
    const { isDarkColorScheme } = useColorScheme();
    
    const handleFileSelect = () => {
        if (Platform.OS === 'web') {
            // Create a hidden file input element
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true; // Allow multiple files
            input.accept = '*/*'; // Accept all file types
            
            input.onchange = (event) => {
                const files = event.target.files;
                if (files) {
                    Array.from(files).forEach((file: File) => {
                        console.log('Selected file:', file.name, file.size, file.type);
                    });
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
                <Text className="text-base px-6 italic text-center mb-6" style={{opacity: 0.5}}>
                    Use the buttons below to add files.
                </Text>

                {/* Your main content here - file list, etc. */}
                <View className="mx-6 mb-6">
                    {/* Add your file selection content here */}
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