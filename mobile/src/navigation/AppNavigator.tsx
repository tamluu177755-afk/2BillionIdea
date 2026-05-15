import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import { RoleSelectorScreen } from '../screens/RoleSelectorScreen';
import { ElderlyHome } from '../screens/ElderlyHome';
import { SosSendingScreen } from '../screens/SosSendingScreen';
import { MedicationReminder } from '../screens/MedicationReminder';
import { ElderlyProfile } from '../screens/ElderlyProfile';
import { CaregiverDashboard } from '../screens/CaregiverDashboard';
import { CaregiverMedicationDetail } from '../screens/CaregiverMedicationDetail';
import { SosAlertScreen } from '../screens/SosAlertScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="RoleSelector"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* Role Selection */}
        <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />

        {/* Elderly Module */}
        <Stack.Screen name="ElderlyHome" component={ElderlyHome} />
        <Stack.Screen name="MedicationReminder" component={MedicationReminder} />
        <Stack.Screen name="SosSending" component={SosSendingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="ElderlyProfile" component={ElderlyProfile} />

        {/* Caregiver Module */}
        <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboard} />
        <Stack.Screen name="CaregiverMedicationDetail" component={CaregiverMedicationDetail} />
        <Stack.Screen name="SosAlert" component={SosAlertScreen} options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
