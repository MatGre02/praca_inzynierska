import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { adminService, statystykiService } from '../services/api';
import { User } from '../types';

interface PlayerFilters {
  kategorie: string[];
  pozycje: string[];
}

const PlayersPage = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<PlayerFilters>({ kategorie: [], pozycje: [] });
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    position: '',
    imie: '',
    nazwisko: '',
  });

  useEffect(() => {
    if (user?.rola === 'PREZES' || user?.rola === 'TRENER') {
      fetchFilters();
      fetchPlayers();
    }
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

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};
      if (selectedFilters.category) params.kategoria = selectedFilters.category;
      if (selectedFilters.position) params.pozycja = selectedFilters.position;
      if (selectedFilters.imie) params.imie = selectedFilters.imie;
      if (selectedFilters.nazwisko) params.nazwisko = selectedFilters.nazwisko;

      const response = await adminService.getUsers(params);
      let allPlayers: any[] = [];
      
      if (response.data?.data) {
        allPlayers = response.data.data;
      } else if (Array.isArray(response.data)) {
        allPlayers = response.data;
      } else {
        allPlayers = [];
      }

      // Filtruj tylko zawodników po stronie frontend
      const players = allPlayers.filter(p => p.rola === 'ZAWODNIK');
      setPlayers(players);
    } catch (err: any) {
      setError('Błąd podczas pobierania zawodników');
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
    fetchPlayers();
  };

  const getFilteredPlayers = () => {
    let filtered = players;

    // Filtrowanie po imieniu
    if (selectedFilters.imie.trim()) {
      const imie = selectedFilters.imie.toLowerCase();
      filtered = filtered.filter(p => p.imie?.toLowerCase().includes(imie));
    }

    // Filtrowanie po nazwisku
    if (selectedFilters.nazwisko.trim()) {
      const nazwisko = selectedFilters.nazwisko.toLowerCase();
      filtered = filtered.filter(p => p.nazwisko?.toLowerCase().includes(nazwisko));
    }

    return filtered;
  };

  const filteredPlayers = getFilteredPlayers();

  const handleClearFilters = async () => {
    try {
      setLoading(true);
      setError('');

      // Pobierz wszystkich użytkowników
      const response = await adminService.getUsers({});
      let allPlayers: any[] = [];
      
      if (response.data?.data) {
        allPlayers = response.data.data;
      } else if (Array.isArray(response.data)) {
        allPlayers = response.data;
      } else {
        allPlayers = [];
      }

      // Filtruj tylko zawodników po stronie frontend
      const players = allPlayers.filter(p => p.rola === 'ZAWODNIK');
      setPlayers(players);

      // Reset filtrów na koniec
      setSelectedFilters({
        category: '',
        position: '',
        imie: '',
        nazwisko: '',
      });
    } catch (err: any) {
      setError('Błąd podczas pobierania zawodników');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.rola === 'ZAWODNIK') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Dostęp zabroniony - tylko PREZES i TRENER mogą przeglądać listę zawodników
        </Alert>
      </Container>
    );
  }

  const positionLabels: Record<string, string> = {
    BRAMKARZ: 'BRAMKARZ',
    OBRONCA: 'OBROŃCA',
    POMOCNIK: 'POMOCNIK',
    NAPASTNIK: 'NAPASTNIK',
  };

  const getPositionColor = (pozycja?: string): 'primary' | 'error' | 'warning' | 'success' | 'info' | 'default' => {
    switch (pozycja) {
      case 'BRAMKARZ':
        return 'info'; // Niebieski
      case 'OBRONCA':
        return 'primary'; // Główny niebieski
      case 'POMOCNIK':
        return 'warning'; // Pomarańczowy
      case 'NAPASTNIK':
        return 'error'; // Czerwony
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          👥 Lista Zawodników
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {user?.rola === 'PREZES' 
            ? 'Wszystkich zawodników w klubie' 
            : `Zawodników z kategorii ${user?.kategoria}`}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Panel filtrowania */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          🔍 Filtry i Wyszukiwanie
        </Typography>
        <Grid container spacing={2}>
          {/* Wyszukiwanie po imieniu */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Imię"
              placeholder="Szukaj po imieniu..."
              value={selectedFilters.imie}
              onChange={(e) => handleFilterChange('imie', e.target.value)}
              size="small"
            />
          </Grid>

          {/* Wyszukiwanie po nazwisku */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Nazwisko"
              placeholder="Szukaj po nazwisku..."
              value={selectedFilters.nazwisko}
              onChange={(e) => handleFilterChange('nazwisko', e.target.value)}
              size="small"
            />
          </Grid>

          {/* Filtr po kategorii - tylko dla PREZESA */}
          {user?.rola === 'PREZES' && filters.kategorie.length > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategoria</InputLabel>
                <Select
                  value={selectedFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Kategoria"
                >
                  <MenuItem value="">Wszystkie</MenuItem>
                  {filters.kategorie.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Filtr po pozycji */}
          {filters.pozycje.length > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Pozycja</InputLabel>
                <Select
                  value={selectedFilters.position}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                  label="Pozycja"
                >
                  <MenuItem value="">Wszystkie</MenuItem>
                  {filters.pozycje.map(pos => (
                    <MenuItem key={pos} value={pos}>
                      {positionLabels[pos] || pos}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Przyciski akcji */}
          <Grid 
            item 
            xs={12} 
            {...(user?.rola === 'TRENER' ? { sm: 6, md: 3 } : {})}
            sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'flex-end',
              ...(user?.rola === 'PREZES' ? { justifyContent: 'flex-end' } : {})
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={handleApplyFilters}
              sx={{ height: '40px', ...(user?.rola === 'TRENER' ? { flex: 1 } : {}) }}
            >
              Szukaj
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ height: '40px', ...(user?.rola === 'TRENER' ? { flex: 1 } : {}) }}
            >
              Wyczyść
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Liczba wyników */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Znaleziono: <strong>{filteredPlayers.length}</strong> zawodników
        </Typography>
      </Box>

      {/* Tabela zawodników */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredPlayers.length === 0 ? (
        <Alert severity="info">
          📭 Brak zawodników spełniających kryteria wyszukiwania
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Imię
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Nazwisko
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Email
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Kategoria
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Pozycja
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Telefon
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Narodowość
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {player.imie || '—'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {player.nazwisko || '—'}
                  </TableCell>
                  <TableCell>
                    {player.email}
                  </TableCell>
                  <TableCell>
                    {player.kategoria ? (
                      <Chip
                        label={player.kategoria}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {player.pozycja ? (
                      <Chip
                        label={positionLabels[player.pozycja] || player.pozycja}
                        size="small"
                        color={getPositionColor(player.pozycja)}
                        variant="outlined"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {player.telefon || '—'}
                  </TableCell>
                  <TableCell>
                    {player.narodowosc || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default PlayersPage;
