import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { adminService, statystykiService } from '../services/api';

interface User {
  id?: string;
  _id?: string;
  imie: string;
  nazwisko: string;
  email: string;
  rola: string;
  kategoria: string;
  pozycja?: string;
}

interface StatsFormData {
  zawodnikId: string;
  sezon: string;
  zolteKartki: number;
  czerwoneKartki: number;
  rozegraneMinuty: number;
  strzeloneBramki: number;
  odbytychTreningow: number;
  czysteKonta: number;
}

const AddStatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [zawodnicy, setZawodnicy] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZawodnik, setSelectedZawodnik] = useState<User | null>(null);

  const [formData, setFormData] = useState<StatsFormData>({
    zawodnikId: '',
    sezon: new Date().getFullYear() + '/' + ((new Date().getFullYear() + 1) % 100),
    zolteKartki: 0,
    czerwoneKartki: 0,
    rozegraneMinuty: 0,
    strzeloneBramki: 0,
    odbytychTreningow: 0,
    czysteKonta: 0,
  });

  useEffect(() => {
    const fetchZawodnicy = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers();
        const allUsers = response.data.data || response.data;
        
        if (user?.rola === 'TRENER') {
          const filtered = allUsers.filter(
            (u: User) => u.rola === 'ZAWODNIK' && u.kategoria === user.kategoria
          );
          setZawodnicy(filtered);
        } else if (user?.rola === 'PREZES') {
          const filtered = allUsers.filter((u: User) => u.rola === 'ZAWODNIK');
          setZawodnicy(filtered);
        }
      } catch (err: any) {
        setError('Błąd podczas pobierania zawodników');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchZawodnicy();
  }, [user?.rola, user?.kategoria]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: name === 'zawodnikId' || name === 'sezon' ? value : Number(value),
    });
  };

  useEffect(() => {
    const fetchZawodnikData = async () => {
      if (!formData.zawodnikId) {
        setSelectedZawodnik(null);
        return;
      }

      try {
        const response = await adminService.getUserById(formData.zawodnikId);
        setSelectedZawodnik(response.data);
      } catch (err) {
        const found = zawodnicy.find(
          (z) => (z.id || z._id) === formData.zawodnikId
        );
        setSelectedZawodnik(found || null);
      }
    };

    fetchZawodnikData();
  }, [formData.zawodnikId, zawodnicy]);

  const isBramkarz = selectedZawodnik?.pozycja === 'BRAMKARZ';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.zawodnikId) {
      setError('❌ Wybierz zawodnika');
      return;
    }

    if (!formData.sezon.trim()) {
      setError('❌ Wpisz sezon');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedZawodnik = zawodnicy.find(
        (z) => (z.id || z._id) === formData.zawodnikId
      );

      await statystykiService.addStats(formData.zawodnikId, {
        sezon: formData.sezon,
        zolteKartki: formData.zolteKartki,
        czerwoneKartki: formData.czerwoneKartki,
        rozegraneMinuty: formData.rozegraneMinuty,
        strzeloneBramki: formData.strzeloneBramki,
        odbytychTreningow: formData.odbytychTreningow,
        czysteKonta: formData.czysteKonta,
      });

      setSuccess(
        `✅ Statystyki dla ${selectedZawodnik?.imie} ${selectedZawodnik?.nazwisko} zostały dodane!`
      );

      setFormData({
        zawodnikId: '',
        sezon: new Date().getFullYear() + '/' + ((new Date().getFullYear() + 1) % 100),
        zolteKartki: 0,
        czerwoneKartki: 0,
        rozegraneMinuty: 0,
        strzeloneBramki: 0,
        odbytychTreningow: 0,
        czysteKonta: 0,
      });

      setTimeout(() => navigate('/stats'), 2000);
    } catch (err: any) {
      setError(`❌ Błąd: ${err.response?.data?.message || err.message}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.rola !== 'PREZES' && user.rola !== 'TRENER')) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          ❌ Brak dostępu. Tylko PREZES i TRENER mogą dodawać statystyki.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 Dodaj Statystyki Zawodnika
      </Typography>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                options={zawodnicy}
                getOptionLabel={(option) =>
                  `${option.imie} ${option.nazwisko} (${option.kategoria})`
                }
                value={
                  zawodnicy.find((z) => (z.id || z._id) === formData.zawodnikId) || null
                }
                onChange={(_, newValue) => {
                  const newZawodnikId = newValue ? (newValue.id || newValue._id || '') : '';
                  
                  const newFormData = {
                    ...formData,
                    zawodnikId: newZawodnikId as string,
                  };
                  
                  if (newValue?.pozycja !== 'BRAMKARZ') {
                    newFormData.czysteKonta = 0;
                  }
                  
                  setFormData(newFormData);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Zawodnik" required />
                )}
                noOptionsText="Brak zawodników"
                filterOptions={(options, state) => {
                  const inputValue = state.inputValue.toLowerCase();
                  return options.filter((option) => {
                    const fullName =
                      `${option.imie} ${option.nazwisko}`.toLowerCase();
                    return fullName.includes(inputValue);
                  });
                }}
              />

              <TextField
                label="Sezon"
                name="sezon"
                value={formData.sezon}
                onChange={handleInputChange}
                placeholder="np. 2024/25"
                fullWidth
              />

              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold', mb: 1 }}>
                📋 Dane Statystyczne
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Żółte Kartki"
                    name="zolteKartki"
                    type="number"
                    value={formData.zolteKartki}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Czerwone Kartki"
                    name="czerwoneKartki"
                    type="number"
                    value={formData.czerwoneKartki}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Rozegrane Minuty"
                    name="rozegraneMinuty"
                    type="number"
                    value={formData.rozegraneMinuty}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Strzelone Bramki"
                    name="strzeloneBramki"
                    type="number"
                    value={formData.strzeloneBramki}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Odbyte Treningi"
                    name="odbytychTreningow"
                    type="number"
                    value={formData.odbytychTreningow}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Czyste Konta (bramkarz)"
                    name="czysteKonta"
                    type="number"
                    value={formData.czysteKonta}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    disabled={!isBramkarz}
                    fullWidth
                    helperText={!isBramkarz ? "Tylko dla bramkarzy" : ""}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={isSubmitting}
                  sx={{ flex: 1 }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : '➕ Dodaj Statystyki'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/stats')}
                  sx={{ flex: 1 }}
                >
                  ❌ Anuluj
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AddStatsPage;
