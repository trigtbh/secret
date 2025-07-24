

import * as React from 'react';
import { View, Platform, Keyboard, Pressable, Animated, TextInput, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { globalFileData } from './FileSelect';
import { BASE_URL, API_BASE_URL } from '~/lib/constants';
import { Ionicons } from '@expo/vector-icons';


interface OpenErrorProps {
  errormsg?: string;
}

export default function OpenPassword({ hash, callback }: { hash: string, callback: (password: string) => void }) {
    const { isDarkColorScheme } = useColorScheme();
    const [uploadState, setUploadState] = React.useState<'idle' | 'encrypting' | 'uploading' | 'complete' | 'error'>('idle');
    const [uploadResult, setUploadResult] = React.useState<string>('');
    const [errorMessage, setErrorMessage] = React.useState<string>('');

    const [password, setPassword] = React.useState('');

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' }
          };


    async function handleUnlock() {
        setErrorMessage('');
        setUploadState('encrypting');
        try {
            const hashed = await hashPassword(password);
            console.log(hashed, hash)
            if (hashed === hash) {
                setUploadState('complete');
                callback(password);
            } else {
                setErrorMessage('Incorrect password');
                setUploadState('error');
            }
        } catch (e) {
            setErrorMessage('Error hashing password');
            setUploadState('error');
        }
    }


    return (



        <WrapperComponent {...wrapperProps}>
            <View className="flex-1 px-6 pb-6">
                <View className="flex-1 rounded-lg border border-border bg-card p-6 gap-4 items-center justify-center">
                    <View className="w-full max-w-xs">
                <Text className="text-sm text-muted-foreground mb-1">Password</Text>
                    <TextInput
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password..."
                        className="border border-border rounded-lg p-3 text-foreground bg-card"
                        placeholderTextColor={isDarkColorScheme ? "#6b7280" : "#9ca3af"}
                            
                        style={{ fontSize: 16 }}
                    />
                
            </View>
            <Pressable
                className="mt-4 px-4 py-2 bg-primary rounded-lg"
                style={{ opacity: password.length > 0 ? 1 : 0.5 }}
                disabled={password.length === 0 || uploadState === 'encrypting'}
                onPress={handleUnlock}
            >
                <Text className="text-base text-white font-bold">Unlock</Text>
            </Pressable>
            <Text
                className="text-red-500 text-center mt-2"
                style={{ minHeight: 22 }}
            >
                {errorMessage || ' '}
            </Text>
                </View>
            </View>
        </WrapperComponent>


    );
}


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