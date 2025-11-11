import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { squadsService, adminService } from '../services/api';

// Inicjalizacja pdfMake
if ((pdfFonts as any).pdfMake) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

interface Player {
  _id: string;
  imie: string;
  nazwisko: string;
  pozycja?: string;
  email?: string;
}

interface Squad {
  _id: string;
  title: string;
  startingEleven: Player[];
  bench: Player[];
  categoria: string;
  createdBy: {
    _id: string;
    imie: string;
    nazwisko: string;
  };
  createdAt: string;
}

const SquadPage = () => {
  const { user } = useAuth();
  const [squadTitle, setSquadTitle] = useState('');
  const [squads, setSquads] = useState<Squad[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startingEleven, setStartingEleven] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [openPlayersDialog, setOpenPlayersDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'starting' | 'bench'>('starting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Pobierz zawodników i kadry przy zalogowaniu
  useEffect(() => {
    fetchAvailablePlayers();
    // ZAWODNIK i TRENER powinni widzieć kadry
    if (user?.rola === 'ZAWODNIK' || user?.rola === 'TRENER') {
      fetchUserSquads();
    }
    // PREZES widzi wszystkie kadry
    if (user?.rola === 'PREZES') {
      fetchUserSquads();
    }
  }, [user]);

  const fetchUserSquads = async () => {
    try {
      setLoading(true);
      const response = await squadsService.getAll();
      const squadsData = Array.isArray(response.data) ? response.data : [];
      setSquads(squadsData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlayers = async () => {
    try {
      const response = await adminService.getUsers({ rola: 'ZAWODNIK' });
      let players = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Filtruj zawodników z kategorii trenera
      if (user?.rola === 'TRENER') {
        players = players.filter((p: any) => p.kategoria === user.kategoria);
      }

      setAvailablePlayers(players);
    } catch (err: any) {
      setError('Błąd pobierania zawodników');
      console.error(err);
    }
  };

  const handleAddPlayer = (player: Player) => {
    const allCurrentPlayers = [...startingEleven, ...bench];

    if (allCurrentPlayers.find(p => p._id === player._id)) {
      setError('Zawodnik jest już w kadrze');
      return;
    }

    if (selectedSection === 'starting' && startingEleven.length < 11) {
      setStartingEleven([...startingEleven, player]);
      setError('');
    } else if (selectedSection === 'bench' && bench.length < 7) {
      setBench([...bench, player]);
      setError('');
    } else {
      setError(
        selectedSection === 'starting'
          ? 'Pierwsza jedenastka jest pełna (max 11)'
          : 'Ławka rezerwowych jest pełna (max 7)'
      );
    }
  };

  const handleRemovePlayer = (playerId: string, section: 'starting' | 'bench') => {
    if (section === 'starting') {
      setStartingEleven(startingEleven.filter(p => p._id !== playerId));
    } else {
      setBench(bench.filter(p => p._id !== playerId));
    }
    setError('');
  };

  const handleSaveSquad = async () => {
    if (!squadTitle.trim()) {
      setError('Wpisz tytuł kadry meczowej');
      return;
    }

    if (startingEleven.length === 0 || bench.length === 0) {
      setError('Kadra musi zawierać minimum 1 zawodnika w każdej sekcji');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        title: squadTitle,
        startingEleven: startingEleven.map(p => p._id),
        bench: bench.map(p => p._id),
        categoria: user?.kategoria,
      };

      await squadsService.create(data);
      setSquadTitle('');
      setStartingEleven([]);
      setBench([]);
      setError('');
      await fetchUserSquads();
    } catch (err: any) {
      setError('Błąd zapisywania kadry: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę kadrę meczową?')) {
      return;
    }

    try {
      await squadsService.delete(squadId);
      setError('');
      await fetchUserSquads();
    } catch (err: any) {
      setError('Błąd usuwania kadry: ' + (err.response?.data?.message || err.message));
    }
  };

  const generatePDF = (squadData: Squad) => {
    const docDefinition: any = {
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: 'KADRA MECZOWA',
          fontSize: 24,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          text: squadData.title,
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        {
          text: `Kategoria: ${squadData.categoria}`,
          fontSize: 12,
          margin: [0, 0, 0, 20],
        },
        {
          text: 'PIERWSZA JEDENASTKA (11 ZAWODNIKÓW)',
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['10%', '45%', '45%'],
            body: [
              ['L.p.', 'Imię i Nazwisko', 'Pozycja'],
              ...(squadData.startingEleven || []).map((player, idx) => [
                String(idx + 1),
                `${player.imie} ${player.nazwisko}`,
                player.pozycja || '-',
              ]),
            ],
          },
          margin: [0, 0, 0, 25],
        },
        {
          text: 'ŁAWKA REZERWOWYCH (7 ZAWODNIKÓW)',
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['10%', '45%', '45%'],
            body: [
              ['L.p.', 'Imię i Nazwisko', 'Pozycja'],
              ...(squadData.bench || []).map((player, idx) => [
                String(idx + 1),
                `${player.imie} ${player.nazwisko}`,
                player.pozycja || '-',
              ]),
            ],
          },
          margin: [0, 0, 0, 20],
        },
        {
          text: `Stworzył: ${squadData.createdBy.imie} ${squadData.createdBy.nazwisko}`,
          fontSize: 10,
          margin: [0, 20, 0, 0],
          alignment: 'right',
          color: '#666',
        },
      ],
    };

    const fileName = `Kadra_${squadData.categoria}_${new Date().toISOString().split('T')[0]}.pdf`;
    (pdfMake as any).createPdf(docDefinition).download(fileName);
  };

  // ZAWODNIK - view only
  if (user?.rola === 'ZAWODNIK') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            👥 Kadra Meczowa
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Możesz przeglądać kadrę meczową ze swojej kategorii i pobierać ją w formacie PDF.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchUserSquads}
            disabled={loading}
          >
            Odśwież Kadry
          </Button>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : squads.length > 0 ? (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {squads.map(squad => (
              <Grid item xs={12} key={squad._id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {squad.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {squad.startingEleven?.length || 0} + {squad.bench?.length || 0} zawodników
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => generatePDF(squad)}
                      size="small"
                    >
                      Pobierz PDF
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Brak kadr meczowych w Twojej kategorii
          </Alert>
        )}
      </Container>
    );
  }

  // PREZES - view only all squads
  if (user?.rola === 'PREZES') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            👥 Wszystkie Kadry Meczowe
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : squads.length === 0 ? (
          <Alert severity="info">Brak kadr meczowych w systemie</Alert>
        ) : (
          <Grid container spacing={2}>
            {squads.map(squad => (
              <Grid item xs={12} key={squad._id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {squad.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {squad.categoria} • Tworzy: {squad.createdBy.imie} {squad.createdBy.nazwisko}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {squad.startingEleven?.length || 0} + {squad.bench?.length || 0} zawodników
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => generatePDF(squad)}
                      size="small"
                    >
                      Pobierz PDF
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // TRENER - full management
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          👥 Zarządzanie Kadrą Meczową
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Kategorii: {user?.kategoria}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Formularz tworzenia nowej kadry */}
      {!isCreating ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsCreating(true)}
          >
            Utwórz Nową Kadrę
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📝 Nowa Kadra Meczowa
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Tytuł kadry (np. Mecz z Legią Warszawa)"
              placeholder="np. U17: Mecz z Legią Warszawa"
              value={squadTitle}
              onChange={(e) => setSquadTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Pierwsza jedenastka */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#1e1e1e' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    🏟️ Pierwsza Jedenastka ({startingEleven.length}/11)
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedSection('starting');
                      setOpenPlayersDialog(true);
                    }}
                    disabled={startingEleven.length >= 11}
                  >
                    Dodaj
                  </Button>
                </Box>

                <List>
                  {startingEleven.map((player, idx) => (
                    <ListItem
                      key={player._id}
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemovePlayer(player._id, 'starting')}
                        >
                          Usuń
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`${idx + 1}. ${player.imie} ${player.nazwisko}`}
                        secondary={player.pozycja || 'Brak pozycji'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Ławka rezerwowych */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#1e1e1e' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    🔄 Ławka Rezerwowych ({bench.length}/7)
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedSection('bench');
                      setOpenPlayersDialog(true);
                    }}
                    disabled={bench.length >= 7}
                  >
                    Dodaj
                  </Button>
                </Box>

                <List>
                  {bench.map((player, idx) => (
                    <ListItem
                      key={player._id}
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemovePlayer(player._id, 'bench')}
                        >
                          Usuń
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`${idx + 1}. ${player.imie} ${player.nazwisko}`}
                        secondary={player.pozycja || 'Brak pozycji'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>

          {/* Przyciski akcji */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsCreating(false);
                setSquadTitle('');
                setStartingEleven([]);
                setBench([]);
                setError('');
              }}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSquad}
              disabled={isSubmitting || startingEleven.length === 0 || bench.length === 0 || !squadTitle.trim()}
            >
              {isSubmitting ? <CircularProgress size={24} /> : '💾 Zapisz Kadrę'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista istniejących kadr */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : squads.length > 0 ? (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            📋 Moje Kadry Meczowe
          </Typography>
          <Grid container spacing={2}>
            {squads.map(squad => (
              <Grid item xs={12} key={squad._id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {squad.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {squad.startingEleven?.length || 0} + {squad.bench?.length || 0} zawodników
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={() => generatePDF(squad)}
                        size="small"
                      >
                        Pobierz PDF
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteSquad(squad._id)}
                        size="small"
                      >
                        Usuń
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          Brak utworzonych kadr meczowych
        </Alert>
      )}

      {/* Dialog wyboru zawodników */}
      <Dialog
        open={openPlayersDialog}
        onClose={() => setOpenPlayersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Dodaj Zawodnika do {selectedSection === 'starting' ? 'Pierwszej Jedenastki' : 'Ławki Rezerwowych'}
        </DialogTitle>
        <DialogContent>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {availablePlayers.map(player => {
              const isInSquad = [...startingEleven, ...bench].find(p => p._id === player._id);
              return (
                <ListItemButton
                  key={player._id}
                  onClick={() => {
                    handleAddPlayer(player);
                    setOpenPlayersDialog(false);
                  }}
                  disabled={!!isInSquad}
                >
                  <ListItemText
                    primary={`${player.imie} ${player.nazwisko}`}
                    secondary={player.pozycja || 'Brak pozycji'}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlayersDialog(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SquadPage;
