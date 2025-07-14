import * as React from 'react';
import { View, Pressable, Platform, Keyboard, TextInput } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { globalFileData } from './FileSelect';

import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';


export default function Display() {
    const { isDarkColorScheme } = useColorScheme();
    
    // Initialize from global data or defaults
    const [title, setTitle] = React.useState<string>(globalFileData.title || '');
    const [description, setDescription] = React.useState<string>(globalFileData.description || '');
    
    // Theme-based default colors
    const defaultColors = {
        background: isDarkColorScheme ? '#1f2937' : '#ffffff',
        foreground: isDarkColorScheme ? '#f9fafb' : '#111827', 
        accent: '#3b82f6'
    };

    // Color picker state - initialize from global data or defaults
    const [selectedColors, setSelectedColors] = React.useState<{
        background: string;
        foreground: string;
        accent: string;
    }>(globalFileData.selectedColors || defaultColors);
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const [activeColorType, setActiveColorType] = React.useState<'background' | 'foreground' | 'accent'>('background');
    const [tempColor, setTempColor] = React.useState('');
    const [originalColor, setOriginalColor] = React.useState('');

    // Update global data when selectedColors change
    React.useEffect(() => {
        globalFileData.selectedColors = selectedColors;
    }, [selectedColors]);

    // Animation values
    const fieldsOpacity = useSharedValue(1);
    const colorPickerOpacity = useSharedValue(0);

    // Animated styles
    const fieldsStyle = useAnimatedStyle(() => ({
        opacity: fieldsOpacity.value,
    }));

    const colorPickerStyle = useAnimatedStyle(() => ({
        opacity: colorPickerOpacity.value,
    }));

    // Color picker functions
    const openColorPicker = (colorType: 'background' | 'foreground' | 'accent') => {
        setActiveColorType(colorType);
        const currentColor = selectedColors[colorType];
        setOriginalColor(currentColor);
        setTempColor(currentColor);
        
        // Fade out fields
        fieldsOpacity.value = withTiming(0, { duration: 200 });
        
        setTimeout(() => {
            setShowColorPicker(true);
            // Fade in color picker
            colorPickerOpacity.value = withTiming(1, { duration: 200 });
        }, 200);
    };

    const closeColorPicker = () => {
        // Fade out color picker
        colorPickerOpacity.value = withTiming(0, { duration: 200 });
        
        setTimeout(() => {
            setShowColorPicker(false);
            // Fade in fields
            fieldsOpacity.value = withTiming(1, { duration: 200 });
        }, 200);
    };

    const cancelColorPicker = () => {
        // Revert to original color
        setSelectedColors((prev: { background: string; foreground: string; accent: string }) => ({
            ...prev,
            [activeColorType]: originalColor
        }));
        closeColorPicker();
    };

    const confirmColorPicker = () => {
        // Keep the new color (tempColor is already applied to selectedColors via onColorChange)
        closeColorPicker();
    };

    const onColorChange = (color: any) => {
        const newColor = color.hex;
        setTempColor(newColor);
        // Update the display immediately for preview
        setSelectedColors((prev: { background: string; foreground: string; accent: string }) => ({
            ...prev,
            [activeColorType]: newColor
        }));
    };

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
                <Text className="text-lg font-semibold text-foreground">Step 3: Design & Display</Text>
                <Text className="text-sm text-muted-foreground mt-1">Control how your secret looks.</Text>
            </View>
            
            <View className="flex-1 px-6">
                <View className="rounded-lg border border-border bg-card p-4 gap-4">
                    {/* Main Fields */}
                    <Animated.View style={fieldsStyle}>
                        <View className="gap-4">
                            <View>
                                <Text className="text-sm text-muted-foreground mb-2">Title (Optional)</Text>
                                <TextInput
                                    value={title}
                                    onChangeText={(text) => {
                                        setTitle(text);
                                        globalFileData.title = text;
                                    }}
                                    placeholder="My Secret"
                                    placeholderTextColor={isDarkColorScheme ? "#6b7280" : "#9ca3af"}
                                    className="border border-border rounded-lg p-3 text-foreground bg-card"
                                    style={{ fontSize: 16 }}
                                />
                            </View>
                            
                            <View>
                                <Text className="text-sm text-muted-foreground mb-2">Description (Optional)</Text>
                                <TextInput
                                    value={description}
                                    onChangeText={(text) => {
                                        setDescription(text);
                                        globalFileData.description = text;
                                    }}
                                    placeholder="This secret is for..."
                                    placeholderTextColor={isDarkColorScheme ? "#6b7280" : "#9ca3af"}
                                    multiline={true}
                                    numberOfLines={3}
                                    className="border border-border rounded-lg p-3 text-foreground bg-card"
                                    style={{ fontSize: 16, textAlignVertical: 'top' }}
                                />
                            </View>
                            
                            <View className="flex-row gap-6 justify-center">
                                <View className="items-center">
                                    <Pressable 
                                        className="w-12 h-12 rounded-lg border-2 border-border mb-2" 
                                        style={{ backgroundColor: selectedColors.background }}
                                        onPress={() => openColorPicker('background')}
                                    >
                                    </Pressable>
                                    <Text className="text-xs text-muted-foreground">Background</Text>
                                </View>
                                <View className="items-center">
                                    <Pressable 
                                        className="w-12 h-12 rounded-lg border-2 border-border mb-2" 
                                        style={{ backgroundColor: selectedColors.foreground }}
                                        onPress={() => openColorPicker('foreground')}
                                    >
                                    </Pressable>
                                    <Text className="text-xs text-muted-foreground">Foreground</Text>
                                </View>
                                <View className="items-center">
                                    <Pressable 
                                        className="w-12 h-12 rounded-lg border-2 border-border mb-2" 
                                        style={{ backgroundColor: selectedColors.accent }}
                                        onPress={() => openColorPicker('accent')}
                                    >
                                    </Pressable>
                                    <Text className="text-xs text-muted-foreground">Accent</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Color Picker */}
                    {showColorPicker && (
                        <Animated.View style={[colorPickerStyle, { position: 'absolute', inset: 16, zIndex: 10 }]}>
                            <View className="flex-1 flex-col">
                                <Text className="text-lg font-semibold text-foreground mb-3 capitalize">
                                    Select {activeColorType} Color
                                </Text>
                                
                                <ColorPicker
                                    value={selectedColors[activeColorType]}
                                    onComplete={onColorChange}
                                    style={{ width: '100%', height: 200 }}
                                >
                                    <Preview style={{ height: 30 }} />
                                    <Panel1 style={{ height: 120 }} thumbSize={12} />
                                    <HueSlider style={{ height: 30 }} thumbSize={12} />
                                </ColorPicker>
                                
                                <View className="flex-row gap-3 mt-4">
                                    <Pressable
                                        className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 p-3 rounded-lg items-center justify-center"
                                        onPress={cancelColorPicker}
                                    >
                                        <Text className="text-white font-medium">Cancel</Text>
                                    </Pressable>
                                    
                                    <Pressable
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 p-3 rounded-lg items-center justify-center"
                                        onPress={confirmColorPicker}
                                    >
                                        <Text className="text-white font-medium">Done</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </View>
        </WrapperComponent>
    );
}
