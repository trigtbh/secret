import * as React from 'react';
import { View, TextInput, Pressable, Platform, Keyboard } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { globalFileData } from '~/app/FileSelect';

export default function Options() {
    const { isDarkColorScheme } = useColorScheme();
    const [password, setPassword] = React.useState('');
    const [isPasswordFocused, setIsPasswordFocused] = React.useState(false);
    const [isPasswordHovered, setIsPasswordHovered] = React.useState(false);
    const [expiration, setExpiration] = React.useState<number>(60 * 60);

    // Load global state on mount
    React.useEffect(() => {
        setPassword(globalFileData.password);
        setExpiration(globalFileData.expiration);
    }, []);

    // Save password changes to global state
    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
        globalFileData.password = newPassword;
    };

    // Save expiration changes to global state
    const handleExpirationChange = (newExpiration: number) => {
        setExpiration(newExpiration);
        globalFileData.expiration = newExpiration;
    };

    const expirationOptions = [
        { label: '1 hour', value: 60*60 },
        { label: '1 day', value: 60*60*24 },
        { label: '1 week', value: 60*60*24*7 },
    ];

    const selectedOption = expirationOptions.find(option => option.value === expiration);

    return (
        <Pressable 
            className="flex-1 justify-between" 
            style={{ userSelect: 'none' }}
            onPress={() => {
                if (Platform.OS !== 'web') {
                    Keyboard.dismiss();
                }
            }}
        >
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 2: Configure Options</Text>
                <Text className="text-sm text-muted-foreground mt-1">Set a password and sharing options.</Text>
            </View>
            
            <View className="flex-1 px-6">
                <View className="rounded-lg border border-border overflow-hidden bg-card p-4 gap-4" style={{ overflow: 'visible' }}>
                    {/* Password Field */}
                    <View>
                        <Text className="text-sm text-muted-foreground mb-2">Password</Text>
                        <TextInput
                            className="border border-border rounded-lg p-3 text-foreground bg-white dark:bg-white"
                            placeholder="Enter password..."
                            placeholderTextColor={isDarkColorScheme ? "#6b7280" : "#9ca3af"}
                            value={password}
                            onChangeText={handlePasswordChange}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            onPointerEnter={() => setIsPasswordHovered(true)}
                            onPointerLeave={() => setIsPasswordHovered(false)}
                            secureTextEntry={!isPasswordFocused && !isPasswordHovered}
                            style={{ fontSize: 16, color: '#000000' }}
                        />
                    </View>

                    {/* Expiration Dropdown */}
                    <View>
                        <Text className="text-sm text-muted-foreground mb-2">Expiration Time</Text>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Pressable className="border border-border rounded-lg p-3 bg-white dark:bg-white flex-row items-center justify-between">
                                    <Text style={{ fontSize: 16, color: '#000000' }}>
                                        {selectedOption?.label || 'Select expiration time'}
                                    </Text>
                                    <Ionicons 
                                        name="chevron-down" 
                                        size={20} 
                                        color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} 
                                    />
                                </Pressable>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                {expirationOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onPress={() => handleExpirationChange(option.value)}
                                    >
                                        <Text>{option.label}</Text>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}
