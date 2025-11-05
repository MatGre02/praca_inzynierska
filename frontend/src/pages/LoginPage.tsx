import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, haslo);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(resetEmail);
      setError('');
      alert('Link do resetowania hasła został wysłany na e-mail');
      setShowReset(false);
      setResetEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd przy resetowaniu hasła');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Zarządzania Klubem Piłkarskim
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Panel Logowania
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!showReset ? (
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Hasło"
              type="password"
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              margin="normal"
              required
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Zaloguj się'}
            </Button>

            <Button
              fullWidth
              variant="text"
              color="secondary"
              onClick={() => setShowReset(true)}
            >
              Resetuj hasło
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              margin="normal"
              required
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Wyślij link resetowania'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setShowReset(false);
                setError('');
              }}
            >
              Wróć do logowania
            </Button>
          </form>
        )}

        <Box sx={{ mt: 4, textAlign: 'center', borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Stworzone przez Mateusza Greczyn
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
