import React, { useState, useContext } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
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
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign up to get started
          </Text>

          {error ? (
            <Surface style={styles.errorSurface} elevation={1}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          ) : null}

          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

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

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.linkButton}
          >
            Already have an account? Sign In
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
