import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await login(email.trim(), password);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface} elevation={2}>
          <Text variant="headlineMedium" style={styles.title}>
            Inventory App
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to manage your inventory
          </Text>

          {error ? (
            <Surface style={styles.errorSurface} elevation={1}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            style={styles.linkButton}
          >
            Don't have an account? Sign Up
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF8E7',
  },
  surface: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#FEF5E7',
    borderWidth: 3,
    borderColor: '#CD853F',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#5D4037',
    fontSize: 32,
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
    color: '#6D4C41',
    fontSize: 15,
    fontStyle: 'italic',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#FFF8E7',
  },
  button: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#CD853F',
    elevation: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  linkButton: {
    marginTop: 12,
  },
  errorSurface: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
    borderWidth: 2,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
  },
  errorText: {
    color: '#B71C1C',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
