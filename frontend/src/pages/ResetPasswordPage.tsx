import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { authService } from '../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [haslo, setHaslo] = useState('');
  const [hasloConfirm, setHasloConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Brak tokenu resetu hasła. Link jest nieprawidłowy lub wygasł.');
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!haslo || !hasloConfirm) {
      setError('Oba pola hasła są wymagane');
      return;
    }

    if (haslo.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków');
      return;
    }

    if (haslo !== hasloConfirm) {
      setError('Hasła nie pasują do siebie');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token!, haslo);
      setSuccess('Hasło zostało pomyślnie zmienione! Możesz się teraz zalogować.');
      setHaslo('');
      setHasloConfirm('');
      
      // Przekieruj do logowania po 2 sekundach
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Błąd przy resetowaniu hasła. Spróbuj ponownie.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
            Reset Hasła
          </Typography>
          <Alert severity="error">{error}</Alert>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={() => navigate('/login')}
          >
            Wróć do logowania
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Zarządzania Klubem Piłkarskim
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Ustawienie nowego hasła
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleResetPassword}>
          <TextField
            fullWidth
            label="Nowe Hasło"
            type="password"
            value={haslo}
            onChange={(e) => setHaslo(e.target.value)}
            margin="normal"
            required
            helperText="Minimum 8 znaków"
          />
          <TextField
            fullWidth
            label="Potwierdź Hasło"
            type="password"
            value={hasloConfirm}
            onChange={(e) => setHasloConfirm(e.target.value)}
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
            {loading ? <CircularProgress size={24} /> : 'Ustaw nowe hasło'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
          >
            Wróć do logowania
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center', borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Stworzone przez Mateusza Greczyn
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

