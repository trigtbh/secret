import * as React from 'react';
import { View, Platform, Keyboard, Pressable, Animated } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { globalFileData } from './FileSelect';
import { BASE_URL, API_BASE_URL } from '~/lib/constants';
import { Ionicons } from '@expo/vector-icons';


interface OpenErrorProps {
  errormsg?: string;
}

export default function OpenError({ errormsg }: OpenErrorProps) {
    const { isDarkColorScheme } = useColorScheme();
    const [uploadState, setUploadState] = React.useState<'idle' | 'encrypting' | 'uploading' | 'complete' | 'error'>('idle');
    const [uploadResult, setUploadResult] = React.useState<string>('');
    const [errorMessage, setErrorMessage] = React.useState<string>('');

 

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' }
          };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="flex-1 px-6 pb-6">
                <View className="flex-1 rounded-lg border border-border bg-card p-6 gap-4 items-center justify-center">
                    {/* Success icon */}
                    <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center">
                        <Ionicons name="close" size={24} color="white" />
                    </View>
                    
                    {/* Main status text */}
                    <Text className="text-lg font-semibold text-foreground text-center mt-4">
                        {errormsg}
                    </Text>
                    
                    
                </View>
            </View>
        </WrapperComponent>


    );
}
