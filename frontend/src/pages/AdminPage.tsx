import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import { User } from '../types';

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    imie: '',
    nazwisko: '',
    telefon: '',
    rola: '',
    pozycja: '',
    kategoria: '',
    noweHaslo: '',
    noweHasloPowtorz: '',
  });

  // Tylko PREZES może być tutaj
  if (user?.rola !== 'PREZES') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
          <Alert severity="error">
            ❌ Dostęp zabroniony! Tylko PREZES ma dostęp do panelu administracyjnego.
          </Alert>
        </Paper>
      </Container>
    );
  }

  // Pobieranie listy użytkowników
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data.data);
      setError(null);
    } catch (err: any) {
      setError('Nie udało się załadować listy użytkowników');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (userData: User) => {
    setSelectedUser(userData);
    setEditForm({
      imie: userData.imie,
      nazwisko: userData.nazwisko,
      telefon: userData.telefon || '',
      rola: userData.rola,
      pozycja: userData.pozycja || '',
      kategoria: userData.kategoria || '',
      noweHaslo: '',
      noweHasloPowtorz: '',
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteOpen = (userData: User) => {
    // PREZES nie może usunąć sam siebie
    if ((userData.id || (userData as any)._id) === (user?.id || (user as any)._id)) {
      setError('❌ Nie możesz usunąć sam siebie!');
      return;
    }
    setSelectedUser(userData);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    // Walidacja hasła jeśli zmienia hasło
    if (editForm.noweHaslo || editForm.noweHasloPowtorz) {
      if (editForm.noweHaslo !== editForm.noweHasloPowtorz) {
        setError('❌ Hasła się nie zgadzają');
        return;
      }
      if (editForm.noweHaslo.length < 6) {
        setError('❌ Hasło musi mieć co najmniej 6 znaków');
        return;
      }
    }

    try {
      setLoading(true);
      const userId = selectedUser.id || (selectedUser as any)._id;

      // Aktualizuj dane użytkownika
      await adminService.updateUserRole(userId, editForm.rola);
      
      if (editForm.pozycja) {
        await adminService.updateUserPosition(userId, editForm.pozycja);
      }
      
      if (editForm.kategoria) {
        await adminService.updateUserCategory(userId, editForm.kategoria);
      }

      // Zmiana hasła jeśli podane
      if (editForm.noweHaslo) {
        await adminService.updateUserPassword(userId, editForm.noweHaslo);
      }

      setSuccess(`✅ Użytkownik ${editForm.imie} ${editForm.nazwisko} został zaktualizowany!`);
      handleEditClose();
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`❌ Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const userId = selectedUser.id || (selectedUser as any)._id;

      await adminService.deleteUser(userId);

      setSuccess(`✅ Użytkownik ${selectedUser.imie} ${selectedUser.nazwisko} został usunięty!`);
      handleDeleteClose();
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`❌ Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (rola: string) => {
    switch (rola) {
      case 'PREZES':
        return 'error';
      case 'TRENER':
        return 'warning';
      case 'ZAWODNIK':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (rola: string) => {
    switch (rola) {
      case 'PREZES':
        return '👑 PREZES';
      case 'TRENER':
        return '🎯 TRENER';
      case 'ZAWODNIK':
        return '🏃 ZAWODNIK';
      default:
        return rola;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
          ⚙️ Panel Administracyjny
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Zarządzaj użytkownikami klubu - edytuj dane i usuwaj konta.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ boxShadow: 2, borderRadius: 1 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#1976d2' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Imię i Nazwisko</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Telefon</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Rola</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Kategoria</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Pozycja</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Akcje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id || (userData as any)._id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <TableCell>
                      <strong>{userData.imie} {userData.nazwisko}</strong>
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>{userData.telefon || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(userData.rola)}
                        color={getRoleColor(userData.rola) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{userData.kategoria || '-'}</TableCell>
                    <TableCell>{userData.pozycja || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title="Edytuj użytkownika">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEditOpen(userData)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={(userData.id || (userData as any)._id) === (user?.id || (user as any)._id) ? 'Nie możesz usunąć sam siebie' : 'Usuń użytkownika'}>
                        <span>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteOpen(userData)}
                            disabled={(userData.id || (userData as any)._id) === (user?.id || (user as any)._id) || loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
          📊 Razem użytkowników: <strong>{users.length}</strong>
        </Typography>
      </Paper>

      {/* Modal edycji */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>✏️ Edytuj Użytkownika</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Imię"
            value={editForm.imie}
            onChange={(e) => setEditForm({ ...editForm, imie: e.target.value })}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Nazwisko"
            value={editForm.nazwisko}
            onChange={(e) => setEditForm({ ...editForm, nazwisko: e.target.value })}
            disabled
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rola</InputLabel>
            <Select
              value={editForm.rola}
              onChange={(e) => setEditForm({ ...editForm, rola: e.target.value })}
              label="Rola"
            >
              <MenuItem value="ZAWODNIK">🏃 ZAWODNIK</MenuItem>
              <MenuItem value="TRENER">🎯 TRENER</MenuItem>
              <MenuItem value="PREZES">👑 PREZES</MenuItem>
            </Select>
          </FormControl>

          {editForm.rola === 'ZAWODNIK' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Kategoria</InputLabel>
                <Select
                  value={editForm.kategoria}
                  onChange={(e) => setEditForm({ ...editForm, kategoria: e.target.value })}
                  label="Kategoria"
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Pozycja</InputLabel>
                <Select
                  value={editForm.pozycja}
                  onChange={(e) => setEditForm({ ...editForm, pozycja: e.target.value })}
                  label="Pozycja"
                >
                  <MenuItem value="BRAMKARZ">🥅 BRAMKARZ</MenuItem>
                  <MenuItem value="OBRONCA">🛡️ OBROŃCA</MenuItem>
                  <MenuItem value="POMOCNIK">🔄 POMOCNIK</MenuItem>
                  <MenuItem value="NAPASTNIK">⚽ NAPASTNIK</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {editForm.rola === 'TRENER' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategoria Treningowa</InputLabel>
              <Select
                value={editForm.kategoria}
                onChange={(e) => setEditForm({ ...editForm, kategoria: e.target.value })}
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
          )}

          {/* Sekcja: Zmiana Hasła */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
              🔐 Zmień Hasło (opcjonalnie)
            </Typography>
            <TextField
              fullWidth
              label="Nowe Hasło"
              name="noweHaslo"
              type="password"
              value={editForm.noweHaslo}
              onChange={(e) => setEditForm({ ...editForm, noweHaslo: e.target.value })}
              placeholder="Pozostaw puste jeśli nie chcesz zmieniać"
              sx={{ mb: 2 }}
              helperText="Min. 6 znaków"
            />
            <TextField
              fullWidth
              label="Powtórz Hasło"
              name="noweHasloPowtorz"
              type="password"
              value={editForm.noweHasloPowtorz}
              onChange={(e) => setEditForm({ ...editForm, noweHasloPowtorz: e.target.value })}
              placeholder="Powtórz nowe hasło"
              error={editForm.noweHaslo !== editForm.noweHasloPowtorz && editForm.noweHasloPowtorz !== ''}
              helperText={editForm.noweHaslo !== editForm.noweHasloPowtorz && editForm.noweHasloPowtorz !== '' ? 'Hasła się nie zgadzają' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleEditClose}>Anuluj</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Zapisz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal usuwania */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>⚠️ Potwierdź Usunięcie</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography>
              Czy na pewno chcesz usunąć użytkownika <strong>{selectedUser.imie} {selectedUser.nazwisko}</strong>?
              <br />
              <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                ⚠️ Tej operacji nie można cofnąć!
              </span>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteClose}>Anuluj</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Usuń'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
