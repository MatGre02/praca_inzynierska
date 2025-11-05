import { Typography, Container, Box, Paper } from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon } from '@mui/icons-material';

const ContactPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
          Kontakt i Informacje o Klubie
        </Typography>

        {/* Dane Klubu */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <LocationIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5, fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Adres Klubu
              </Typography>
              <Typography variant="body1">
                Bytom Odrzański 67-115, ul.Kożuchowska 3, Polska
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <EmailIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5, fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Email
              </Typography>
              <Typography variant="body1" component="a" href="mailto:kontakt@footballclub.pl" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                pracainzynierskamg@op.pl
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <PhoneIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5, fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Telefon
              </Typography>
              <Typography variant="body1" component="a" href="tel:+48123456789" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                +48 582 123 421
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Mapka */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Lokalizacja na Mapie
          </Typography>
          <Box
            sx={{
              width: '100%',
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid #444',
            }}
          >
            <iframe
              width="100%"
              height="350"
              src="https://www.openstreetmap.org/export/embed.html?bbox=15.823772549629213%2C51.730091644892134%2C15.827313065528871%2C51.73157015205119&amp;layer=mapnik&amp;marker=51.73083090451704%2C15.82554280757904"
              style={{ border: 'none', display: 'block' }}
              title="Mapa lokalizacji klubu"
            />
          </Box>
        </Box>

        {/* Prezes */}
        <Box sx={{ borderTop: '1px solid #444', pt: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Prezes Klubu
          </Typography>
          <Typography variant="body2">
            Mateusz Greczyn<br />
            Email: <a href="mailto:mati20020@vp.pl" style={{ color: '#1976d2', textDecoration: 'none' }}>mati20020@vp.pl</a><br />
            Tel: <a href="tel:+48987654321" style={{ color: '#1976d2', textDecoration: 'none' }}>+48 987 654 321</a>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', borderTop: '1px solid #444', pt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Stworzone przez Mateusza Greczyn
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContactPage;
