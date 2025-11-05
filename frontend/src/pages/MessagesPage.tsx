import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { adminService, mailService } from '../services/api';
import { User } from '../types';

const MessagesPage = () => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        setLoading(true);

        if (user?.rola === 'PREZES') {
          // PREZES widzi wszystkich oprócz siebie
          const response = await adminService.getUsers();
          const filtered = response.data.data.filter(
            (u: User) => (u.id || (u as any)._id) !== (user.id || (user as any)._id)
          );
          setRecipients(filtered);
        } else if (user?.rola === 'TRENER') {
          // TRENER widzi zawodników swojej kategorii + innych trenerów + PREZES-a (oprócz siebie)
          const response = await adminService.getUsers();
          const allUsers = response.data.data;
          const currentUserId = user.id || (user as any)._id;

          console.log('%c [TRENER DEBUG] Wszystkie użytkownicy:', 'color: #ff6600; font-weight: bold;', allUsers);
          console.log('%c [TRENER DEBUG] currentUserId:', 'color: #ff6600; font-weight: bold;', currentUserId);
          console.log('%c [TRENER DEBUG] user.kategoria:', 'color: #ff6600; font-weight: bold;', user.kategoria);

          const filtered = allUsers.filter((u: User) => {
            // Nie pokazuj siebie
            if ((u.id || (u as any)._id) === currentUserId) return false;
            
            // ZAWODNIK z tej samej kategorii (jeśli kategoria istnieje)
            if (u.rola === 'ZAWODNIK') {
              if (user.kategoria && u.kategoria !== user.kategoria) return false;
              return true;
            }
            
            // TRENER (oprócz siebie, co już sprawdziliśmy wyżej)
            if (u.rola === 'TRENER') return true;
            
            // PREZES
            if (u.rola === 'PREZES') return true;
            
            return false;
          });

          console.log('%c [TRENER DEBUG] Filtrowana lista:', 'color: #00ff00; font-weight: bold;', filtered);
          setRecipients(filtered);
        } else if (user?.rola === 'ZAWODNIK') {
          // ZAWODNIK widzi trenerów + PREZES-a
          // Backend sam filtruje dla ZAWODNIKA - zwraca tylko TRENER i PREZES
          const response = await adminService.getUsers();
          setRecipients(response.data.data);
        }
      } catch (err) {
        console.error('Błąd ładowania odbiorców:', err);
        setError('Nie udało się załadować listy odbiorców');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipients();
  }, [user]);

  const handleSend = async () => {
    if (selectedRecipients.length === 0 || !subject || !message) {
      setError('Wybierz co najmniej jednego odbiorcę i wypełnij wszystkie pola');
      return;
    }

    try {
      setLoading(true);

      // Konwertuj emaile na ID
      const recipientIds: string[] = [];
      for (const email of selectedRecipients) {
        const recipient = recipients.find((r) => r.email === email);
        if (recipient) {
          const recipientId = (recipient as any)._id || recipient.id;
          if (recipientId) {
            recipientIds.push(recipientId);
          }
        }
      }

      if (recipientIds.length === 0) {
        setError('Nie znaleziono wybranych odbiorców');
        return;
      }

      // Konstruowanie treści maila
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Wiadomość od: ${user?.imie} ${user?.nazwisko}</h2>
          <p><strong>Rola nadawcy:</strong> ${user?.rola}</p>
          <hr />
          <h3>${subject}</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr />
          <p style="color: #999; font-size: 0.9em;">
            Wysłane z systemu zarządzania klubem piłkarskim
          </p>
        </div>
      `;

      // Wysłanie maila - backend oczekuje listy ID odbiorców
      await mailService.send(
        recipientIds,
        `${subject} - od ${user?.imie} ${user?.nazwisko}`,
        htmlContent
      );

      setSuccess(true);
      setSubject('');
      setMessage('');
      setSelectedRecipients([]);
      setError('');

      // Ukryj success message po 3 sekundach
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Błąd wysyłania wiadomości:', err);
      setError('Nie udało się wysłać wiadomości. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientRole = (recipient: User): string => {
    if (recipient.rola === 'ZAWODNIK') {
      return `ZAWODNIK (${recipient.kategoria})`;
    }
    return recipient.rola;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          📬 Wyślij Wiadomość
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Wyślij wiadomość do osób w klubie. Będzie wysłana z maila klubowego.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Wiadomość wysłana pomyślnie!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Wybór odbiorców */}
          <FormControl fullWidth>
            <InputLabel id="recipient-label">Odbiorca (możesz wybrać kilka osób)</InputLabel>
            <Select
              labelId="recipient-label"
              id="recipient-select"
              multiple
              value={selectedRecipients}
              label="Odbiorca (możesz wybrać kilka osób)"
              onChange={(e) => setSelectedRecipients(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              disabled={loading || recipients.length === 0}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((email) => {
                    const recipient = recipients.find(r => r.email === email);
                    return (
                      <Chip
                        key={email}
                        label={recipient ? `${recipient.imie} ${recipient.nazwisko}` : email}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {recipients.map((recipient) => (
                <MenuItem key={`${recipient.email}`} value={recipient.email}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{recipient.imie} {recipient.nazwisko}</span>
                    <Chip
                      label={getRecipientRole(recipient)}
                      size="small"
                      color={recipient.rola === 'PREZES' ? 'error' : recipient.rola === 'TRENER' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Temat */}
          <TextField
            fullWidth
            label="Temat wiadomości"
            placeholder="np. Pytanie dotyczące..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
            variant="outlined"
          />

          {/* Treść */}
          <TextField
            fullWidth
            label="Treść wiadomości"
            placeholder="Napisz swoją wiadomość..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            multiline
            rows={6}
            variant="outlined"
          />

          {/* Informacja o wysyłaniu */}
          {selectedRecipients.length > 0 && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#e3f2fd', 
              borderRadius: 1,
              border: '2px solid #1976d2'
            }}>
              <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 'bold' }}>
                ℹ️ Informacja: Wiadomość zostanie wysłana z adresu klubu (pracainzynierskamg@op.pl).
                W treści będzie jasno zaznaczono, kto ją wysłał.
              </Typography>
            </Box>
          )}

          {/* Przycisk wysyłania */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSend}
              disabled={loading || selectedRecipients.length === 0 || !subject || !message}
              sx={{ backgroundColor: '#FF5722' }}
            >
              {loading ? <CircularProgress size={24} /> : '📤 Wyślij'}
            </Button>
          </Box>

          {/* Counter znaków */}
          <Typography variant="caption" color="text.secondary">
            Znaki w wiadomości: {message.length}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MessagesPage;
