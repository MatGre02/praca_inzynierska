import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MemberFormData {
  imie: string;
  nazwisko: string;
  email: string;
  telefon: string;
  narodowosc?: string;
  rola: 'ZAWODNIK' | 'TRENER';
  kategoria?: string;
  pozycja?: string;
  contractStart: string;
  contractEnd: string;
}

const AddMemberPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    imie: '',
    nazwisko: '',
    email: '',
    telefon: '',
    narodowosc: '',
    rola: 'ZAWODNIK',
    kategoria: '',
    pozycja: '',
    contractStart: '',
    contractEnd: '',
  });

  // Tylko PREZES może dodawać członków
  if (user?.rola !== 'PREZES') {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
          <Alert severity="error">
            ❌ Dostęp zabroniony! Tylko PREZES może dodawać członków klubu.
          </Alert>
        </Paper>
      </Container>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.imie.trim()) {
      setError('❌ Imię jest wymagane');
      return false;
    }
    if (!formData.nazwisko.trim()) {
      setError('❌ Nazwisko jest wymagane');
      return false;
    }
    if (!formData.email.trim()) {
      setError('❌ Email jest wymagany');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('❌ Email jest nieprawidłowy');
      return false;
    }
    if (!formData.telefon.trim()) {
      setError('❌ Telefon jest wymagany');
      return false;
    }
    if (formData.rola === 'ZAWODNIK' && !formData.kategoria) {
      setError('❌ Kategoria wiekowa jest wymagana dla zawodnika');
      return false;
    }
    if (formData.rola === 'ZAWODNIK' && !formData.pozycja) {
      setError('❌ Pozycja jest wymagana dla zawodnika');
      return false;
    }
    if (!formData.contractStart) {
      setError('❌ Data rozpoczęcia kontraktu jest wymagana');
      return false;
    }
    if (!formData.contractEnd) {
      setError('❌ Data zakończenia kontraktu jest wymagana');
      return false;
    }
    if (new Date(formData.contractStart) > new Date(formData.contractEnd)) {
      setError('❌ Data rozpoczęcia musi być przed datą zakończenia');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/admin/uzytkownicy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          imie: formData.imie,
          nazwisko: formData.nazwisko,
          email: formData.email,
          rola: formData.rola,
          telefon: formData.telefon,
          narodowosc: formData.narodowosc || null,
          kategoria: formData.kategoria || 'BRAK',
          pozycja: formData.pozycja || null,
          contractStart: formData.contractStart,
          contractEnd: formData.contractEnd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd podczas dodawania członka');
      }

      setSuccess(true);
      setFormData({
        imie: '',
        nazwisko: '',
        email: '',
        telefon: '',
        narodowosc: '',
        rola: 'ZAWODNIK',
        kategoria: '',
        pozycja: '',
        contractStart: '',
        contractEnd: '',
      });

      // Pokaż response message z hasłem
      if (response.status === 201) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
      }

      setTimeout(() => {
        navigate('/admin');
      }, 2500);
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
          ➕ Dodaj Nowego Członka Klubu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Wypełnij formularz aby dodać nowego zawodnika lub trenera do klubu.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Członek został pomyślnie dodany! Przekierowywanie na panel admina...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sekcja: Dane osobowe */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#424242', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 Dane Osobowe
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Imię"
                  name="imie"
                  value={formData.imie}
                  onChange={handleInputChange}
                  placeholder="np. Jan"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwisko"
                  name="nazwisko"
                  value={formData.nazwisko}
                  onChange={handleInputChange}
                  placeholder="np. Kowalski"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="np. jan.kowalski@email.com"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleInputChange}
                  placeholder="np. 123456789"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Narodowość"
                  name="narodowosc"
                  value={formData.narodowosc}
                  onChange={handleInputChange}
                  placeholder="np. Polska"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sekcja: Rola i szczegóły */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#424242', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              👤 Rola w Klubie
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Rola</InputLabel>
                  <Select
                    name="rola"
                    value={formData.rola}
                    onChange={handleSelectChange}
                    label="Rola"
                  >
                    <MenuItem value="ZAWODNIK">🏃 ZAWODNIK</MenuItem>
                    <MenuItem value="TRENER">🎯 TRENER</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Kategoria - tylko dla ZAWODNIKA */}
              {formData.rola === 'ZAWODNIK' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Kategoria Wiekowa</InputLabel>
                    <Select
                      name="kategoria"
                      value={formData.kategoria}
                      onChange={handleSelectChange}
                      label="Kategoria Wiekowa"
                    >
                      <MenuItem value="U9">U9</MenuItem>
                      <MenuItem value="U11">U11</MenuItem>
                      <MenuItem value="U13">U13</MenuItem>
                      <MenuItem value="U15">U15</MenuItem>
                      <MenuItem value="U17">U17</MenuItem>
                      <MenuItem value="U19">U19</MenuItem>
                      <MenuItem value="SENIOR">SENIOR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Pozycja - tylko dla ZAWODNIKA */}
              {formData.rola === 'ZAWODNIK' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Pozycja</InputLabel>
                    <Select
                      name="pozycja"
                      value={formData.pozycja}
                      onChange={handleSelectChange}
                      label="Pozycja"
                    >
                      <MenuItem value="BRAMKARZ">🥅 BRAMKARZ</MenuItem>
                      <MenuItem value="OBRONCA">🛡️ OBROŃCA</MenuItem>
                      <MenuItem value="POMOCNIK">🔄 POMOCNIK</MenuItem>
                      <MenuItem value="NAPASTNIK">⚽ NAPASTNIK</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Kategoria dla TRENERA */}
              {formData.rola === 'TRENER' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Kategoria Treningowa</InputLabel>
                    <Select
                      name="kategoria"
                      value={formData.kategoria}
                      onChange={handleSelectChange}
                      label="Kategoria Treningowa"
                    >
                      <MenuItem value="U9">U9</MenuItem>
                      <MenuItem value="U11">U11</MenuItem>
                      <MenuItem value="U13">U13</MenuItem>
                      <MenuItem value="U15">U15</MenuItem>
                      <MenuItem value="U17">U17</MenuItem>
                      <MenuItem value="U19">U19</MenuItem>
                      <MenuItem value="SENIOR">SENIOR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sekcja: Kontrakt */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#424242', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              📅 Kontrakt
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Rozpoczęcia"
                  name="contractStart"
                  type="date"
                  value={formData.contractStart}
                  onChange={handleInputChange}
                  inputProps={{ min: today }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Zakończenia"
                  name="contractEnd"
                  type="date"
                  value={formData.contractEnd}
                  onChange={handleInputChange}
                  inputProps={{ min: formData.contractStart || today }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              {formData.contractStart && (
                <Grid item xs={12}>
                  <Card sx={{ 
                    bgcolor: '#fff3e0', 
                    border: '2px solid #ff9800',
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
                  }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                        📊 Czas trwania kontraktu: <strong style={{ fontSize: '1.1em' }}>
                          {Math.ceil((new Date(formData.contractEnd).getTime() - new Date(formData.contractStart).getTime()) / (1000 * 60 * 60 * 24))} dni
                        </strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Przycisk wysyłania */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/admin')}
              disabled={loading}
            >
              ❌ Anuluj
            </Button>
            <Button
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ backgroundColor: '#4caf50' }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : '✅ Dodaj Członka'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AddMemberPage;
