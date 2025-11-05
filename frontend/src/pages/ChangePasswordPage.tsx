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
import { authService } from '../services/api';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();

  const [staroHaslo, setStaroHaslo] = useState('');
  const [noweHaslo, setNoweHaslo] = useState('');
  const [noweHasloConfirm, setNoweHasloConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!staroHaslo || !noweHaslo || !noweHasloConfirm) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    if (noweHaslo.length < 8) {
      setError('Nowe hasło musi mieć minimum 8 znaków');
      return;
    }

    if (noweHaslo !== noweHasloConfirm) {
      setError('Nowe hasła nie pasują do siebie');
      return;
    }

    if (staroHaslo === noweHaslo) {
      setError('Nowe hasło musi być inne od starego');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(staroHaslo, noweHaslo);
      setSuccess('Hasło zostało pomyślnie zmienione!');
      setStaroHaslo('');
      setNoweHaslo('');
      setNoweHasloConfirm('');
      
      // Przekieruj do dashboard-u po 2 sekundach
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Błąd przy zmianie hasła. Spróbuj ponownie.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Zarządzania Klubem Piłkarskim
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Zmiana hasła
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleChangePassword}>
          <TextField
            fullWidth
            label="Stare Hasło"
            type="password"
            value={staroHaslo}
            onChange={(e) => setStaroHaslo(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Nowe Hasło"
            type="password"
            value={noweHaslo}
            onChange={(e) => setNoweHaslo(e.target.value)}
            margin="normal"
            required
            helperText="Minimum 8 znaków"
          />
          <TextField
            fullWidth
            label="Potwierdź Nowe Hasło"
            type="password"
            value={noweHasloConfirm}
            onChange={(e) => setNoweHasloConfirm(e.target.value)}
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
            {loading ? <CircularProgress size={24} /> : 'Zmień hasło'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/')}
          >
            Anuluj
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

