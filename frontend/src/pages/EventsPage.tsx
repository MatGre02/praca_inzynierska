import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Typography, Container, Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Stack, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { wydarzeniaService } from '../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventsPage.css';

const localizer = momentLocalizer(moment);

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    tytul: '',
    typ: 'TRENING',
    data: '',
    categoria: user?.kategoria || '',
    opis: '',
    lokalizacja: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

    const loadEvents = async () => {
    try {
      const response = await wydarzeniaService.getAll();
      const responseData = response.data;
      
      // Backend zwraca { total, limit, skip, data: [...] }
      const eventsArray = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      const formattedEvents = eventsArray.map((event: any) => ({
        id: event._id,
        title: event.tytul,
        start: new Date(event.data),
        end: event.dataKonca ? new Date(event.dataKonca) : new Date(new Date(event.data).getTime() + 3600000),
        resource: event,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Błąd pobierania wydarzeń:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ mt: 4 }} />;
  }

  const handleAddClick = () => {
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        tytul: formData.tytul,
        typ: formData.typ,
        data: new Date(formData.data).toISOString(),
        categoria: user?.rola === 'PREZES' ? formData.categoria : user?.kategoria,
        opis: formData.opis,
        lokalizacja: formData.lokalizacja,
      };
      
      if (editingId) {
        // Edycja
        await wydarzeniaService.update(editingId, payload);
      } else {
        // Tworzenie
        await wydarzeniaService.create(payload);
      }
      
      loadEvents();
      setOpenDialog(false);
      setEditingId(null);
      setFormData({ tytul: '', typ: 'TRENING', data: '', categoria: user?.kategoria || '', opis: '', lokalizacja: '' });
    } catch (error) {
      console.error('Błąd zapisywania wydarzenia:', error);
    }
  };

  const handleSelectEvent = (event: any) => {
    // Wczytaj świeże dane z backendu aby mieć zawsze aktualne uczestnicy
    const loadEventDetails = async () => {
      try {
        const response = await wydarzeniaService.getById(event.resource._id);
        // getById zwraca bezpośrednio Ereignis object w response.data
        setSelectedEvent(response.data);
        setShowDetails(true);
      } catch (error) {
        console.error('Błąd pobierania szczegółów:', error);
        setSelectedEvent(event.resource);
        setShowDetails(true);
      }
    };
    loadEventDetails();
  };

  const handleRSVP = async (eventId: string, wezmieUdzial: boolean) => {
    try {
      const response = await wydarzeniaService.submitRSVP(eventId, wezmieUdzial);
      
      // Backend zwraca { message, status, data: populatedEvent }
      const eventData = response.data?.data || response.data;
      
      setSelectedEvent(eventData);
      // Zamknij i otwórz dialog ponownie aby React re-renderował
      setShowDetails(false);
      setTimeout(() => {
        setSelectedEvent(eventData);
        setShowDetails(true);
      }, 100);
      
      // Odśwież listę eventów w kalendarzu
      await loadEvents();
    } catch (error: any) {
      console.error('Błąd RSVP:', error);
      alert('Błąd przy zapisywaniu udziału: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = () => {
    if (!selectedEvent) return;
    setFormData({
      tytul: selectedEvent.tytul,
      typ: selectedEvent.typ,
      data: new Date(selectedEvent.data).toISOString().slice(0, 16),
      categoria: selectedEvent.categoria,
      opis: selectedEvent.opis || '',
      lokalizacja: selectedEvent.lokalizacja || '',
    });
    setEditingId(selectedEvent._id);
    setShowDetails(false);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedEvent || !window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return;
    try {
      await wydarzeniaService.delete(selectedEvent._id);
      loadEvents();
      setShowDetails(false);
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  return (
    <>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant='h3' sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              📅 Kalendarz Wydarzeń
            </Typography>
            <Typography variant='body2' sx={{ color: '#666', mt: 1 }}>
              Wszystkie treningi, mecze i inne zdarzenia drużyny
            </Typography>
          </Box>
          {(user?.rola === 'PREZES' || user?.rola === 'TRENER') && (
            <Button 
              variant='contained' 
              color='primary' 
              onClick={handleAddClick}
              sx={{ py: 1.5, px: 3, fontSize: '1rem', fontWeight: 'bold' }}
            >
              ➕ Dodaj Wydarzenie
            </Button>
          )}
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            height: 700
          }}
        >
          <Box sx={{ height: '100%', p: 2 }} className='calendar-wrapper'>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor='start'
              endAccessor='end'
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              popup
              views={['month', 'week', 'day']}
              defaultView='month'
              toolbar
              messages={{
                today: 'Dzisiaj',
                previous: 'Poprzedni',
                next: 'Następny',
                month: 'Miesiąc',
                week: 'Tydzień',
                day: 'Dzień',
              }}
            />
          </Box>
        </Paper>
      </Container>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
      <DialogTitle>{editingId ? 'Edytuj Wydarzenie' : 'Dodaj Wydarzenie'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label='Tytul'
          value={formData.tytul}
          onChange={(e) => setFormData({ ...formData, tytul: e.target.value })}
          margin='dense'
        />
        <FormControl fullWidth margin='dense'>
          <InputLabel>Typ</InputLabel>
          <Select value={formData.typ} onChange={(e) => setFormData({ ...formData, typ: e.target.value })}>
            <MenuItem value='TRENING'>Trening</MenuItem>
            <MenuItem value='MECZ_LIGOWY'>Mecz Ligowy</MenuItem>
            <MenuItem value='MECZ_PUCHAROWY'>Mecz Pucharowy</MenuItem>
            <MenuItem value='SPARING'>Sparing</MenuItem>
            <MenuItem value='ZBIORKA'>Zbiórka</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label='Data'
          type='datetime-local'
          value={formData.data}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          margin='dense'
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          label='Lokalizacja'
          value={formData.lokalizacja}
          onChange={(e) => setFormData({ ...formData, lokalizacja: e.target.value })}
          margin='dense'
        />
        <TextField
          fullWidth
          label='Opis'
          multiline
          rows={3}
          value={formData.opis}
          onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
          margin='dense'
        />
        {user?.rola === 'PREZES' && (
          <FormControl fullWidth margin='dense'>
            <InputLabel>Kategoria</InputLabel>
            <Select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
              <MenuItem value='U9'>U9</MenuItem>
              <MenuItem value='U11'>U11</MenuItem>
              <MenuItem value='U13'>U13</MenuItem>
              <MenuItem value='U15'>U15</MenuItem>
              <MenuItem value='U17'>U17</MenuItem>
              <MenuItem value='U19'>U19</MenuItem>
              <MenuItem value='SENIOR'>SENIOR</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
        <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Anuluj</Button>
        <Button onClick={handleSave} variant='contained'>Zapisz</Button>
      </DialogActions>
    </Dialog>

    {selectedEvent && (
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{selectedEvent.tytul}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography><strong>Typ:</strong> {selectedEvent.typ}</Typography>
            <Typography><strong>Data:</strong> {moment(selectedEvent.data).format('DD.MM.YYYY HH:mm')}</Typography>
            {selectedEvent.lokalizacja && <Typography><strong>Miejsce:</strong> {selectedEvent.lokalizacja}</Typography>}
            <Typography><strong>Kategoria:</strong> {selectedEvent.categoria}</Typography>
          </Box>
          {selectedEvent.opis && (
            <Typography><strong>Opis:</strong> {selectedEvent.opis}</Typography>
          )}

          {user?.rola === 'ZAWODNIK' && selectedEvent.typ === 'TRENING' && (
            <Box sx={{ mt: 3 }}>
              {(() => {
                const userId = user?._id || user?.id;
                
                // Szukaj zawodnika w tablicy uczestnicy
                const userParticipant = selectedEvent.uczestnicy?.find((u: any) => {
                  const uczestnikId = typeof u.zawodnik === 'object' ? u.zawodnik._id : u.zawodnik;
                  return String(uczestnikId) === String(userId);
                });
                const userStatus = userParticipant?.status;
                
                return (
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    {userStatus === 'TAK' && (
                      <Typography sx={{ mb: 1, fontWeight: 'bold', color: '#4caf50', fontSize: '1.1em' }}>
                        ✓ Już bierzesz udział w tym treningu
                      </Typography>
                    )}
                    {userStatus === 'NIE' && (
                      <Typography sx={{ mb: 1, fontWeight: 'bold', color: '#f44336', fontSize: '1.1em' }}>
                        ✗ Nie bierzesz udziału w tym treningu
                      </Typography>
                    )}
                    {!userStatus && (
                      <Typography sx={{ mb: 1, fontWeight: 'bold', color: '#9e9e9e', fontSize: '1.1em' }}>
                        Jaka jest Twoja odpowiedź?
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant={userStatus === 'TAK' ? 'contained' : 'outlined'} 
                        color='success' 
                        onClick={() => handleRSVP(selectedEvent._id, true)}
                        sx={{ flex: 1 }}
                      >
                        ✓ Wezmę udział
                      </Button>
                      <Button 
                        variant={userStatus === 'NIE' ? 'contained' : 'outlined'} 
                        color='error' 
                        onClick={() => handleRSVP(selectedEvent._id, false)}
                        sx={{ flex: 1 }}
                      >
                        ✗ Nie wezmę udziału
                      </Button>
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          )}

          {(user?.rola === 'PREZES' || user?.rola === 'TRENER') && selectedEvent.typ === 'TRENING' && selectedEvent.uczestnicy && selectedEvent.uczestnicy.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography><strong>Uczestnicy ({selectedEvent.uczestnicy.length}):</strong></Typography>
              <Stack direction='row' spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {selectedEvent.uczestnicy.map((u: any) => {
                  const zawodnik = u.zawodnik;
                  const name = zawodnik?.imie ? `${zawodnik.imie} ${zawodnik.nazwisko}` : 'Nieznany';
                  const bgColor = u.status === 'TAK' ? '#4caf50' : u.status === 'NIE' ? '#f44336' : '#9e9e9e';
                  return (
                    <Chip
                      key={u.zawodnik?._id || Math.random()}
                      label={`${name} (${u.status})`}
                      sx={{ backgroundColor: bgColor, color: 'white' }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          {(user?.rola === 'PREZES' || (user?.rola === 'TRENER' && String(selectedEvent.utworzyl) === String(user?.id))) && (
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button variant='outlined' onClick={handleEdit}>Edytuj</Button>
              <Button variant='outlined' color='error' onClick={handleDelete}>Usuń</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>
    )}
    </>
  );
};

export default EventsPage;
