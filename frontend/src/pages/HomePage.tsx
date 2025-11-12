import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  Event as EventIcon,
  Groups as GroupsIcon,
  BarChart as BarChartIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  Mail as MailIcon,
} from '@mui/icons-material';

interface MenuCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const prezesMenuCards: MenuCard[] = [
    {
      id: 'players-list',
      title: 'Lista Zawodników',
      description: 'Przeglądaj listę wszystkich zawodników w klubie',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#E91E63',
      path: '/players-list',
    },
    {
      id: 'stats',
      title: 'Statystyki',
      description: 'Przeglądaj statystyki wszystkich zawodników - bramki, kartki, minuty rozegrane',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      path: '/stats',
    },
    {
      id: 'calendar',
      title: 'Kalendarz',
      description: 'Zarządzaj kalendarzem zdarzeń, treningami i meczami',
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#2196F3',
      path: '/events',
    },
    {
      id: 'squad',
      title: 'Kadra Meczowa',
      description: 'Kadra meczowa - podgląd wszystkich kadr w klubie',
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      path: '/squad',
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Zarządzaj kontami - tworzenie, edycja i usuwanie kont zawodników i trenerów',
      icon: <AdminIcon sx={{ fontSize: 40 }} />,
      color: '#F44336',
      path: '/admin',
    },
    {
      id: 'add-member',
      title: 'Dodaj Członka Klubu',
      description: 'Wprowadź dane osobowe nowego zawodnika lub trenera wraz z czasem kontraktu',
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      color: '#9C27B0',
      path: '/add-member',
    },
    {
      id: 'add-stats',
      title: 'Dodaj Statystyki',
      description: 'Dodaj szczegółowe statystyki dla zawodnika - bramki, kartki, minuty, treningi, czyste konta',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#00BCD4',
      path: '/add-stats',
    },
    {
      id: 'messages',
      title: 'Wiadomości',
      description: 'Wyślij wiadomość do zawodników, trenerów lub innych osób w klubie',
      icon: <MailIcon sx={{ fontSize: 40 }} />,
      color: '#FF5722',
      path: '/messages',
    },
    {
      id: 'contact',
      title: 'Kontakt',
      description: 'Informacje kontaktowe klubu, dane prezesa i lokalizacja na mapie',
      icon: <InfoIcon sx={{ fontSize: 40 }} />,
      color: '#673AB7',
      path: '/contact',
    },
  ];

  const trenerMenuCards: MenuCard[] = [
    {
      id: 'players-list',
      title: 'Lista Zawodników',
      description: 'Przeglądaj listę zawodników z Twojej kategorii wiekowej',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#E91E63',
      path: '/players-list',
    },
    {
      id: 'stats',
      title: 'Statystyki',
      description: 'Przeglądaj statystyki zawodników z Twojej kategorii',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      path: '/stats',
    },
    {
      id: 'calendar',
      title: 'Kalendarz',
      description: 'Zarządzaj kalendarzem zdarzeń, treningami i meczami dla Twojej kategorii',
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#2196F3',
      path: '/events',
    },
    {
      id: 'squad',
      title: 'Kadra Meczowa',
      description: 'Wybierz 18 zawodników do kadry meczowej z Twojej kategorii',
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      path: '/squad',
    },
    {
      id: 'add-stats',
      title: 'Dodaj Statystyki',
      description: 'Dodaj statystyki dla zawodnika - bramki, kartki, minuty, treningi, czyste konta',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#00BCD4',
      path: '/add-stats',
    },
    {
      id: 'messages',
      title: 'Wiadomości',
      description: 'Wyślij wiadomość do zawodników, trenerów lub prezesa',
      icon: <MailIcon sx={{ fontSize: 40 }} />,
      color: '#FF5722',
      path: '/messages',
    },
    {
      id: 'contact',
      title: 'Kontakt',
      description: 'Informacje kontaktowe klubu, dane prezesa i lokalizacja na mapie',
      icon: <InfoIcon sx={{ fontSize: 40 }} />,
      color: '#673AB7',
      path: '/contact',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Witaj, {user?.imie}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rola: <Chip label={user?.rola} color="primary" size="small" sx={{ ml: 1 }} />
        </Typography>
      </Box>

      {/* Menu dla PREZES-a */}
      {user?.rola === 'PREZES' && (
        <Grid container spacing={3}>
          {prezesMenuCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                  },
                  borderTop: `4px solid ${card.color}`,
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ color: card.color, mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate(card.path)}
                  sx={{ mt: 2, backgroundColor: card.color }}
                >
                  Przejdź
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu dla TRENERA */}
      {user?.rola === 'TRENER' && (
        <Grid container spacing={3}>
          {trenerMenuCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                  },
                  borderTop: `4px solid ${card.color}`,
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ color: card.color, mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate(card.path)}
                  sx={{ mt: 2, backgroundColor: card.color }}
                >
                  Przejdź
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu dla ZAWODNIKA */}
      {user?.rola === 'ZAWODNIK' && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                },
                borderTop: '4px solid #4CAF50',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ color: '#4CAF50', mb: 2 }}>
                  <BarChartIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Moje Statystyki
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Przeglądaj swoje statystyki - bramki, kartki, minuty, treningi
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/stats')}
                sx={{ mt: 2, backgroundColor: '#4CAF50' }}
              >
                Przejdź
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                },
                borderTop: '4px solid #2196F3',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ color: '#2196F3', mb: 2 }}>
                  <EventIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Kalendarz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Przeglądaj harmonogram treningów i meczów
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/events')}
                sx={{ mt: 2, backgroundColor: '#2196F3' }}
              >
                Przejdź
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                },
                borderTop: '4px solid #FF9800',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ color: '#FF9800', mb: 2 }}>
                  <GroupsIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Kadra Meczowa
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sprawdź czy jesteś w kadrze meczowej
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/squad')}
                sx={{ mt: 2, backgroundColor: '#FF9800' }}
              >
                Przejdź
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                },
                borderTop: '4px solid #FF5722',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ color: '#FF5722', mb: 2 }}>
                  <MailIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Wiadomości
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wyślij wiadomość do swojego trenera, innych trenerów lub prezesa
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/messages')}
                sx={{ mt: 2, backgroundColor: '#FF5722' }}
              >
                Przejdź
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
                },
                borderTop: '4px solid #673AB7',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ color: '#673AB7', mb: 2 }}>
                  <InfoIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Kontakt
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Informacje kontaktowe klubu, dane prezesa i lokalizacja
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/contact')}
                sx={{ mt: 2, backgroundColor: '#673AB7' }}
              >
                Przejdź
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default HomePage;
