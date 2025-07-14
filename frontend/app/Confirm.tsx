import * as React from 'react';
import { View, Pressable, Platform, Keyboard } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { globalFileData } from './FileSelect';

export default function Confirm() {
    const { isDarkColorScheme } = useColorScheme();
    const [showPassword, setShowPassword] = React.useState(false);

    // Calculate content counts
    const fileCount = globalFileData.files.filter(f => f.type === 'file').length;
    const linkCount = globalFileData.files.filter(f => f.type === 'link').length;
    const textCount = globalFileData.files.filter(f => f.type === 'text').length;

    // Format expiration time
    const formatExpiration = (seconds: number) => {
        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
        const months = Math.floor(days / 30);
        return `${months} month${months !== 1 ? 's' : ''}`;
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
                <Text className="text-lg font-semibold text-foreground">Step 4: Confirm</Text>
                <Text className="text-sm text-muted-foreground mt-1">Review your secret before creating it.</Text>
            </View>
            
            <View className="flex-1 px-6">
                <View className="rounded-lg border border-border bg-card p-4 gap-3">
                    {/* Title if set */}
                    {globalFileData.title && (
                        <View>
                            <Text className="text-xl font-semibold text-foreground text-center">
                                {globalFileData.title}
                            </Text>
                        </View>
                    )}
                    
                    {/* Description if set */}
                    {globalFileData.description && (
                        <View className="-mt-2">
                            <Text className="text-sm text-muted-foreground text-center">
                                {globalFileData.description}
                            </Text>
                        </View>
                    )}
                    
                    {/* Content Icons and Counts */}
                    <View className="flex-row justify-center gap-12">
                        {/* Files */}
                        {fileCount > 0 && (
                            <View className="items-center">
                                <Ionicons 
                                    name="document" 
                                    size={32} 
                                    color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} 
                                />
                                <Text className="text-sm text-muted-foreground mt-2">{fileCount}</Text>
                            </View>
                        )}
                        
                        {/* Links */}
                        {linkCount > 0 && (
                            <View className="items-center">
                                <Ionicons 
                                    name="link" 
                                    size={32} 
                                    color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} 
                                />
                                <Text className="text-sm text-muted-foreground mt-2">{linkCount}</Text>
                            </View>
                        )}
                        
                        {/* Text */}
                        {textCount > 0 && (
                            <View className="items-center">
                                <Ionicons 
                                    name="text" 
                                    size={32} 
                                    color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} 
                                />
                                <Text className="text-sm text-muted-foreground mt-2">{textCount}</Text>
                            </View>
                        )}
                    </View>
                    
                    {/* Password Section */}
                    {globalFileData.password && (
                        <View className="flex-row justify-center items-center">
                            <Text className="text-sm text-muted-foreground">Password: </Text>
                            <Pressable
                                onPressIn={() => setShowPassword(true)}
                                onPressOut={() => setShowPassword(false)}
                                {...(Platform.OS === 'web' && {
                                    onMouseEnter: () => setShowPassword(true),
                                    onMouseLeave: () => setShowPassword(false)
                                })}
                                className="mt-0.5"
                            >
                                <Text className="text-sm text-foreground font-mono">
                                    {showPassword ? globalFileData.password : '•'.repeat(globalFileData.password.length)}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    
                    {/* Expiration */}
                    <View className="flex-row justify-center items-center -mt-2">
                        <Text className="text-sm text-muted-foreground">
                            Expires in {formatExpiration(globalFileData.expiration)}
                        </Text>
                    </View>
                </View>
            </View>
        </WrapperComponent>
    );
}
