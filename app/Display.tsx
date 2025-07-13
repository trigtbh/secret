import * as React from 'react';
import { View, Pressable, Platform, Keyboard, TextInput } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';

export default function Display() {
    const { isDarkColorScheme } = useColorScheme();
    const [title, setTitle] = React.useState<string>('');
    const [description, setDescription] = React.useState<string>('');
    
    // Theme-based default colors
    const defaultColors = {
        background: isDarkColorScheme ? '#1f2937' : '#ffffff',
        foreground: isDarkColorScheme ? '#f9fafb' : '#111827', 
        accent: '#3b82f6'
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
                    <View>
                        <Text className="text-sm text-muted-foreground mb-2">Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
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
                            onChangeText={setDescription}
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
                            <Pressable className="w-12 h-12 rounded-lg border-2 border-border mb-2" style={{ backgroundColor: defaultColors.background }}>
                            </Pressable>
                            <Text className="text-xs text-muted-foreground">Background</Text>
                        </View>
                        <View className="items-center">
                            <Pressable className="w-12 h-12 rounded-lg border-2 border-border mb-2" style={{ backgroundColor: defaultColors.foreground }}>
                            </Pressable>
                            <Text className="text-xs text-muted-foreground">Foreground</Text>
                        </View>
                        <View className="items-center">
                            <Pressable className="w-12 h-12 rounded-lg border-2 border-border mb-2" style={{ backgroundColor: defaultColors.accent }}>
                            </Pressable>
                            <Text className="text-xs text-muted-foreground">Accent</Text>
                        </View>
                    </View>
                </View>
            </View>
        </WrapperComponent>
    );
}
