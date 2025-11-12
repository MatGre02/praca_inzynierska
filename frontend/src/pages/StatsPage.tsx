import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { statystykiService, adminService } from '../services/api';

interface Statystyka {
  _id: string;
  zawodnikId: {
    _id: string;
    imie: string;
    nazwisko: string;
    kategoria: string;
    pozycja?: string;
  };
  sezon: string;
  zolteKartki: number;
  czerwoneKartki: number;
  rozegraneMinuty: number;
  strzeloneBramki: number;
  odbytychTreningow: number;
  czysteKonta: number;
}

interface Filters {
  kategorie: string[];
  pozycje: string[];
  sezony: string[];
}

const StatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Statystyka[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Statystyka> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<Filters>({ kategorie: [], pozycje: [], sezony: [] });
  const [selectedFilters, setSelectedFilters] = useState({
    sezon: '',
    kategoria: '',
    pozycja: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFilters();
    fetchStats();
  }, [user?.rola, user?.kategoria]);

  const fetchFilters = async () => {
    try {
      const response = await statystykiService.getFilters();
      if (response.data) {
        setFilters(response.data);
      }
    } catch (err) {
      console.error('Błąd pobierania filtrów:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};
      if (selectedFilters.sezon) params.sezon = selectedFilters.sezon;
      if (selectedFilters.kategoria) params.kategoria = selectedFilters.kategoria;
      if (selectedFilters.pozycja) params.pozycja = selectedFilters.pozycja;

      if (user?.rola === 'ZAWODNIK') {
        // ZAWODNIK widzi swoje statystyki z filtrami
        const response = await statystykiService.getStatsByPlayer(user._id || user.id || '', params);
        if (response.data && Array.isArray(response.data)) {
          // Backend zwraca array
          setStats(response.data);
        } else if (response.data && Object.keys(response.data).length > 0) {
          // Backend zwraca object
          setStats([response.data]);
        } else {
          setStats([]);
        }
      } else {
        // PREZES i TRENER
        const response = await statystykiService.getStats(params);
        if (response.data?.data) {
          setStats(response.data.data);
        } else if (Array.isArray(response.data)) {
          setStats(response.data);
        } else {
          setStats([]);
        }
      }
    } catch (err: any) {
      setError('Błąd podczas pobierania statystyk');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchStats();
  };

  const handleClearFilters = async () => {
    // Resetuj filtry i search
    setSelectedFilters({
      sezon: '',
      kategoria: '',
      pozycja: '',
    });
    setSearchQuery('');
    
    // Pobierz wszystkie statystyki bez filtrów
    try {
      setLoading(true);
      setError('');

      if (user?.rola === 'ZAWODNIK') {
        const response = await statystykiService.getStatsByPlayer(user._id || user.id || '');
        if (response.data && Array.isArray(response.data)) {
          setStats(response.data);
        } else if (response.data && Object.keys(response.data).length > 0) {
          setStats([response.data]);
        } else {
          setStats([]);
        }
      } else {
        // PREZES i TRENER - bez filtrów
        const response = await statystykiService.getStats({});
        if (response.data?.data) {
          setStats(response.data.data);
        } else if (Array.isArray(response.data)) {
          setStats(response.data);
        } else {
          setStats([]);
        }
      }
    } catch (err: any) {
      setError('Błąd pobierania statystyk');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canAddStats = user?.rola === 'PREZES' || user?.rola === 'TRENER';
  const canEditStats = user?.rola === 'PREZES' || user?.rola === 'TRENER';

  // Filtrowanie po tekście (imię/nazwisko)
  const getFilteredStats = () => {
    if (!searchQuery.trim()) {
      return stats;
    }
    
    const query = searchQuery.toLowerCase();
    return stats.filter(stat => {
      if (typeof stat.zawodnikId === 'string') return false;
      const fullName = `${stat.zawodnikId.imie} ${stat.zawodnikId.nazwisko}`.toLowerCase();
      return fullName.includes(query);
    });
  };

  const filteredStats = getFilteredStats();

  const handleEditClick = async (stat: Statystyka) => {
    try {
      // Pobierz aktualne dane zawodnika z serwera aby mieć najnowszą pozycję
      const zawodnikResponse = await adminService.getUserById(
        typeof stat.zawodnikId === 'string' ? stat.zawodnikId : stat.zawodnikId._id
      );
      
      // Merge aktualne dane zawodnika z danymi statystyki
      const zawodnikAtualny = zawodnikResponse.data;
      const updatedZawodnikData = {
        ...stat.zawodnikId,
        ...zawodnikAtualny,
      };

      setEditingId(stat._id);
      setEditingData({
        _id: stat._id,
        zawodnikId: { ...updatedZawodnikData } as any,
        zolteKartki: stat.zolteKartki,
        czerwoneKartki: stat.czerwoneKartki,
        rozegraneMinuty: stat.rozegraneMinuty,
        strzeloneBramki: stat.strzeloneBramki,
        odbytychTreningow: stat.odbytychTreningow,
        czysteKonta: stat.czysteKonta,
      });
    } catch (err) {
      console.error('Błąd podczas pobierania danych zawodnika:', err);
      // Fallback - użyj starych danych
      setEditingId(stat._id);
      setEditingData({
        _id: stat._id,
        zawodnikId: stat.zawodnikId,
        zolteKartki: stat.zolteKartki,
        czerwoneKartki: stat.czerwoneKartki,
        rozegraneMinuty: stat.rozegraneMinuty,
        strzeloneBramki: stat.strzeloneBramki,
        odbytychTreningow: stat.odbytychTreningow,
        czysteKonta: stat.czysteKonta,
      });
    }
  };

  const handleEditFieldChange = (field: string, value: any) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData) return;
    try {
      setIsSubmitting(true);
      await statystykiService.updateStats(editingId, {
        zolteKartki: editingData.zolteKartki,
        czerwoneKartki: editingData.czerwoneKartki,
        rozegraneMinuty: editingData.rozegraneMinuty,
        strzeloneBramki: editingData.strzeloneBramki,
        odbytychTreningow: editingData.odbytychTreningow,
        czysteKonta: editingData.czysteKonta,
      });

      // Odśwież statystyki i zaktualizuj dane zawodnika
      const updatedStats = stats.map((stat) => {
        if (stat._id === editingId) {
          // Zaktualizuj stat z nowymi danymi
          return {
            ...stat,
            zolteKartki: editingData.zolteKartki || stat.zolteKartki,
            czerwoneKartki: editingData.czerwoneKartki || stat.czerwoneKartki,
            rozegraneMinuty: editingData.rozegraneMinuty || stat.rozegraneMinuty,
            strzeloneBramki: editingData.strzeloneBramki || stat.strzeloneBramki,
            odbytychTreningow: editingData.odbytychTreningow || stat.odbytychTreningow,
            czysteKonta: editingData.czysteKonta || stat.czysteKonta,
            // Zawodnik już ma aktualne dane z editingData
            zawodnikId: (editingData.zawodnikId || stat.zawodnikId) as any,
          };
        }
        return stat;
      });
      
      setStats(updatedStats);
      setEditingId(null);
      setEditingData(null);
    } catch (err: any) {
      setError(`❌ Błąd podczas edycji: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const isBramkarz = (pozycja?: string) => pozycja === 'BRAMKARZ';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📊 Statystyki Zawodników
        </Typography>
        {canAddStats && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-stats')}
          >
            Dodaj Statystyki
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Panel filtrowania */}
      {(user?.rola === 'PREZES' || user?.rola === 'TRENER') && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🔍 Filtry
          </Typography>
          <Grid container spacing={2}>
            {filters.sezony.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sezon</InputLabel>
                  <Select
                    value={selectedFilters.sezon}
                    onChange={(e) => handleFilterChange('sezon', e.target.value)}
                    label="Sezon"
                  >
                    <MenuItem value="">Wszystkie</MenuItem>
                    {filters.sezony.map(sezon => (
                      <MenuItem key={sezon} value={sezon}>{sezon}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {user?.rola === 'PREZES' && filters.kategorie.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Kategoria</InputLabel>
                  <Select
                    value={selectedFilters.kategoria}
                    onChange={(e) => handleFilterChange('kategoria', e.target.value)}
                    label="Kategoria"
                  >
                    <MenuItem value="">Wszystkie</MenuItem>
                    {filters.kategorie.map(kategoria => (
                      <MenuItem key={kategoria} value={kategoria}>{kategoria}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {filters.pozycje.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Pozycja</InputLabel>
                  <Select
                    value={selectedFilters.pozycja}
                    onChange={(e) => handleFilterChange('pozycja', e.target.value)}
                    label="Pozycja"
                  >
                    <MenuItem value="">Wszystkie</MenuItem>
                    {filters.pozycje.map(pozycja => (
                      <MenuItem key={pozycja} value={pozycja}>{pozycja}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyFilters}
                sx={{ flex: 1, height: '56px' }}
              >
                Zastosuj
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ flex: 1, height: '56px' }}
              >
                Wyczyść
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Panel filtrowania dla ZAWODNIKA */}
      {user?.rola === 'ZAWODNIK' && filters.sezony.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🔍 Filtry Moich Statystyk
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sezon</InputLabel>
                <Select
                  value={selectedFilters.sezon}
                  onChange={(e) => handleFilterChange('sezon', e.target.value)}
                  label="Sezon"
                >
                  <MenuItem value="">Wszystkie sezony</MenuItem>
                  {filters.sezony.map(sezon => (
                    <MenuItem key={sezon} value={sezon}>{sezon}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyFilters}
                sx={{ flex: 1 }}
              >
                Pokaż
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ flex: 1 }}
              >
                Wyczyść
              </Button>
            </Grid>
          </Grid>
          {user?.kategoria && (
            <Typography variant="body2" sx={{ mt: 2, color: '#90caf9' }}>
              📋 Twoja kategoria: <strong>{user.kategoria}</strong>
            </Typography>
          )}
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats.length === 0 ? (
        <Alert severity="info">
          {user?.rola === 'ZAWODNIK'
            ? '📭 Brak twoich statystyk. Poczekaj aż PREZES lub TRENER je doda.'
            : '📭 Brak statystyk do wyświetlenia.'}
        </Alert>
      ) : (
        <>
          {(user?.rola === 'PREZES' || user?.rola === 'TRENER') && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="🔍 Szukaj zawodnika po imieniu lub nazwisku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
              />
              {filteredStats.length > 0 && filteredStats.length < stats.length && (
                <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                  Znaleziono {filteredStats.length} wyników
                </Typography>
              )}
            </Box>
          )}
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Zawodnik</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Kategoria</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sezon</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🟡 Żółte
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🔴 Czerwone
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  ⏱️ Minuty
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  ⚽ Bramki
                </TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🏋️ Treningi
                </TableCell>
                {/* Kolumna czystych kont - widoczna dla wszystkich, ale zawartość zależy od pozycji */}
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🧤 Czyste Konta
                </TableCell>
                {canEditStats && (
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Akcje
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStats.map((stat) => (
                <TableRow key={stat._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {typeof stat.zawodnikId === 'string'
                        ? 'Zawodnik'
                        : `${stat.zawodnikId.imie} ${stat.zawodnikId.nazwisko}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {typeof stat.zawodnikId === 'string' ? (
                      '—'
                    ) : (
                      <Chip
                        label={stat.zawodnikId.kategoria}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>{stat.sezon || '—'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={stat.zolteKartki}
                      size="small"
                      sx={{
                        backgroundColor: '#ffc107',
                        color: '#000',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={stat.czerwoneKartki}
                      size="small"
                      sx={{
                        backgroundColor: '#d32f2f',
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">{stat.rozegraneMinuty}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {stat.strzeloneBramki}
                  </TableCell>
                  <TableCell align="center">{stat.odbytychTreningow}</TableCell>
                  {/* Czyste konta - widoczne tylko dla bramkarzy LUB jeśli jest jakaś wartość */}
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                    {(typeof stat.zawodnikId !== 'string' && isBramkarz(stat.zawodnikId.pozycja)) || stat.czysteKonta > 0
                      ? stat.czysteKonta
                      : '—'}
                  </TableCell>
                  {canEditStats && (
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditClick(stat)}
                      >
                        Edytuj
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal edycji */}
        <Dialog open={editingId !== null} onClose={handleCancel} maxWidth="sm" fullWidth>
          <DialogTitle>📝 Edytuj Statystyki</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {editingData && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Żółte Kartki"
                    type="number"
                    value={editingData.zolteKartki || 0}
                    onChange={(e) => handleEditFieldChange('zolteKartki', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Czerwone Kartki"
                    type="number"
                    value={editingData.czerwoneKartki || 0}
                    onChange={(e) => handleEditFieldChange('czerwoneKartki', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Rozegrane Minuty"
                    type="number"
                    value={editingData.rozegraneMinuty || 0}
                    onChange={(e) => handleEditFieldChange('rozegraneMinuty', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Strzelone Bramki"
                    type="number"
                    value={editingData.strzeloneBramki || 0}
                    onChange={(e) => handleEditFieldChange('strzeloneBramki', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Odbyte Treningi"
                    type="number"
                    value={editingData.odbytychTreningow || 0}
                    onChange={(e) => handleEditFieldChange('odbytychTreningow', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Czyste Konta (bramkarz)"
                    type="number"
                    value={editingData.czysteKonta || 0}
                    onChange={(e) => handleEditFieldChange('czysteKonta', Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    disabled={typeof editingData.zawodnikId !== 'string' ? !isBramkarz(editingData.zawodnikId?.pozycja) : true}
                    helperText={typeof editingData.zawodnikId !== 'string' && !isBramkarz(editingData.zawodnikId?.pozycja) ? "Tylko dla bramkarzy" : ""}
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              ❌ Anuluj
            </Button>
            <Button onClick={handleSaveEdit} variant="contained" color="success" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : '✅ Zapisz'}
            </Button>
          </DialogActions>
        </Dialog>
        </>
      )}
    </Container>
  );
};

export default StatsPage;
